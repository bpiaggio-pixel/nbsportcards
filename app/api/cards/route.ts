import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") ?? "").trim();
    const sport = (searchParams.get("sport") ?? "all").trim();
    const player = (searchParams.get("player") ?? "all").trim();
    const auto = (searchParams.get("auto") ?? "all").trim();
    const sort = (searchParams.get("sort") ?? "recommended").trim();

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get("pageSize") ?? 9)));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (sport !== "all") {
      where.sport = sport;
    }

    if (player !== "all") {
      where.player = player;
    }

    if (auto === "yes") {
      where.auto = true;
    } else if (auto === "no") {
      where.auto = false;
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { player: { contains: q, mode: "insensitive" } },
      ];
    }

    let orderBy: any[] = [];

    if (sort === "price_desc") {
      orderBy = [
        { stock: "desc" },
        { priceCents: "desc" },
      ];
    } else if (sort === "price_asc") {
      orderBy = [
        { stock: "desc" },
        { priceCents: "asc" },
      ];
    } else {
      orderBy = [
        { stock: "desc" },
        { views: "desc" },
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.card.count({ where }),
      prisma.card.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
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
      }),
    ]);

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

    return NextResponse.json({ cards, total, page, pageSize });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to load cards from database", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}