import "dotenv/config";
import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const SELLER_URL =
  "https://www.fanaticscollect.com/marketplace?type=FIXED&sellerId=a72ca462-242f-42c0-9f62-01568c73e9a8&excludeListing=30eb88a3-0c4e-4210-a9b8-b4f82487cf07";

const OUT_DIR = path.join(process.cwd(), "data", "fanatics");
const FRONT_DIR = path.join(OUT_DIR, "front");
const BACK_DIR = path.join(OUT_DIR, "back");
const CSV_PATH = path.join(OUT_DIR, "fanatics-cards.csv");
const JSON_PATH = path.join(OUT_DIR, "fanatics-cards.json");
const DEBUG_ALGOLIA_REQUEST = path.join(OUT_DIR, "debug-algolia-request.json");
const DEBUG_ALGOLIA_PAGE0 = path.join(OUT_DIR, "debug-algolia-page0.json");

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

function detectSport(title: string) {
  const t = title.toLowerCase();

  if (t.includes("pokemon")) return "pokemon";

  const basketballHints = [
    "nba",
    "basketball",
    "michael jordan",
    "jordan",
    "kobe",
    "lebron",
    "stephen curry",
    "curry",
    "kevin durant",
    "durant",
    "jayson tatum",
    "tatum",
    "wembanyama",
    "giannis",
    "luka",
    "anthony edwards",
    "ja morant",
    "zion",
  ];
  if (basketballHints.some((x) => t.includes(x))) return "basketball";

  const nflHints = [
    "nfl",
    "football",
    "tom brady",
    "mahomes",
    "josh allen",
    "lamar jackson",
    "cj stroud",
    "jayden daniels",
    "burrow",
    "herbert",
    "d'andre swift",
    "prizm football",
    "optic football",
  ];
  if (nflHints.some((x) => t.includes(x))) return "nfl";

  const soccerHints = [
    "soccer",
    "fifa",
    "world cup",
    "football foil",
    "lionel messi",
    "messi",
    "cristiano ronaldo",
    "ronaldo",
    "diego maradona",
    "maradona",
    "julian alvarez",
    "mbappe",
    "neymar",
    "haaland",
    "batistuta",
  ];
  if (soccerHints.some((x) => t.includes(x))) return "soccer";

  return "soccer";
}

