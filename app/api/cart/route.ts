import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const normId = (v: any) => String(v ?? "").trim();



async function ensureUserExists(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  return !!user;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = String(searchParams.get("userId") ?? "").trim();
    if (!userId) return NextResponse.json({ items: [] });

    // ✅ avoid FK-related weirdness: if user doesn't exist, act as empty cart (or 401)
    const okUser = await ensureUserExists(userId);
    if (!okUser) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 401 });
    }

const items = await prisma.cartItem.findMany({
  where: { userId },
  orderBy: { updatedAt: "desc" },
  include: {
    card: true,
  },
});

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error("CART GET ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = String(body?.userId ?? "").trim();
    const cardId = normId(body?.cardId);
    const qty = Math.max(1, Number(body?.qty ?? 1));

    if (!userId || !cardId) {
      return NextResponse.json({ error: "Missing userId/cardId" }, { status: 400 });
    }

    const okUser = await ensureUserExists(userId);
    if (!okUser) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 401 });
    }

    // 🔴 BUSCAR LA CARD Y SU STOCK
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { id: true, stock: true },
    });

    if (!card) {
      return NextResponse.json({ error: "CARD_NOT_FOUND" }, { status: 404 });
    }

    const stock = Math.max(0, Number(card.stock ?? 0));

    // 🔴 BLOQUEAR SI NO HAY STOCK
    if (stock <= 0) {
      return NextResponse.json(
        { error: "OUT_OF_STOCK" },
        { status: 400 }
      );
    }

    // 🔴 BLOQUEAR SI PIDEN MÁS QUE EL STOCK
    if (qty > stock) {
      return NextResponse.json(
        { error: "MAX_STOCK_EXCEEDED", stock },
        { status: 400 }
      );
    }

    const existing = await prisma.cartItem.findFirst({
      where: { userId, cardId },
    });

    const item = existing
      ? await prisma.cartItem.update({
          where: { id: existing.id },
          data: { qty },
        })
      : await prisma.cartItem.create({
          data: { userId, cardId, qty },
        });

    return NextResponse.json({ ok: true, item });

  } catch (e: any) {
    console.error("CART POST ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = String(searchParams.get("userId") ?? "").trim();
    const cardId = normId(searchParams.get("cardId"));

    if (!userId || !cardId) {
      return NextResponse.json({ error: "Missing userId/cardId" }, { status: 400 });
    }

    // ✅ consistent behavior
    const okUser = await ensureUserExists(userId);
    if (!okUser) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 401 });
    }

    await prisma.cartItem.deleteMany({ where: { userId, cardId } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("CART DELETE ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
