import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const normId = (v: any) => {
  const s = String(v ?? "").trim();
  const m = s.match(/\d+/);
  return m ? String(parseInt(m[0], 10)) : s;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = String(body?.userId ?? "").trim();
    const cardId = normId(body?.cardId);

    if (!userId || !cardId) {
      return NextResponse.json({ error: "Missing userId/cardId" }, { status: 400 });
    }

    // OJO: asumo que tu modelo Prisma se llama `favorite` (tabla Favorite)
    const existing = await prisma.favorite.findFirst({
      where: { userId, cardId },
      select: { id: true },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false, cardId });
    }

    await prisma.favorite.create({ data: { userId, cardId } });
    return NextResponse.json({ favorited: true, cardId });
  } catch (e: any) {
    console.error("FAV TOGGLE ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
