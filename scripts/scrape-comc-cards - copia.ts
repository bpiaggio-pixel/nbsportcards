import "dotenv/config";
import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const SELLER_URL = "https://www.comc.com/Users/court84,sq,i100";

const OUT_DIR = path.join(process.cwd(), "data", "comc");
const FRONT_DIR = path.join(OUT_DIR, "front");
const BACK_DIR = path.join(OUT_DIR, "back");
const CSV_PATH = path.join(OUT_DIR, "comc-cards.csv");
const JSON_PATH = path.join(OUT_DIR, "comc-cards.json");
const DEBUG_HTML_PATH = path.join(OUT_DIR, "debug-seller-page.html");
const DEBUG_LINKS_PATH = path.join(OUT_DIR, "debug-links.json");

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function slugify(input: string) {
  return String(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 120);
}

function csvEscape(value: unknown) {
  const s = String(value ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes(";")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function absolutizeComcUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `https://www.comc.com${url}`;
  return `https://www.comc.com/${url}`;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function detectSport(title: string, extraText = "") {
  const t = `${title} ${extraText}`.toLowerCase();

  if (t.includes("pokemon")) return "pokemon";
  if (["nba","basketball","jordan","kobe","lebron","curry","durant","tatum","wembanyama","giannis","luka"].some(x => t.includes(x))) return "basketball";
  if (["nfl","football","brady","mahomes","josh allen","lamar jackson","cj stroud","burrow","herbert","swift"].some(x => t.includes(x))) return "nfl";
  if (["soccer","fifa","world cup","messi","ronaldo","maradona","mbappe","neymar","haaland"].some(x => t.includes(x))) return "soccer";
  return "soccer";
}

async function downloadImage(context: any, url: string, targetPath: string) {
  if (!url) return;
  if (fs.existsSync(targetPath)) return;

  const response = await context.request.get(url);
  if (!response.ok()) {
    throw new Error(`No se pudo descargar ${url} (${response.status()})`);
  }

  const buffer = Buffer.from(await response.body());
  fs.writeFileSync(targetPath, buffer);
}

async function extractCardLinksFromCurrentPage(page: any) {
  const links: string[] = await page.evaluate(() => {
    return [...document.querySelectorAll("a[href]")]
      .map((a) => (a as HTMLAnchorElement).href)
      .filter((h) => h.includes("/Cards/"));
  });

  return [...new Set(links.map((u) => u.split("?")[0]))];
}

async function collectListingLinks(page: any) {
  const itemLinks = new Set<string>();

  for (let pageIndex = 1; pageIndex <= 20; pageIndex++) {
    console.log(`\n📄 Página actual visible en Chrome: ${page.url()}`);
    console.log("👉 Si esta es la página correcta del seller, presioná ENTER en PowerShell para capturarla.");
    console.log("👉 Después andá manualmente a la siguiente página en Chrome y repetimos.");

    await new Promise<void>((resolve) => {
      process.stdin.resume();
      process.stdin.once("data", () => resolve());
    });

    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await page.waitForTimeout(2500);

    let html = "";
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        html = await page.content();
        break;
      } catch {
        await page.waitForTimeout(1200);
      }
    }

    if (!html) throw new Error("No pude leer el HTML porque la página seguía navegando.");
    if (pageIndex === 1) fs.writeFileSync(DEBUG_HTML_PATH, html, "utf8");

    const links = await extractCardLinksFromCurrentPage(page);

    const debugPageLinks = path.join(OUT_DIR, `debug-links-page-${pageIndex}.json`);
    fs.writeFileSync(debugPageLinks, JSON.stringify(links, null, 2), "utf8");
    fs.writeFileSync(DEBUG_LINKS_PATH, JSON.stringify(links, null, 2), "utf8");

    let addedThisPage = 0;
    for (const href of links) {
      const before = itemLinks.size;
      itemLinks.add(href);
      if (itemLinks.size > before) addedThisPage++;
    }

    console.log(`   ➕ Nuevos links en esta página: ${addedThisPage}`);
    console.log(`   📦 Total acumulado: ${itemLinks.size}`);

    console.log("¿Querés capturar otra página? ENTER = sí / escribí 'stop' = terminar");
    const answer = await new Promise<string>((resolve) => {
      process.stdin.resume();
      process.stdin.once("data", (data) => resolve(String(data).trim().toLowerCase()));
    });

    if (answer === "stop") {
      console.log("🛑 Fin manual de paginación.");
      break;
    }
  }

  return [...itemLinks];
}

