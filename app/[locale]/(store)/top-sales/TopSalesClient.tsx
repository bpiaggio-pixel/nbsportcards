"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function TopSalesClient({
  sales,
  locale,
}: {
  sales: any[];
  locale: string;
}) {
  const t = useTranslations("topSales");
  const [category, setCategory] = useState("all");

  const salesWithCategory = useMemo(() => {
    return sales.map((item) => ({
      ...item,
      detectedCategory: detectCategory(item.title),
    }));
  }, [sales]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(salesWithCategory.map((item) => item.detectedCategory))
    );

    return ["all", ...unique];
  }, [salesWithCategory]);

  const filteredSales = useMemo(() => {
    if (category === "all") return salesWithCategory;

    return salesWithCategory.filter(
      (item) => item.detectedCategory === category
    );
  }, [salesWithCategory, category]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🔥 {t("title")}
        </h1>

        <p className="text-sm text-gray-500 mt-2">{t("subtitle")}</p>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm border transition whitespace-nowrap ${
              category === cat
                ? "bg-[#009CFF] text-white border-[#009CFF]"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
            }`}
          >
            {cat === "all" ? t("all") : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {filteredSales.map((item, index) => (
          <div
            key={item.id}
            className="flex flex-col border border-gray-200 hover:border-gray-400 rounded-2xl overflow-hidden bg-white min-h-[360px] transition"
          >
            <div className="relative h-44 bg-slate-100 flex items-center justify-center">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-slate-400">
                  {t("noImage")}
                </span>
              )}

              <div
                className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded-full shadow ${
                  index === 0
                    ? "bg-yellow-500"
                    : index === 1
                    ? "bg-gray-500"
                    : index === 2
                    ? "bg-orange-500"
                    : "bg-[#009CFF]"
                }`}
              >
                #{index + 1}
              </div>
            </div>

            <div className="flex flex-col flex-1 p-3">
              <h3 className="text-sm font-bold line-clamp-2 mb-3">
                {item.title}
              </h3>

              <p className="text-xl font-extrabold mb-3">
                {t("usd")}{" "}
                {Number(item.price_usd).toLocaleString("es-AR")}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {item.grade && (
                  <span className="w-fit text-xs bg-slate-100 px-2 py-1 rounded">
                    {item.grade}
                  </span>
                )}

                <span className="w-fit text-xs bg-slate-100 px-2 py-1 rounded">
                  {item.detectedCategory}
                </span>
              </div>

              <Link
  href={`/${locale}?q=${encodeURIComponent(
    cleanSearchQuery(item.title)
  )}&fallback=${encodeURIComponent(
    getFallbackSearchQuery(item.title)
  )}`}
 onClick={() => {
  const query = cleanSearchQuery(item.title);
  const fallback = getFallbackSearchQuery(item.title);

  fetch("/api/analytics/event", {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "top_sales_similar_click",
      path: `/${locale}/top-sales`,
      query,
      product_id: item.id,
      metadata: {
        fallback,
        title: item.title,
        priceUsd: item.price_usd,
        category: item.detectedCategory,
      },
    }),
  }).catch(() => {});
}}
  className="mt-auto block w-full text-center text-sm font-bold bg-[#009CFF] text-white py-2.5 rounded-xl hover:bg-[#0086db] transition"
>
  {t("viewSimilar")}
</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function detectCategory(title: string) {
  const text = title.toLowerCase();

  if (
    text.includes("pokemon") ||
    text.includes("charizard") ||
    text.includes("pikachu") ||
    text.includes("mimikyu") ||
    text.includes("psyduck") ||
    text.includes("rayquaza") ||
    text.includes("venusaur")
  ) {
    return "Pokémon";
  }

  if (
    text.includes("basketball") ||
    text.includes("nba") ||
    text.includes("jordan") ||
    text.includes("lebron") ||
    text.includes("kobe") ||
    text.includes("curry") ||
    text.includes("jokic")
  ) {
    return "Basketball";
  }

  if (
    text.includes("soccer") ||
    text.includes("football") ||
    text.includes("messi") ||
    text.includes("ronaldo") ||
    text.includes("haaland") ||
    text.includes("mbappe")
  ) {
    return "Soccer";
  }

  if (
    text.includes("baseball") ||
    text.includes("mlb") ||
    text.includes("ohtani") ||
    text.includes("trout") ||
    text.includes("judge")
  ) {
    return "Baseball";
  }

  if (
    text.includes("nfl") ||
    text.includes("tom brady") ||
    text.includes("mahomes")
  ) {
    return "Football";
  }

  if (
    text.includes("f1") ||
    text.includes("formula 1") ||
    text.includes("verstappen") ||
    text.includes("hamilton")
  ) {
    return "F1";
  }

  return "Other";
}

function cleanSearchQuery(title: string) {
  const text = title.toLowerCase();

  const knownTerms = [
    "jordan",
    "lebron",
    "kobe",
    "curry",
    "jokic",
    "messi",
    "ronaldo",
    "ohtani",
    "brady",
    "mahomes",
    "charizard",
    "pikachu",
    "mew",
    "mewtwo",
    "rayquaza",
    "venusaur",
    "mimikyu",
    "psyduck",
  ];

if (
  text.includes("pokemon") ||
  text.includes("charizard") ||
  text.includes("pikachu") ||
  text.includes("mew") ||
  text.includes("mewtwo") ||
  text.includes("rayquaza") ||
  text.includes("venusaur") ||
  text.includes("mimikyu") ||
  text.includes("psyduck")
) {
  return "pokemon";
}

const found = knownTerms.find((term) => text.includes(term));

if (found) {
  return found;
}

  return title
    .replace(/\b\d{3,}\b/g, "")
    .replace(/\bPSA\b/gi, "")
    .replace(/\bBGS\b/gi, "")
    .replace(/\bSGC\b/gi, "")
    .replace(/\b10\b/g, "")
    .replace(/\b9\.5\b/g, "")
    .replace(/\bGEM MINT\b/gi, "")
    .replace(/\bCARD\b/gi, "")
    .replace(/\bCARDS\b/gi, "")
    .replace(/\bROOKIE\b/gi, "")
    .replace(/\bRC\b/gi, "")
    .replace(/\bHOLO\b/gi, "")
    .replace(/\bPROMO\b/gi, "")
    .replace(/\bJAPANESE\b/gi, "")
    .replace(/\bCHINESE\b/gi, "")
    .replace(/\bSIMPLIFIED\b/gi, "")
    .replace(/\bEDITION\b/gi, "")
    .replace(/\bMINT\b/gi, "")
    .replace(/\bPOKEMON\b/gi, "pokemon")
    .split(" ")
    .filter((word) => word.length > 2)
    .slice(0, 3)
    .join(" ")
    .trim();
}
function getFallbackSearchQuery(title: string) {
  const category = detectCategory(title);

  if (category === "Pokémon") return "pokemon";
  if (category === "Basketball") return "basketball";
  if (category === "Soccer") return "soccer";
  if (category === "Baseball") return "baseball";
  if (category === "Football") return "football";
  if (category === "F1") return "f1";

  return "";
}