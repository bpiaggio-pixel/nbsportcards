import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const favs = await prisma.favorite.findMany({
      where: { userId },
      select: { cardId: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ cardIds: favs.map((f) => f.cardId) });
  } catch (err: any) {
    console.error("FAVORITES GET ERROR:", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
