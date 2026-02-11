import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = String(searchParams.get("userId") ?? "").trim();
    if (!userId) return NextResponse.json({ cardIds: [] });

    const favs = await prisma.favorite.findMany({
      where: { userId },
      select: { cardId: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ cardIds: favs.map((f) => f.cardId) });
  } catch (e: any) {
    console.error("FAV GET ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
