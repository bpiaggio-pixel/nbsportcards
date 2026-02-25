import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// ✅ normaliza ids ("Card-011" -> "11")
const normId = (v: any) => {
  const s = String(v ?? "").trim();
  const m = s.match(/\d+/);
  return m ? String(parseInt(m[0], 10)) : s;
};

const ALLOWED_COUNTRIES = ["AR", "US", "ES", "IT", "DE", "FR"] as const;
type AllowedCountry = (typeof ALLOWED_COUNTRIES)[number];

const SHIPPING_USD_CENTS: Record<AllowedCountry, number> = {
  AR: 1200,
  US: 3000,
  ES: 5000,
  IT: 5000,
  DE: 5000,
  FR: 5000,
};

function normCountry(v: any) {
  return String(v ?? "").trim().toUpperCase();
}
function isAllowedCountry(code: string): code is AllowedCountry {
  return (ALLOWED_COUNTRIES as readonly string[]).includes(code);
}

/* 🔥 AGREGAMOS SOLO ESTO */
function applySaleCents(unitCents: number) {
  const SALE_ACTIVE = String(process.env.SALE_ACTIVE ?? "false") === "true";
  const SALE_PERCENT = Number(process.env.SALE_PERCENT ?? "0") || 0;

  if (!SALE_ACTIVE || SALE_PERCENT <= 0) return unitCents;

  return Math.round(unitCents * (1 - SALE_PERCENT / 100));
}

function getSportDiscountPercent(sport?: string | null): number {
  const s0 = String(sport ?? "").trim().toLowerCase();

  // normaliza nombres típicos
  let s = s0;
  if (s === "football" || s === "futbol" || s === "fútbol") s = "soccer";
  if (s === "basket") s = "basketball";

  if (s === "soccer") return 10;
  if (s === "basketball") return 5;

  return 0;
}

function applySportDiscount(unitCents: number, sport?: string | null) {
  const percent = getSportDiscountPercent(sport);
  if (percent <= 0) return unitCents;
  return Math.round(unitCents * (1 - percent / 100));
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = String(body?.userId ?? "").trim();
    const shipping = body?.shipping ?? null;

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    // shipping
    const fullName = String(shipping?.fullName ?? "").trim();
    const phone = String(shipping?.phone ?? "").trim();
    const address1 = String(shipping?.address1 ?? "").trim();
    const address2 = String(shipping?.address2 ?? "").trim();
    const city = String(shipping?.city ?? "").trim();
    const state = String(shipping?.state ?? "").trim();
    const zip = String(shipping?.zip ?? "").trim();
    const country = normCountry(shipping?.country ?? "AR");

    if (!isAllowedCountry(country)) {
      return NextResponse.json(
        { error: "Por el momento solo enviamos a: AR, US, ES, IT, DE, FR." },
        { status: 400 }
      );
    }

    if (!fullName || !phone || !address1 || !city || !state || !zip) {
      return NextResponse.json({ error: "Faltan datos de envío" }, { status: 400 });
    }

    // carrito
    const cartItemsRaw = await prisma.cartItem.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    if (cartItemsRaw.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const cartItems = cartItemsRaw.map((it) => ({
      ...it,
      cardId: normId(it.cardId),
      qty: Math.max(1, Number(it.qty ?? 1)),
    }));

    const cardIds = Array.from(new Set(cartItems.map((it) => it.cardId)));
const cards = await prisma.card.findMany({
  where: { id: { in: cardIds } },
  select: { id: true, title: true, priceCents: true, stock: true, sport: true },
});

    const byId = new Map(cards.map((c) => [c.id, c]));

    for (const it of cartItems) {
      const c = byId.get(it.cardId);
      if (!c) return NextResponse.json({ error: `La card ${it.cardId} no existe` }, { status: 400 });
      if ((c.stock ?? 0) < it.qty) {
        return NextResponse.json(
          { error: `Sin stock suficiente para "${c.title}" (stock ${c.stock}, pediste ${it.qty})` },
          { status: 400 }
        );
      }
    }

    /* 🔥 SOLO MODIFICAMOS ESTA PARTE */
const orderItems = cartItems.map((it) => {
  const c = byId.get(it.cardId)!;
  const baseUnitCents = Number(c.priceCents ?? 0);

  const unitCents = applySportDiscount(baseUnitCents, c.sport);

  return { cardId: c.id, title: c.title, unitCents, qty: it.qty };
});

    const subtotalCents = orderItems.reduce((acc, it) => acc + it.unitCents * it.qty, 0);
    const shippingCents = SHIPPING_USD_CENTS[country];
    const totalCents = subtotalCents + shippingCents;

    // crear order PENDING
    const order = await prisma.order.create({
      data: {
        userId,
        totalCents,
        currency: "USD",
        status: "PENDING" as any,
        fullName,
        phone,
        address1,
        address2: address2 || null,
        city,
        state,
        zip,
        country,
        items: { create: orderItems },
      },
      include: { items: true },
    });

return NextResponse.json({
  ok: true,
  orderId: order.id,
  debug: {
    country,
    shippingCents,
    subtotalCents,
    totalCents,
    items: orderItems.map((it) => ({
      cardId: it.cardId,
      qty: it.qty,
      unitCents: it.unitCents,
    })),
  },
});


  } catch (e: any) {
    console.error("ORDERS CREATE ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}