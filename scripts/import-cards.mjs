import fs from "fs";
import path from "path";
import xlsx from "xlsx";

const inputXlsx = path.join(process.cwd(), "data", "cards.xlsx");
const outJson = path.join(process.cwd(), "data", "cards.json");

if (!fs.existsSync(inputXlsx)) {
  console.error("No encuentro data/cards.xlsx. Poné tu Excel ahí y reintentá.");
  process.exit(1);
}

const wb = xlsx.readFile(inputXlsx);
const sheetName = wb.SheetNames[0];
const ws = wb.Sheets[sheetName];

// Espera columnas: id, sport, title, player, price, image
const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });

const cards = rows.map((r) => ({
  id: String(r.id).trim(),
  sport: String(r.sport).trim().toLowerCase(), // basketball / soccer
  title: String(r.title).trim(),
  player: String(r.player).trim(),
  price: Number(r.price) || 0,
  image: String(r.image).trim(), // opcional (puede quedar vacío)
}));

// Validación mínima
for (const c of cards) {
  if (!c.id || !c.sport || !c.title || !c.player) {
    console.error("Fila inválida:", c);
    process.exit(1);
  }
  if (c.sport !== "basketball" && c.sport !== "soccer") {
    console.error("sport inválido (usa basketball o soccer):", c);
    process.exit(1);
  }
}

fs.writeFileSync(outJson, JSON.stringify(cards, null, 2), "utf8");
console.log(`OK: generé ${outJson} con ${cards.length} tarjetas.`);
