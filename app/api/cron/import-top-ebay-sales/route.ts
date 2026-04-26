export const runtime = "nodejs";

import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACTOR_ID = "caffein.dev~ebay-sold-listings";

const SEARCHES = [
  "PSA 10 sports card",
  "BGS 9.5 sports card",
  "Michael Jordan PSA 10 card",
  "Lionel Messi PSA 10 card",
  "LeBron James PSA 10 card",
  "Pokemon PSA 10 card",
];

export async function GET() {
  try {
    const allItems: any[] = [];

    for (const query of SEARCHES) {
      const runRes = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${process.env.APIFY_TOKEN}&waitForFinish=120`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keywords: [query],
            daysToScrape: 7,
            count: 5,
            ebaySite: "ebay.com",
            sortOrder: "pricePlusPostageHighest",
            currencyMode: "USD",
          }),
        }
      );

      const runJson = await runRes.json();

      if (!runRes.ok) {
        throw new Error(JSON.stringify(runJson));
      }

      const datasetId = runJson.data.defaultDatasetId;

      const itemsRes = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${process.env.APIFY_TOKEN}`
      );

      const items = await itemsRes.json();
      allItems.push(...items);
    }

    const normalized = await Promise.all(
      allItems.map(async (item: any) => {
        const itemUrl = item.itemUrl ?? item.url ?? null;
        const imageUrl =
  item.image ??
  item.imageUrl ??
  (await getEbayImage(itemUrl));

        return {
          ebay_item_id: String(item.itemId ?? itemUrl ?? item.title),
          title: item.title ?? "Untitled",
          price_usd: Number(item.soldPrice ?? 0),
          sold_at: item.endedAt ?? null,
          image_url: imageUrl,
          source_url: itemUrl,
          grade: extractGrade(item.title ?? ""),
          raw: item,
        };
      })
    );

const filtered = normalized
  .filter((item) => item.price_usd > 0 && item.image_url)
      .sort((a, b) => b.price_usd - a.price_usd)
      .slice(0, 50);

    const uniqueNormalized = Array.from(
      new Map(filtered.map((item) => [item.ebay_item_id, item])).values()
    );

    const { error } = await supabase
      .from("top_ebay_sales")
      .upsert(uniqueNormalized, { onConflict: "ebay_item_id" });

    if (error) throw error;

    return Response.json({
      ok: true,
      totalRawItems: allItems.length,
      sample: allItems[0],
      imported: uniqueNormalized.length,
    });
  } catch (err: any) {
    return Response.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

function extractGrade(title: string) {
  const match = title.match(/\b(PSA|BGS|SGC)\s?(10|9\.5|9|8\.5|8)\b/i);
  return match ? match[0].toUpperCase() : null;
}

async function getEbayImage(itemUrl: string | null) {
  if (!itemUrl) return null;

  try {
    const res = await fetch(itemUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    return (
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      null
    );
  } catch {
    return null;
  }
}