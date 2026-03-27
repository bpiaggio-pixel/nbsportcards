import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const cardsDir = path.join(process.cwd(), "public", "cards");
const excelPath = path.join(process.cwd(), "data", "cards.xlsx");

// 🔥 cambiar a true cuando quieras borrar
const DELETE_FILES = false;

function getFileName(p: string) {
  return p.split("/").pop()?.toLowerCase().trim();
}

async function main() {
  console.log("📄 Leyendo Excel...");

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });

  const usedImages = new Set<string>();

  for (const r of rows) {
    const img1 = getFileName(String(r.image || ""));
    const img2 = getFileName(String(r.image2 || ""));

    if (img1) usedImages.add(img1);
    if (img2) usedImages.add(img2);
  }

  console.log(`🧠 Imágenes usadas en Excel: ${usedImages.size}`);

  const files = fs.readdirSync(cardsDir);

  let unused = [];

  for (const file of files) {
    const lower = file.toLowerCase();

    // ignorar carpetas
    if (fs.statSync(path.join(cardsDir, file)).isDirectory()) continue;

    if (!usedImages.has(lower)) {
      unused.push(file);
    }
  }

  console.log(`🗑️ Imágenes NO usadas: ${unused.length}`);

  // Mostrar algunas
  unused.slice(0, 20).forEach((f) => console.log(" -", f));

  if (DELETE_FILES) {
    console.log("\n🔥 BORRANDO ARCHIVOS...");

    for (const file of unused) {
      fs.unlinkSync(path.join(cardsDir, file));
      console.log("❌ eliminado:", file);
    }

    console.log("✅ Limpieza completa");
  } else {
    console.log("\n⚠️ Modo seguro (no borra nada)");
    console.log("👉 Cambiá DELETE_FILES = true para borrar");
  }
}

main();