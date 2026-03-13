import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeText(value: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isGreatDeal(card: any) {
  const raw = normalizeText(card.greatDeal ?? card.great_deal ?? "");
  return raw === "si" || raw === "true" || raw === "1" || raw === "x" || raw === "yes";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = String(searchParams.get("q") ?? "").trim().toLowerCase();
    const sport = String(searchParams.get("sport") ?? "all").trim().toLowerCase();
    const player = String(searchParams.get("player") ?? "all").trim();
    const auto = String(searchParams.get("auto") ?? "all").trim().toLowerCase();

    const cards = await prisma.card.findMany({
      where: {
        ...(sport !== "all" ? { sport } : {}),
        ...(player !== "all" ? { player } : {}),
        ...(auto === "yes"
          ? { auto: true }
          : auto === "no"
          ? { auto: false }
          : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { player: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    });

    const mostViewed =
      [...cards].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0] ?? null;

    const recommended =
      [...cards]
        .sort((a, b) => {
          const dealDiff = Number(isGreatDeal(b)) - Number(isGreatDeal(a));
          if (dealDiff !== 0) return dealDiff;

          const viewsDiff = (b.views ?? 0) - (a.views ?? 0);
          if (viewsDiff !== 0) return viewsDiff;

          const tA = Date.parse(a.updatedAt?.toString() ?? a.createdAt?.toString() ?? "");
          const tB = Date.parse(b.updatedAt?.toString() ?? b.createdAt?.toString() ?? "");
          const hasA = Number.isFinite(tA);
          const hasB = Number.isFinite(tB);

          if (hasA && hasB) return tB - tA;
          if (hasB && !hasA) return 1;
          if (hasA && !hasB) return -1;

          return 0;
        })
        .find((c) => c.id !== mostViewed?.id) ?? null;

    const greatDealPick =
      [...cards]
        .filter((c) => isGreatDeal(c))
        .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
        .find((c) => c.id !== mostViewed?.id && c.id !== recommended?.id) ?? null;

    return NextResponse.json({
      mostViewed,
      recommended,
      greatDealPick,
    });
  } catch (e: any) {
    console.error("CARDS HIGHLIGHTS ERROR:", e);
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}