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

  if (s === "basketball") return "basketball";
  if (s === "soccer") return "soccer";
  if (s === "nfl") return "nfl";
  if (s === "pokemon") return "pokemon";

  if (!s || s === "unknown" || s === "unknow" || s === "other" || s === "others") {
    return "other";
  }

  return "other";
}

function normalizeYes(v: unknown) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function main() {
  console.log("📦 Iniciando importación de cards...");

  const filePath = path.join(process.cwd(), "data", "cards.xlsx");
  console.log(`📄 Buscando archivo: ${filePath}`);

  if (!fs.existsSync(filePath)) throw new Error(`No existe: ${filePath}`);

  console.log("📖 Leyendo Excel...");
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });

  console.log(`📑 Hoja detectada: ${sheetName}`);
  console.log(`🔢 Filas encontradas: ${rows.length}`);

  console.log("🗃️ Leyendo cards existentes en la base...");
  const existing = await prisma.card.findMany({ select: { id: true } });
  const exists = new Set(existing.map((x) => x.id));
  console.log(`📚 IDs existentes: ${exists.size}`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let processed = 0;

  for (const r of rows) {
    processed++;
    const percent = ((processed / rows.length) * 100).toFixed(1);

process.stdout.write(
  `\r⏳ ${processed}/${rows.length} (${percent}%) | ✔ ${created} | 🔄 ${updated} | ⏭ ${skipped}`
);

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
    const inventory_location =
      String(r.inventory_location ?? "").trim().toLowerCase() || null;
    const ships_from =
      String(r.ships_from ?? "").trim().toLowerCase() || null;

    const greatDeal = normalizeYes(r.greatDeal ?? r.great_deal);
    const auto = ["si", "yes", "true", "1"].includes(
      normalizeYes((r as any).auto)
    );

    const stock = Math.max(0, Math.floor(Number(r.stock ?? 0)));

    if (!exists.has(id)) {
      await prisma.card.create({
        data: {
          id,
          sport,
          title,
          player,
          priceCents,
          image,
          image2,
          stock,
          greatDeal,
          auto,
          inventory_location,
          ships_from,
        },
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
          inventory_location,
          ships_from,
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
          inventory_location,
          ships_from,
        },
      });

      updated++;
    }
  }

  console.log("\n✅ Import terminado");
  console.log("   - Nuevas:", created);
  console.log("   - Actualizadas:", updated);
  console.log("   - Omitidas:", skipped);
}

main()
  .catch((e) => {
    console.error("\nIMPORT ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });