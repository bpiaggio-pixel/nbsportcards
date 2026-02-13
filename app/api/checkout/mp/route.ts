import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import MercadoPagoConfig, { Preference } from "mercadopago";

export const runtime = "nodejs";

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return url.replace(/\/$/, "");
}

function usdToArs(usdCents: number) {
  const rate = Number(process.env.USD_TO_ARS || "0");
  if (!rate || rate <= 0) throw new Error("Falta USD_TO_ARS en env (ej: 1500)");
  return Math.round((usdCents / 100) * rate);
}

export async function POST(req: Request) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ error: "Falta MP_ACCESS_TOKEN en env" }, { status: 500 });
    }

const body = await req.json().catch(() => ({}));
const orderId = String(body?.orderId ?? "").trim();
const locale = String(body?.locale ?? "en").trim();

    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const siteUrl = getSiteUrl();
    const pref = new Preference(mp);

const successUrl = `${siteUrl}/${locale}/orders?status=success&orderId=${order.id}`;
const pendingUrl = `${siteUrl}/${locale}/orders?status=pending&orderId=${order.id}`;
const failureUrl = `${siteUrl}/${locale}/orders?status=failure&orderId=${order.id}`;


    // shipping "box": derivado desde total - subtotal(items)
    const itemsSubtotal = order.items.reduce((acc: number, it: any) => acc + Number(it.unitCents) * Number(it.qty), 0);
    const shippingCents = Math.max(0, Number(order.totalCents) - itemsSubtotal);

    const preference = await pref.create({
      body: {
        items: [
          ...order.items.map((it: any) => ({
            id: String(it.cardId),
            title: String(it.title),
            quantity: Number(it.qty),
            unit_price: usdToArs(Number(it.unitCents)),
            currency_id: "ARS",
          })),
          {
            id: "shipping_box",
            title: "Shipping (box)",
            quantity: 1,
            unit_price: usdToArs(shippingCents),
            currency_id: "ARS",
          },
        ],
        external_reference: order.id,
        notification_url: `${siteUrl}/api/mercadopago/webhook`,
        back_urls: { success: successUrl, pending: pendingUrl, failure: failureUrl },
      },
    });

    const mpPreferenceId = String(preference.id ?? "");
    await prisma.order.update({
      where: { id: order.id },
      data: { mpPreferenceId },
    });

    return NextResponse.json({
      ok: true,
      initPoint: preference.init_point,
      preferenceId: mpPreferenceId,
    });
  } catch (e: any) {
    console.error("MP CHECKOUT ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
