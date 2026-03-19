import fs from "fs";
import path from "path";
import xlsx from "xlsx";

const inputXlsx = path.join(process.cwd(), "data", "cards.xlsx");
const outJson = path.join(process.cwd(), "data", "cards.json");

console.log("📦 Iniciando importación de tarjetas...");

if (!fs.existsSync(inputXlsx)) {
  console.error("❌ No encuentro data/cards.xlsx. Poné tu Excel ahí y reintentá.");
  process.exit(1);
}

console.log("📄 Leyendo Excel...");

const wb = xlsx.readFile(inputXlsx);
const sheetName = wb.SheetNames[0];
const ws = wb.Sheets[sheetName];

console.log(`📑 Usando hoja: ${sheetName}`);

// Espera columnas: id, sport, title, player, price, image
const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });

console.log(`🔢 Filas encontradas: ${rows.length}`);

let count = 0;

const cards = rows.map((r) => {
  count++;
  process.stdout.write(`\rProcesando ${count}/${rows.length}`);

  return {
    id: String(r.id).trim(),
    sport: String(r.sport).trim().toLowerCase(),
    title: String(r.title).trim(),
    player: String(r.player).trim(),
    price: Number(r.price) || 0,
    image: String(r.image).trim(),
  };
});

console.log("\n✅ Mapeo completo");

// Validación mínima
console.log("🔎 Validando datos...");

let vcount = 0;

for (const c of cards) {
  vcount++;
  process.stdout.write(`\rValidando ${vcount}/${cards.length}`);

  if (!c.id || !c.sport || !c.title || !c.player) {
    console.error("\n❌ Fila inválida:", c);
    process.exit(1);
  }
  if (c.sport !== "basketball" && c.sport !== "soccer") {
    console.error("\n❌ sport inválido (usa basketball o soccer):", c);
    process.exit(1);
  }
}

console.log("\n💾 Guardando JSON...");

fs.writeFileSync(outJson, JSON.stringify(cards, null, 2), "utf8");

console.log(`✅ OK: generé ${outJson} con ${cards.length} tarjetas.`);
