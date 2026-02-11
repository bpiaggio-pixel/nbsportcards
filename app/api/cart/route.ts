import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

// ✅ normaliza ids: "Card-011" -> "11"
const norm = (v: any) => {
  const s = String(v ?? "").trim();
  const m = s.match(/\d+/);
  return m ? String(parseInt(m[0], 10)) : s;
};

function toNumber(v: unknown) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

// ✅ lee stock desde data/cards.xlsx
function getStockFromExcel(cardId: string): number {
  try {
    const filePath = path.join(process.cwd(), "data", "cards.xlsx");
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });

    const wanted = norm(cardId);

    const row = rows.find((r: any) => norm(r.id) === wanted);
    if (!row) return 0;

    const stock = Math.max(0, Math.floor(toNumber(row.stock)));
    return stock;
  } catch (e) {
    console.error("STOCK READ ERROR:", e);
    // si falla leer excel, por seguridad no dejamos agregar
    return 0;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const items = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  // ✅ devolvemos normalizado para que el front matchee siempre
  return NextResponse.json({
    items: items.map((it) => ({ ...it, cardId: norm(it.cardId) })),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = String(body?.userId ?? "").trim();
    const cardId = norm(body?.cardId);
    const qtyRequested = Math.max(1, Number(body?.qty ?? 1));

    if (!userId || !cardId) {
      return NextResponse.json({ error: "Missing userId/cardId" }, { status: 400 });
    }

    const stock = getStockFromExcel(cardId);

    if (stock <= 0) {
      return NextResponse.json(
        { error: "Sin stock para esta tarjeta", stock, cardId },
        { status: 400 }
      );
    }

    // ✅ límite por stock
    const nextQty = Math.min(qtyRequested, stock);

    const item = await prisma.cartItem.upsert({
      where: { userId_cardId: { userId, cardId } },
      update: { qty: nextQty },
      create: { userId, cardId, qty: nextQty },
    });

    return NextResponse.json({ item, stock, qtyApplied: nextQty });
  } catch (e) {
    console.error("CART POST ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const cardId = norm(searchParams.get("cardId"));

    if (!userId || !cardId) {
      return NextResponse.json({ error: "Missing userId/cardId" }, { status: 400 });
    }

    await prisma.cartItem.delete({
      where: { userId_cardId: { userId, cardId } },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("CART DELETE ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