function isLikelyProductUrl(url: string) {
  const lower = url.toLowerCase();
  if (!lower.includes("/cards/")) return false;
  if (!lower.includes("/users/")) return false;
  if (lower.includes(",sq,vlist") || lower.includes(",vlist")) return false;
  if (!/\d{6,}$/.test(lower)) return false;
  return true;
}

function parseComcProductFromUrl(productUrl: string) {
  const url = new URL(productUrl);
  const parts = url.pathname.split("/").filter(Boolean);

  const cardsIndex = parts.findIndex((p) => p.toLowerCase() === "cards");
  const sportRaw = cardsIndex >= 0 && parts[cardsIndex + 1] ? parts[cardsIndex + 1] : "";
  const sport = detectSport(decodeURIComponent(sportRaw));

  const titleParts =
    cardsIndex >= 0 ? parts.slice(cardsIndex + 2, Math.max(parts.length - 1, cardsIndex + 2)) : [];

  const title = decodeURIComponent(titleParts.join(" "))
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Untitled";

  const playerRaw = parts.length >= 2 ? parts[parts.length - 2] : "";
  const player = decodeURIComponent(playerRaw)
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Unknown";

const auto = /\b(signature|signatures|auto|autograph)\b/i.test(title);
  const id = parts[parts.length - 1] || "";
  const slug = slugify(title);

  return { id, title, sport, slug, player, auto };
}

function normalizeImageUrl(url: string) {
  if (!url) return "";
  const u = absolutizeComcUrl(url);

  try {
    const parsed = new URL(u);
    if (parsed.hostname.includes("img.comc.com")) {
      parsed.searchParams.set("size", "zoom");
      return parsed.toString();
    }
    return parsed.toString();
  } catch {
    return u;
  }
}

async function bestImages(page: any) {
  const imgs = await page.$$eval("img", (nodes: HTMLImageElement[]) =>
    nodes.map((img) => img.currentSrc || img.src || "").filter(Boolean)
  ).catch(() => []);

  const valid = imgs
    .map((src) => normalizeImageUrl(src))
    .filter((src) => src.includes("img.comc.com"))
    .filter((src) => !/dropdown-arrow|arrow|logo|icon|sprite|banner|social|placeholder|blank/i.test(src));

  return uniqueStrings(valid);
}

async function clickVisibleText(page: any, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const loc = page.getByText(pattern).first();
    if (await loc.isVisible().catch(() => false)) {
      await loc.click({ timeout: 4000 }).catch(() => {});
      return true;
    }
  }
  return false;
}

async function clickMainCardImage(page: any) {
  const selectors = ['img[src*="img.comc.com"]', 'img[src*="/i/"]', "img"];
  for (const selector of selectors) {
    const loc = page.locator(selector).first();
    if (await loc.isVisible().catch(() => false)) {
      await loc.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(800);
      return true;
    }
  }
  return false;
}

async function extractImages(page: any) {
  await clickMainCardImage(page);
  await clickVisibleText(page, [/view\s*\dx\s*zoomed\s*scan/i, /zoom/i]);
  await page.waitForTimeout(1200);

  const images = await bestImages(page);
  const frontBase = images[0] || "";
  const frontImage = frontBase ? frontBase.replace(/([?&])side=back\b/, "").replace(/[?&]$/, "") : "";
  const backImage = frontImage
    ? (frontImage.includes("?") ? `${frontImage}&side=back` : `${frontImage}?side=back`)
    : "";

  return { frontImage, backImage };
}

async function main() {
  ensureDir(OUT_DIR);
  ensureDir(FRONT_DIR);
  ensureDir(BACK_DIR);

  console.log("🚀 Conectando al Chrome ya abierto...");
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0] || (await context.newPage());

  console.log("🧭 Recolectando links de COMC...");
  const listingLinks = await collectListingLinks(page);

  if (listingLinks.length === 0) {
    console.log(`📄 Revisá este archivo: ${DEBUG_HTML_PATH}`);
    console.log(`🔗 Revisá este archivo: ${DEBUG_LINKS_PATH}`);
    throw new Error("No encontré links de ítems en COMC.");
  }

  const productLinks = [...new Set(listingLinks.filter(isLikelyProductUrl))];

  console.log(`✅ Se encontraron ${listingLinks.length} links totales`);
  console.log(`✅ Links de producto tras filtrar: ${productLinks.length}`);
const existingFront = new Set(
  fs.existsSync(FRONT_DIR) ? fs.readdirSync(FRONT_DIR) : []
);

const productLinksFiltered = productLinks.filter((url) => {
  const idMatch = url.match(/\/(\d+)$/);
  const id = idMatch ? idMatch[1] : "";
  return ![...existingFront].some((f) => f.includes(id));
});

