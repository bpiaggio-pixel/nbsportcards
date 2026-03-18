import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport = String(searchParams.get("sport") ?? "all").trim().toLowerCase();

  const where =
    sport && sport !== "all"
      ? { sport }
      : {};

  const cards = await prisma.card.findMany({
    where,
    select: {
      player: true,
    },
  });

  const players = Array.from(
    new Set(
      cards
        .map((c) => String(c.player ?? "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  return NextResponse.json({ players });
}