import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // ✅ clave con Prisma + SQLite

const norm = (v: any) => {
  const s = String(v ?? "").trim();
  const m = s.match(/\d+/);          // "Card-011" -> "11"
  return m ? String(parseInt(m[0], 10)) : s;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const userId = String(body.userId ?? "").trim();
    const cardId = norm(body.cardId); // ✅ guarda SIEMPRE "1","2","11",...

    if (!userId || !cardId) {
      return NextResponse.json({ error: "userId y cardId requeridos" }, { status: 400 });
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_cardId: { userId, cardId } },
      select: { id: true },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { userId_cardId: { userId, cardId } } });
      return NextResponse.json({ ok: true, favorited: false, cardId });
    }

    await prisma.favorite.create({ data: { userId, cardId } });
    return NextResponse.json({ ok: true, favorited: true, cardId });
  } catch (err: any) {
    console.error("FAVORITES TOGGLE ERROR:", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
