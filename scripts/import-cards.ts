import "dotenv/config";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const normId = (v: any) => {
  const s = String(v ?? "").trim();
  const m = s.match(/\d+/);
  return m ? String(parseInt(m[0], 10)) : s;
};

function toSport(v: any) {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "basketball" || s === "soccer" || s === "nfl") return s;
  return "basketball";
}

function normalizeYes(v: unknown) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function main() {
  const filePath = path.join(process.cwd(), "data", "cards.xlsx");
  if (!fs.existsSync(filePath)) throw new Error(`No existe: ${filePath}`);

  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });

  // Para NO pisar stock de cards existentes:
  const existing = await prisma.card.findMany({ select: { id: true } });
  const exists = new Set(existing.map((x) => x.id));

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const r of rows) {
    const id = normId(r.id);
    if (!id) {
      skipped++;
      continue;
    }

    const sport = toSport(r.sport);
    const title = String(r.title ?? id).trim() || id;
    const player = String(r.player ?? "").trim() || "Unknown";
    const price = Number(r.price ?? 0);
    const priceCents = Math.round(price * 100);
    const image = String(r.image ?? "").trim() || null;
    const image2 = String(r.image2 ?? "").trim() || null;

    // ✅ acepta ambos nombres de columna
    const greatDeal = normalizeYes(r.greatDeal ?? r.great_deal);

    // ✅ autógrafo: columna "auto" (si / vacío)
    const auto = ["si", "yes", "true", "1"].includes(normalizeYes((r as any).auto));

    // stock SOLO para nuevas
    const stock = Math.max(0, Math.floor(Number(r.stock ?? 0)));

    if (!exists.has(id)) {
      await prisma.card.create({
        data: { id, sport, title, player, priceCents, image, image2, stock, greatDeal, auto },
      });
      exists.add(id);
      created++;
    } else {
   await prisma.card.upsert({
  where: { id },
  update: {
    sport,
    title,
    player,
    priceCents,
    image,
    image2,
    greatDeal,
    stock,
    auto,
  },
  create: {
    id,
    sport,
    title,
    player,
    priceCents,
    image,
    image2,
    greatDeal,
    stock,
    auto,
  },
});

      updated++;
    }
  }

  console.log("✅ Import terminado");
  console.log("   - Nuevas:", created);
  console.log("   - Actualizadas:", updated);
  console.log("   - Omitidas:", skipped);
}

main()
  .catch((e) => {
    console.error("IMPORT ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
