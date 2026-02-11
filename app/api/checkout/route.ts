import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import MercadoPagoConfig, { Preference } from "mercadopago";

export const runtime = "nodejs";

// ✅ normaliza ids ("Card-011" -> "11")
const normId = (v: any) => {
  const s = String(v ?? "").trim();
  const m = s.match(/\d+/);
  return m ? String(parseInt(m[0], 10)) : s;
};

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

    const body = await req.json().catch(() => ({}));
    const userId = String(body?.userId ?? "").trim();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1) Traigo carrito
    const cartItemsRaw = await prisma.cartItem.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    if (cartItemsRaw.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // ✅ normalizar ids del carrito (por si vinieran raros)
    const cartItems = cartItemsRaw.map((it) => ({
      ...it,
      cardId: normId(it.cardId),
      qty: Math.max(1, Number(it.qty ?? 1)),
    }));

    // 2) Traigo las cards desde DB
    const cardIds = Array.from(new Set(cartItems.map((it) => it.cardId)));
    const cards = await prisma.card.findMany({
      where: { id: { in: cardIds } },
      select: { id: true, title: true, priceCents: true, stock: true },
    });

    const byId = new Map(cards.map((c) => [c.id, c]));

    // 3) Validación stock (sin tocar nada todavía)
    for (const it of cartItems) {
      const c = byId.get(it.cardId);
      if (!c) {
        return NextResponse.json({ error: `La card ${it.cardId} no existe en la DB` }, { status: 400 });
      }
      if ((c.stock ?? 0) < it.qty) {
        return NextResponse.json(
          { error: `Sin stock suficiente para "${c.title}" (stock ${c.stock}, pediste ${it.qty})` },
          { status: 400 }
        );
      }
    }

    // 4) Armo items + total
    const orderItems = cartItems.map((it) => {
      const c = byId.get(it.cardId)!;
      const unitCents = Number(c.priceCents ?? 0);

      return {
        cardId: c.id,
        title: c.title,
        unitCents,
        qty: it.qty,
      };
    });

    const totalCents = orderItems.reduce((acc, it) => acc + it.unitCents * it.qty, 0);

    // 5) Transacción: descontar stock + crear orden + vaciar carrito
    const order = await prisma.$transaction(async (tx) => {
      // ✅ descuento stock con guard (evita condiciones de carrera)
      for (const it of cartItems) {
        const updated = await tx.card.updateMany({
          where: { id: it.cardId, stock: { gte: it.qty } },
          data: { stock: { decrement: it.qty } },
        });

        if (updated.count !== 1) {
          throw new Error(`Stock cambió mientras comprabas (card ${it.cardId}). Reintentá.`);
        }
      }

      const created = await tx.order.create({
        data: {
          userId,
          totalCents,
          currency: "USD",
          status: "PENDING",
          items: { create: orderItems },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { userId } });

      return created;
    });

    // 6) Crear preferencia en MercadoPago (igual que antes)
    const siteUrl = getSiteUrl();
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

    const mpPreferenceId = String(preference.id ?? "");

    // 7) Guardar mpPreferenceId en la orden
    await prisma.order.update({
      where: { id: order.id },
      data: { mpPreferenceId },
    });

    // 8) Respuesta (MISMO FORMATO que tu front espera)
    return NextResponse.json({
      ok: true,
      orderId: order.id,
      mp: {
        preferenceId: mpPreferenceId,
        initPoint: preference.init_point,
      },
    });
  } catch (e: any) {
    console.error("CHECKOUT ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
