import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

type Sport = "basketball" | "soccer" | "nfl";

type Card = {
  id: string;
  sport: Sport;
  title: string;
  player: string;
  price: number;
  image?: string;

  greatDeal?: string;

  // ✅ NUEVO
  stock?: number;
};

function normalizeYes(v: unknown) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "cards.xlsx");
    const buffer = fs.readFileSync(filePath);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });

    const cards: Card[] = rows
      .map((r) => {
        const sportRaw = String(r.sport ?? "").trim().toLowerCase();
        const sport =
          sportRaw === "basketball" || sportRaw === "soccer" || sportRaw === "nfl"
            ? (sportRaw as Sport)
            : null;

        const stockNum = Math.max(0, Math.floor(Number(r.stock ?? 0)));

        return {
          id: String(r.id ?? "").trim(),
          sport: sport as Sport,
          title: String(r.title ?? "").trim(),
          player: String(r.player ?? "").trim(),
          price: Number(r.price ?? 0),
          image: String(r.image ?? "").trim() || undefined,
          greatDeal: normalizeYes(r.greatDeal),
          stock: stockNum, // ✅ viaja al front
        };
      })
      .filter((c) => c.id && c.title && c.player && c.sport);

    return NextResponse.json({ cards });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to read cards.xlsx", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
