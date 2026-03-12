import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Sport = "basketball" | "soccer" | "nfl";

function normalizeYes(v: unknown) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await prisma.card.findMany({
      orderBy: [
        { views: "desc" },
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
      take: 20,
      select: {
        id: true,
        sport: true,
        title: true,
        player: true,
        priceCents: true,
        image: true,
        image2: true,
        greatDeal: true,
        stock: true,
        auto: true,
        views: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const cards = rows.map((c) => ({
      id: c.id,
      sport: c.sport as Sport,
      title: c.title,
      player: c.player,
      price: Number((c.priceCents / 100).toFixed(2)),
      priceCents: c.priceCents,
      image: c.image ?? undefined,
      image2: c.image2 ?? undefined,
      greatDeal: normalizeYes(c.greatDeal),
      stock: c.stock,
      auto: c.auto,
      views: c.views,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({ cards });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to load top showcase cards", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}