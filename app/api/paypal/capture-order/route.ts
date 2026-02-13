import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paypalFetch } from "@/lib/paypal";

export const runtime = "nodejs";

async function markPaidAndFulfill(orderId: string, paypalOrderId: string, captureId?: string | null, payerEmail?: string | null) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return;

    // idempotencia
    if ((order as any).status === "PAID") return;
    if ((order as any).status === "CANCELLED") return;

    for (const it of (order as any).items) {
      const updated = await tx.card.updateMany({
        where: { id: it.cardId, stock: { gte: it.qty } },
        data: { stock: { decrement: it.qty } },
      });

      if (updated.count !== 1) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" as any },
        });
        throw new Error(`No hay stock al aprobar pago (card ${it.cardId}). Orden cancelada.`);
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "PAID" as any,
        paypalOrderId,
        paypalCaptureId: captureId ?? null,
        paypalPayerEmail: payerEmail ?? null,
      },
    });

    await tx.cartItem.deleteMany({ where: { userId: (order as any).userId } });
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.orderId ?? "").trim();
    const paypalOrderId = String(body?.paypalOrderId ?? "").trim();

    if (!orderId || !paypalOrderId) {
      return NextResponse.json({ error: "Missing orderId/paypalOrderId" }, { status: 400 });
    }

    const capture = await paypalFetch<any>(`/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      body: JSON.stringify({}),
    });

    const status = String(capture?.status ?? "");
    const payerEmail = capture?.payer?.email_address ? String(capture.payer.email_address) : null;
    const captureId =
      capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id
        ? String(capture.purchase_units[0].payments.captures[0].id)
        : null;

    if (status === "COMPLETED") {
      await markPaidAndFulfill(orderId, paypalOrderId, captureId, payerEmail);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, status });
  } catch (e: any) {
    console.error("PAYPAL CAPTURE ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
