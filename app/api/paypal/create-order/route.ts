import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paypalFetch } from "@/lib/paypal";

// 👇 Usá el MISMO helper y criterio que en MercadoPago
// Ajustá este import al path real de tu proyecto
export const runtime = "nodejs";

const toUSD = (cents: number) => (cents / 100).toFixed(2);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.orderId ?? "").trim();

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Subtotal base (SIN descuento)
    const itemsSubtotalBaseCents = order.items.reduce((acc, it) => {
      const unit = Number((it as any).unitCents ?? 0);
      const qty = Number((it as any).qty ?? 0);
      return acc + unit * qty;
    }, 0);

    // Shipping deducido desde order.totalCents (igual que tu MP route)
    const shippingCents = Number((order as any).totalCents ?? 0) - itemsSubtotalBaseCents;

    // Necesitamos sport (o el atributo que usás para el descuento)
    const cardIds = Array.from(new Set(order.items.map((it: any) => it.cardId)));

    const cards = await prisma.card.findMany({
      where: { id: { in: cardIds } },
      select: { id: true, sport: true, title: true }, // title opcional para items
    });

    const byId = new Map(cards.map((c) => [c.id, c]));



    // Total final para PayPal (con descuento + shipping)
    const totalCents = Number(order.totalCents ?? 0);

    const created = await paypalFetch<any>("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: order.id,
            custom_id: order.id,
            amount: {
              currency_code: "USD",
              value: (totalCents / 100).toFixed(2),
            },
          },
        ],
      }),
    });

    const paypalOrderId = String(created?.id ?? "");
    if (!paypalOrderId) {
      return NextResponse.json({ error: "PayPal order id missing" }, { status: 500 });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { paypalOrderId },
    });

    return NextResponse.json({
      ok: true,
      paypalOrderId,
      totals: {
  itemsSubtotalBaseCents,
  shippingCents,
  totalCents,
},
    });
  } catch (e: any) {
    console.error("PAYPAL CREATE ORDER ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}