console.log(`🔁 Links pendientes: ${productLinksFiltered.length}`);

  const rows: Array<{
    id: string;
    slug: string;
    title: string;
    sport: string;
    player: string;
    auto: boolean;
    image: string;
    image2: string;
    frontUrl: string;
    backUrl: string;
    productUrl: string;
    frontFile: string;
    backFile: string;
  }> = [];

  const existingBackFiles = new Set(
    fs.existsSync(BACK_DIR)
      ? fs.readdirSync(BACK_DIR).filter((name) => name.includes("-back."))
      : []
  );

  let processed = 0;

for (const productUrl of productLinksFiltered) {
    processed++;
    const parsed = parseComcProductFromUrl(productUrl);
    const id = parsed.id || `comc-${processed}`;
    const title = parsed.title;
    const sport = parsed.sport;
    const slug = parsed.slug;
    const player = parsed.player;
    const auto = parsed.auto;
    const baseName = `${slug || id}-${id}`;

    const hasCachedBack = [...existingBackFiles].some((name) =>
      name.startsWith(`${baseName}-back.`)
    );

    const productPage = await context.newPage();
    productPage.setDefaultTimeout(15000);
    productPage.setDefaultNavigationTimeout(45000);

    try {
      console.log(`\n[${processed}/${productLinksFiltered.length}] Abriendo: ${productUrl}`);

      await productPage.goto(productUrl, { waitUntil: "commit", timeout: 45000 });
      await productPage.waitForTimeout(2500);

      const { frontImage, backImage } = await extractImages(productPage);

      const frontExt = frontImage
        ? path.extname(new URL(frontImage).pathname || ".jpg") || ".jpg"
        : ".jpg";

      const backExt = backImage
        ? path.extname(new URL(backImage).pathname || ".jpg") || ".jpg"
        : ".jpg";

      const frontFile = frontImage ? `${baseName}-front${frontExt}` : "";
      const backFile = backImage ? `${baseName}-back${backExt}` : "";

      console.log(`   🏷️  ${title}`);
      console.log(`   🖼️  front: ${frontImage ? "ok" : "faltante"}`);
      console.log(`   🖼️  back:  ${backImage ? "ok" : hasCachedBack ? "cacheado" : "faltante"}`);

      if (frontImage && frontFile) {
        await downloadImage(context, frontImage, path.join(FRONT_DIR, frontFile));
      }

      if (backImage && backFile && !hasCachedBack) {
        await downloadImage(context, backImage, path.join(BACK_DIR, backFile));
        existingBackFiles.add(backFile);
      }

      rows.push({
        id,
        slug,
        title,
        sport,
        player,
        auto,
        image: frontFile,
        image2: backFile,
        frontUrl: frontImage,
        backUrl: backImage,
        productUrl,
        frontFile,
        backFile,
      });
    } catch (err) {
      console.error(`   ❌ Error en ${productUrl}`, err);
    } finally {
      await productPage.close();
    }
  }

  rows.sort((a, b) => a.title.localeCompare(b.title));

  const csvHeader = [
    "id",
    "slug",
    "title",
    "sport",
    "player",
    "auto",
    "image",
    "image2",
    "frontUrl",
    "backUrl",
    "productUrl",
    "frontFile",
    "backFile",
  ];

  const SEP = ";";
  const csvLines = [
    csvHeader.join(SEP),
    ...rows.map((row) =>
      [
        csvEscape(row.id),
        csvEscape(row.slug),
        csvEscape(row.title),
        csvEscape(row.sport),
        csvEscape(row.player),
        csvEscape(row.auto ? "si" : ""),
        csvEscape(row.image),
        csvEscape(row.image2),
        csvEscape(row.frontUrl),
        csvEscape(row.backUrl),
        csvEscape(row.productUrl),
        csvEscape(row.frontFile),
        csvEscape(row.backFile),
      ].join(SEP)
    ),
  ];

  fs.writeFileSync(CSV_PATH, "\uFEFF" + csvLines.join("\n"), "utf8");
  fs.writeFileSync(JSON_PATH, JSON.stringify(rows, null, 2), "utf8");

  console.log("\n✅ Terminado");
  console.log(`📄 CSV:  ${CSV_PATH}`);
  console.log(`📄 JSON: ${JSON_PATH}`);
  console.log(`🖼️ Frente: ${FRONT_DIR}`);
  console.log(`🖼️ Dorso:  ${BACK_DIR}`);
  console.log(`📦 Registros: ${rows.length}`);
}

main().catch((err) => {
  console.error("\nSCRAPE ERROR:", err);
  process.exit(1);
});
