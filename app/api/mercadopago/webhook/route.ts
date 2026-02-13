import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import MercadoPagoConfig, { Payment, MerchantOrder } from "mercadopago";

export const runtime = "nodejs";

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const BAD_STATUSES = new Set(["rejected", "cancelled", "refunded", "charged_back"]);

async function markCancelled(orderId: string, paymentId?: string | null, merchantOrderId?: string | null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  if (!order) return;

  // idempotencia
  if (order.status === "PAID") return;
  if (order.status === "CANCELLED") return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      mpPaymentId: paymentId ?? null,
      mpMerchantOrderId: merchantOrderId ?? null,
    },
  });
}

/**
 * ✅ Marca PAID y aplica efectos del negocio:
 * - descuenta stock (con guard)
 * - vacía carrito
 * - guarda ids MP
 * Todo en una sola transacción e idempotente.
 */
async function markPaidAndFulfill(orderId: string, paymentId?: string | null, merchantOrderId?: string | null) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return;

    // idempotencia
    if (order.status === "PAID") return;
    if (order.status === "CANCELLED") return;

    // ✅ descontar stock con guard (evita condiciones de carrera)
    for (const it of order.items) {
      const updated = await tx.card.updateMany({
        where: { id: it.cardId, stock: { gte: it.qty } },
        data: { stock: { decrement: it.qty } },
      });

      if (updated.count !== 1) {
        // si no hay stock en el momento de aprobación, cancelamos orden y cortamos
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "CANCELLED",
            mpPaymentId: paymentId ?? null,
            mpMerchantOrderId: merchantOrderId ?? null,
          },
        });

        throw new Error(`No hay stock al aprobar pago (card ${it.cardId}). Orden cancelada.`);
      }
    }

    // ✅ marcar orden como PAID + guardar ids MP
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        mpPaymentId: paymentId ?? null,
        mpMerchantOrderId: merchantOrderId ?? null,
      },
    });

    // ✅ vaciar carrito del user
    await tx.cartItem.deleteMany({
      where: { userId: order.userId },
    });
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ ok: false, error: "Missing MP_ACCESS_TOKEN" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));

    const type = String(body?.type ?? "");
    const dataId = body?.data?.id ?? body?.id;

    // MP a veces manda cosas raras -> respondemos ok para evitar reintentos infinitos
    if (!dataId) return NextResponse.json({ ok: true });

    // 1) payment
    if (type === "payment") {
      const paymentApi = new Payment(mp);
      const payment = await paymentApi.get({ id: String(dataId) });

      const paymentId = payment.id ? String(payment.id) : null;
      const status = String(payment.status ?? "");
      const merchantOrderId = payment.order?.id ? String(payment.order.id) : null;
      const orderId = payment.external_reference ? String(payment.external_reference) : null;

      if (!orderId) return NextResponse.json({ ok: true });

      if (status === "approved") {
        await markPaidAndFulfill(orderId, paymentId, merchantOrderId);
        return NextResponse.json({ ok: true });
      }

      if (BAD_STATUSES.has(status)) {
        await markCancelled(orderId, paymentId, merchantOrderId);
        return NextResponse.json({ ok: true });
      }

      // otros estados: pending/in_process/etc -> no hacemos nada
      return NextResponse.json({ ok: true });
    }

    // 2) merchant_order
    if (type === "merchant_order") {
      const moApi = new MerchantOrder(mp);
      const mo = await (moApi as any).get({ id: String(dataId) });

      const payments = Array.isArray(mo.payments) ? mo.payments : [];
      const approved = payments.find((p: any) => String(p.status) === "approved");
      const rejected = payments.find((p: any) => BAD_STATUSES.has(String(p.status)));

      const orderId = mo.external_reference ? String(mo.external_reference) : null;
      if (!orderId) return NextResponse.json({ ok: true });

      if (approved) {
        await markPaidAndFulfill(
          orderId,
          approved.id ? String(approved.id) : null,
          String(mo.id ?? "")
        );
        return NextResponse.json({ ok: true });
      }

      if (rejected) {
        await markCancelled(
          orderId,
          rejected.id ? String(rejected.id) : null,
          String(mo.id ?? "")
        );
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("MP WEBHOOK ERROR:", e);
    // Respondemos ok para que MP no reintente eternamente
    return NextResponse.json({ ok: true });
  }
}
