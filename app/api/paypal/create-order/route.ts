import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paypalFetch } from "@/lib/paypal";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.orderId ?? "").trim();
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const total = (Number(order.totalCents) / 100).toFixed(2);

    const pp = await paypalFetch<{ id: string }>("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: order.id,
            custom_id: order.id,
            amount: { currency_code: "USD", value: total },
          },
        ],
      }),
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paypalOrderId: pp.id },
    });

    return NextResponse.json({ ok: true, paypalOrderId: pp.id });
  } catch (e: any) {
    console.error("PAYPAL CREATE ORDER ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
