import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Sport = "basketball" | "soccer" | "nfl" | "pokemon";
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
    const inventoryLocation = (searchParams.get("inventory_location") ?? "all").trim().toLowerCase();
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

if (inventoryLocation !== "all") {
  where.inventory_location = inventoryLocation;
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
    { views: "desc" },
    { updatedAt: "desc" },
    { createdAt: "desc" },
  ];
}
const total = await prisma.card.count({ where });

let rows: any[] = [];

if (sort === "price_desc" || sort === "price_asc") {
  const direction = sort === "price_desc" ? "DESC" : "ASC";

  const conditions: string[] = [];
  const values: any[] = [];

  if (sport !== "all") {
    values.push(sport);
    conditions.push(`sport = $${values.length}`);
  }

  if (player !== "all") {
    values.push(player);
    conditions.push(`player = $${values.length}`);
  }

  if (auto === "yes") {
    values.push(true);
    conditions.push(`auto = $${values.length}`);
  } else if (auto === "no") {
    values.push(false);
    conditions.push(`auto = $${values.length}`);
  }
if (inventoryLocation !== "all") {
  values.push(inventoryLocation);
  conditions.push(`inventory_location = $${values.length}`);
}

  if (q) {
    values.push(`%${q}%`);
    const idx1 = values.length;
    values.push(`%${q}%`);
    const idx2 = values.length;
    conditions.push(`(title ILIKE $${idx1} OR player ILIKE $${idx2})`);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  values.push(pageSize);
  const takeIdx = values.length;

  values.push(skip);
  const skipIdx = values.length;

  rows = await prisma.$queryRawUnsafe(
    `
    SELECT
      id,
      sport,
      title,
      player,
      "priceCents",
      image,
      image2,
      "greatDeal",
      stock,
      auto,
      views,
      "createdAt",
      "updatedAt",
  "inventory_location",
  "ships_from"
    FROM "Card"
    ${whereSql}
    ORDER BY
      CASE WHEN stock > 0 THEN 0 ELSE 1 END ASC,
      "priceCents" ${direction},
      "updatedAt" DESC
    LIMIT $${takeIdx}
    OFFSET $${skipIdx}
    `,
    ...values
  );
} else {
  rows = await prisma.card.findMany({
    where,
    orderBy: [
      { stock: "desc" },
      { views: "desc" },
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
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
  inventory_location: true,
  ships_from: true,
    },
  });
}

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
  inventory_location: c.inventory_location ?? null,
  ships_from: c.ships_from ?? null,
    }));

    return NextResponse.json({ cards, total, page, pageSize });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to load cards from database", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}