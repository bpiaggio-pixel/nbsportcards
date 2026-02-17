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

export const runtime = "nodejs"; // Prisma + node runtime

export async function GET() {
  try {
    const rows = await prisma.card.findMany({
      orderBy: { createdAt: "desc" },
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
        // si no existe en tu modelo, dejalo fuera:
        // greatDeal: true,
      },
    });

    const cards = rows.map((c) => ({
      id: c.id,
      sport: c.sport as Sport,
      title: c.title,
      player: c.player,
      price: Number((c.priceCents / 100).toFixed(2)),
      image: c.image ?? undefined,
      image2: c.image2 ?? undefined,
      greatDeal: normalizeYes(c.greatDeal),
      stock: c.stock,
      auto: c.auto,
      // si más adelante lo agregás a DB:
      // greatDeal: normalizeYes(c.greatDeal),
    }));

    return NextResponse.json({ cards });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to load cards from database", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
