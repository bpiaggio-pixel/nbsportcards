import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const normId = (v: any) => {
  const s = String(v ?? "").trim();
  const m = s.match(/\d+/);
  return m ? String(parseInt(m[0], 10)) : s;
};

async function ensureUserExists(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  return !!user;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = String(body?.userId ?? "").trim();
    const cardId = normId(body?.cardId);

    if (!userId || !cardId) {
      return NextResponse.json({ error: "Missing userId/cardId" }, { status: 400 });
    }

    // ✅ prevent P2003 foreign key errors
    const okUser = await ensureUserExists(userId);
    if (!okUser) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 401 });
    }

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
