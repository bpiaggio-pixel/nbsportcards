import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const normId = (v: any) => {
  const s = String(v ?? "").trim();
  const m = s.match(/\d+/);
  return m ? String(parseInt(m[0], 10)) : s;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = String(searchParams.get("userId") ?? "").trim();
    if (!userId) return NextResponse.json({ items: [] });

    const items = await prisma.cartItem.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
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
