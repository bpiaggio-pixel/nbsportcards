import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import MercadoPagoConfig, { Payment, MerchantOrder } from "mercadopago";

export const runtime = "nodejs";

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

// ✅ helper: restock de una orden (solo una vez)
async function restockOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return;

  // ✅ idempotencia: si ya está CANCELLED o PAID, no tocar stock dos veces
  // (si querés permitir cancelar una PAID, ahí es otro flujo)
  if (order.status === "CANCELLED") return;
  if (order.status === "PAID") return;

  // devolver stock
  for (const it of order.items) {
    await prisma.card.update({
      where: { id: it.cardId },
      data: { stock: { increment: it.qty } },
    });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });
}

// ✅ helper: marcar paid (idempotente)
async function markPaid(orderId: string, paymentId?: string | null, merchantOrderId?: string | null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  if (!order) return;

  // ya paid => no re-hacer nada
  if (order.status === "PAID") return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PAID",
      mpPaymentId: paymentId ?? null,
      mpMerchantOrderId: merchantOrderId ?? null,
    },
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

    if (!dataId) return NextResponse.json({ ok: true });

    // 1) payment
    if (type === "payment") {
      const paymentApi = new Payment(mp);
      const payment = await paymentApi.get({ id: String(dataId) });

      const paymentId = String(payment.id ?? "");
      const status = String(payment.status ?? "");
      const merchantOrderId = payment.order?.id ? String(payment.order.id) : null;
      const orderId = payment.external_reference ? String(payment.external_reference) : null;

      if (!orderId) return NextResponse.json({ ok: true });

      if (status === "approved") {
        await markPaid(orderId, paymentId || null, merchantOrderId || null);
      }

      // cancelled / rejected / refunded / chargeback => devolver stock + cancelar si estaba pending
      if (
        status === "rejected" ||
        status === "cancelled" ||
        status === "refunded" ||
        status === "charged_back"
      ) {
        await restockOrder(orderId);
        // guardamos ids MP aunque cancelemos
        await prisma.order.update({
          where: { id: orderId },
          data: {
            mpPaymentId: paymentId || null,
            mpMerchantOrderId: merchantOrderId || null,
          },
        }).catch(() => {});
      }

      return NextResponse.json({ ok: true });
    }

    // 2) merchant_order
    if (type === "merchant_order") {
      const moApi = new MerchantOrder(mp);
      const mo = await (moApi as any).get({ id: String(dataId) });

      const payments = Array.isArray(mo.payments) ? mo.payments : [];
      const approved = payments.find((p: any) => String(p.status) === "approved");
      const rejected = payments.find((p: any) =>
        ["rejected", "cancelled", "refunded", "charged_back"].includes(String(p.status))
      );

      const orderId = mo.external_reference ? String(mo.external_reference) : null;
      if (!orderId) return NextResponse.json({ ok: true });

      if (approved) {
        await markPaid(
          orderId,
          approved.id ? String(approved.id) : null,
          String(mo.id ?? "")
        );
      } else if (rejected) {
        await restockOrder(orderId);
        await prisma.order.update({
          where: { id: orderId },
          data: {
            mpMerchantOrderId: String(mo.id ?? ""),
            mpPaymentId: rejected.id ? String(rejected.id) : null,
          },
        }).catch(() => {});
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("MP WEBHOOK ERROR:", e);
    return NextResponse.json({ ok: true });
  }
}
