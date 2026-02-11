import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import MercadoPagoConfig, { Preference } from "mercadopago";

export const runtime = "nodejs";

// URL base para back_urls + webhook
function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return url.replace(/\/$/, "");
}

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: Request) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ error: "Falta MP_ACCESS_TOKEN en env" }, { status: 500 });
    }

    const body = await req.json();
    const userId = String(body?.userId ?? "").trim();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const siteUrl = getSiteUrl();

    const result = await prisma.$transaction(async (tx) => {
      // 1) Traigo carrito
      const cartItems = await tx.cartItem.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });

      if (cartItems.length === 0) {
        throw new Error("Cart is empty");
      }

      // 2) Traigo cards desde DB (catálogo)
      const ids = [...new Set(cartItems.map((c) => String(c.cardId)))];

      const cards = await tx.card.findMany({
        where: { id: { in: ids } },
        select: { id: true, title: true, priceCents: true, stock: true },
      });

      const byId = new Map(cards.map((c) => [c.id, c]));

      // 3) Validación + armo items
      const orderItems = cartItems.map((it) => {
        const cardId = String(it.cardId);
        const qty = Math.max(1, Number(it.qty ?? 1));

        const c = byId.get(cardId);
        if (!c) throw new Error(`La card ${cardId} no existe en DB`);
        if (c.stock < qty) throw new Error(`Sin stock para "${c.title}" (stock ${c.stock}, pediste ${qty})`);

        return {
          cardId,
          title: c.title,
          unitCents: c.priceCents,
          qty,
        };
      });

      const totalCents = orderItems.reduce((acc, it) => acc + it.unitCents * it.qty, 0);

      // 4) Crear orden en DB
      const order = await tx.order.create({
        data: {
          userId,
          totalCents,
          currency: "USD",
          status: "PENDING",
          items: { create: orderItems },
        },
      });

      // 5) ✅ Reservar stock en DB de forma segura (anti-carrera)
      for (const it of orderItems) {
        const updated = await tx.card.updateMany({
          where: { id: it.cardId, stock: { gte: it.qty } },
          data: { stock: { decrement: it.qty } },
        });

        if (updated.count !== 1) {
          throw new Error(`Sin stock (race) para "${it.title}"`);
        }
      }

      // 6) Crear preferencia MercadoPago
      const pref = new Preference(mp);
      const preference = await pref.create({
        body: {
          items: orderItems.map((it) => ({
            id: it.cardId,
            title: it.title,
            quantity: it.qty,
            unit_price: Number((it.unitCents / 100).toFixed(2)),
            currency_id: "USD",
          })),

          external_reference: order.id,
          notification_url: `${siteUrl}/api/mercadopago/webhook`,

          back_urls: {
            success: `${siteUrl}/orders?status=success`,
            pending: `${siteUrl}/orders?status=pending`,
            failure: `${siteUrl}/orders?status=failure`,
          },
          auto_return: "approved",
        },
      });

      const mpPreferenceId = String((preference as any)?.id ?? "");

      // 7) Guardar mpPreferenceId
      await tx.order.update({
        where: { id: order.id },
        data: { mpPreferenceId },
      });

      // 8) Vaciar carrito
      await tx.cartItem.deleteMany({ where: { userId } });

      return {
        orderId: order.id,
        preferenceId: mpPreferenceId,
        initPoint: (preference as any)?.init_point,
      };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error("CHECKOUT ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