function csvEscape(value: unknown) {
  const s = String(value ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes(";")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function pickFrontBackImagesFromAlgoliaHit(hit: any) {
  const primarySmall = hit?.images?.primary?.small || "";
  const primaryThumb = hit?.images?.primary?.thumbnail || "";

  const candidates = uniqueStrings([primarySmall, primaryThumb]).filter(
    (u) => !/thumbnail/i.test(u) && !/avatar/i.test(u) && !/icon/i.test(u)
  );

  const frontImage = candidates[0] ?? "";
  const backImage = "";
  return { frontImage, backImage };
}

function replaceOrAppendPageInParams(params: string, page: number) {
  const usp = new URLSearchParams(params);
  usp.set("page", String(page));
  return usp.toString();
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

async function extractFrontBackFromProductPage(page: any, productUrl: string) {
  await page.goto(productUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(2500);

  const urls = new Set<string>();

  const domImages = await page
    .$$eval("img", (imgs: HTMLImageElement[]) =>
      imgs.map((img) => img.currentSrc || img.src || "").filter(Boolean)
    )
    .catch(() => []);

  for (const url of domImages) {
    if (
      /cdn-vault\.fanaticscollect\.com/i.test(url) ||
      /pwcc-vault/i.test(url)
    ) {
      urls.add(url);
    }
  }

  const html = await page.content();
  const regex =
    /https:\/\/(?:cdn-vault\.fanaticscollect\.com|s3-us-west-2\.amazonaws\.com\/pwcc-vault)\/[^"' )\]]+\.(?:jpg|jpeg|png|webp)/gi;

  const matches = html.match(regex) ?? [];
  for (const url of matches) {
    urls.add(url);
  }

  const filtered = [...new Set([...urls])].filter(
    (u) => !/thumbnail/i.test(u) && !/avatar/i.test(u) && !/icon/i.test(u)
  );

  return {
    frontImage: filtered[0] ?? "",
    backImage: filtered[1] ?? "",
    allImages: filtered,
  };
}

async function captureAlgoliaConfig(page: any) {
  console.log("🌐 Abriendo página del seller para capturar request de Algolia...");

  const algoliaRequestPromise = page.waitForRequest(
    (request: any) => {
      const url = request.url();
      return (
        request.method() === "POST" &&
        url.includes("algolia") &&
        url.includes("/1/indexes/*/queries")
      );
    },
    { timeout: 30000 }
  );

  await page.goto(SELLER_URL, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(8000);

  const req = await algoliaRequestPromise;
  const url = req.url();
  const headers = req.headers();
  const postData = req.postData();

  if (!postData) {
    throw new Error("No pude capturar el body de la request de Algolia.");
  }

  const body = JSON.parse(postData);

  fs.writeFileSync(
    DEBUG_ALGOLIA_REQUEST,
    JSON.stringify({ url, headers, body }, null, 2),
    "utf8"
  );
  console.log(`💾 Guardé debug de Algolia en: ${DEBUG_ALGOLIA_REQUEST}`);

  return { url, headers, body };
}

async function fetchAlgoliaPage(
  context: any,
  requestUrl: string,
  requestHeaders: Record<string, string>,
  requestBody: any,
  pageIndex: number
) {
  const body = JSON.parse(JSON.stringify(requestBody));

  if (!body?.requests?.length) {
    throw new Error("El body de Algolia no tiene requests.");
  }

  body.requests[0].params = replaceOrAppendPageInParams(
    body.requests[0].params,
    pageIndex
  );

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  for (const [key, value] of Object.entries(requestHeaders)) {
    const k = key.toLowerCase();
    if (
      k === "x-algolia-api-key" ||
      k === "x-algolia-application-id" ||
      k === "content-type"
    ) {
      headers[k] = String(value);
    }
  }

  const res = await context.request.post(requestUrl, {
    headers,
    data: body,
  });

  if (!res.ok()) {
    throw new Error(`Algolia page ${pageIndex} devolvió ${res.status()}`);
  }

  const json = await res.json();

  if (pageIndex === 0) {
    fs.writeFileSync(DEBUG_ALGOLIA_PAGE0, JSON.stringify(json, null, 2), "utf8");
    console.log(`💾 Guardé page 0 de Algolia en: ${DEBUG_ALGOLIA_PAGE0}`);
  }

  return json;
}

async function collectListingsFromAlgolia(context: any, page: any) {
  const { url, headers, body } = await captureAlgoliaConfig(page);

  const firstJson = await fetchAlgoliaPage(context, url, headers, body, 0);
  const firstResult = firstJson?.results?.[0];

  if (!firstResult) {
    throw new Error("Algolia no devolvió results[0].");
  }

  const nbHits = Number(firstResult.nbHits ?? 0);
  const nbPages = Number(firstResult.nbPages ?? 0);
  const hitsPerPage = Number(firstResult.hitsPerPage ?? 24);

  console.log(`📦 Algolia nbHits: ${nbHits}`);
  console.log(`📄 Algolia nbPages: ${nbPages}`);
  console.log(`📚 Algolia hitsPerPage: ${hitsPerPage}`);

  const allHits = new Map<string, any>();

  const page0Hits = Array.isArray(firstResult.hits) ? firstResult.hits : [];
  for (const hit of page0Hits) {
    const id = String(hit?.listingUuid ?? "").trim();
    if (id) allHits.set(id, hit);
  }

  for (let pageIndex = 1; pageIndex < nbPages; pageIndex++) {
    console.log(`📄 Bajando Algolia page ${pageIndex}/${nbPages - 1}...`);

    const json = await fetchAlgoliaPage(context, url, headers, body, pageIndex);
    const result = json?.results?.[0];
    const hits = Array.isArray(result?.hits) ? result.hits : [];

    console.log(`   ➕ Hits en page ${pageIndex}: ${hits.length}`);

    for (const hit of hits) {
      const id = String(hit?.listingUuid ?? "").trim();
      if (id) allHits.set(id, hit);
    }

    console.log(`   📦 Total acumulado: ${allHits.size}`);
  }

  return [...allHits.values()];
}

async function main() {
  ensureDir(OUT_DIR);
  ensureDir(FRONT_DIR);
  ensureDir(BACK_DIR);

  console.log("🚀 Abriendo navegador...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
  });
  const page = await context.newPage();

  console.log("🧭 Recolectando listings desde Algolia...");
  const listings = await collectListingsFromAlgolia(context, page);

  if (listings.length === 0) {
    throw new Error("No encontré listings en Algolia.");
  }

  console.log(`✅ Se encontraron ${listings.length} listings`);

  const rows: Array<{
    id: string;
    slug: string;
    title: string;
    sport: string;
    frontImage: string;
    backImage: string;
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

  for (const listing of listings) {
    processed++;

    const id = String(listing?.listingUuid ?? "").trim();
    const title = String(listing?.title ?? "").trim() || `Listing ${processed}`;
    const slug = slugify(title);

    let { frontImage, backImage } = pickFrontBackImagesFromAlgoliaHit(listing);

    const sport = detectSport(title);
    const productUrl = `https://www.fanaticscollect.com/buy-now/${id}`;
    const baseName = `${slug || id}-${id}`;

    const hasCachedBack = [...existingBackFiles].some((name) =>
      name.startsWith(`${baseName}-back.`)
    );

    if (!backImage && !hasCachedBack) {
      const productPage = await context.newPage();

      try {
        const extracted = await extractFrontBackFromProductPage(productPage, productUrl);

        if (extracted.frontImage) {
          frontImage = extracted.frontImage;
        }

        if (extracted.backImage) {
          backImage = extracted.backImage;
        }
      } catch (err) {
        console.error(`   ⚠️ No pude extraer dorso desde ${productUrl}`);
      } finally {
        await productPage.close();
      }
    }

    const frontExt = frontImage
      ? path.extname(new URL(frontImage).pathname || ".jpg") || ".jpg"
      : ".jpg";

    const backExt = backImage
      ? path.extname(new URL(backImage).pathname || ".jpg") || ".jpg"
      : ".jpg";

    const frontFile = frontImage ? `${baseName}-front${frontExt}` : "";
    const backFile = backImage ? `${baseName}-back${backExt}` : "";

    console.log(`\n[${processed}/${listings.length}] ${title}`);
    console.log(`   🏷️  sport: ${sport}`);
    console.log(`   🔗 ${productUrl}`);
    console.log(`   🖼️  front: ${frontImage ? "ok" : "faltante"}`);
    console.log(`   🖼️  back:  ${backImage ? "ok" : "faltante"}`);

    try {
      if (frontImage) {
        await downloadImage(context, frontImage, path.join(FRONT_DIR, frontFile));
      }

      if (backImage) {
        await downloadImage(context, backImage, path.join(BACK_DIR, backFile));
        if (backFile) {
          existingBackFiles.add(backFile);
        }
      }
    } catch (err) {
      console.error(`   ❌ Error descargando imágenes de ${id}`, err);
    }

    rows.push({
      id,
      slug,
      title,
      sport,
      frontImage,
      backImage,
      productUrl,
      frontFile,
      backFile,
    });
  }

  rows.sort((a, b) => a.title.localeCompare(b.title));

  const csvHeader = [
    "id",
    "slug",
    "title",
    "sport",
    "frontImage",
    "backImage",
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
        csvEscape(row.frontImage),
        csvEscape(row.backImage),
        csvEscape(row.productUrl),
        csvEscape(row.frontFile),
        csvEscape(row.backFile),
      ].join(SEP)
    ),
  ];

  try {
    fs.writeFileSync(CSV_PATH, "\uFEFF" + csvLines.join("\n"), "utf8");
    console.log(`📄 CSV:  ${CSV_PATH}`);
  } catch (err: any) {
    console.error(`⚠️ No pude guardar el CSV. Cerralo en Excel y reintentá: ${CSV_PATH}`);
    console.error(`   Detalle: ${err.message}`);
  }

  try {
    fs.writeFileSync(JSON_PATH, JSON.stringify(rows, null, 2), "utf8");
    console.log(`📄 JSON: ${JSON_PATH}`);
  } catch (err: any) {
    console.error(`⚠️ No pude guardar el JSON: ${JSON_PATH}`);
    console.error(`   Detalle: ${err.message}`);
  }

  console.log("\n✅ Terminado");
  console.log(`📁 Debug Algolia request: ${DEBUG_ALGOLIA_REQUEST}`);
  console.log(`📁 Debug Algolia page 0: ${DEBUG_ALGOLIA_PAGE0}`);
  console.log(`🖼️ Frente: ${FRONT_DIR}`);
  console.log(`🖼️ Dorso:  ${BACK_DIR}`);
  console.log(`📦 Registros: ${rows.length}`);

  await browser.close();
}

main().catch((err) => {
  console.error("\nSCRAPE ERROR:", err);
  process.exit(1);
});