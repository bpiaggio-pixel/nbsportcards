import React, { Suspense } from "react";
import StorePageClient from "../StorePageClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Sport = "basketball" | "soccer" | "nfl" | "pokemon" | "other";

const validSports: Sport[] = ["basketball", "soccer", "nfl", "pokemon", "other"];

type Props = {
  params: Promise<{ locale: string; sport: string }>;
};

const labels: Record<Sport, string> = {
  basketball: "Basketball Cards",
  soccer: "Soccer Cards",
  nfl: "NFL Cards",
  pokemon: "Pokemon Cards",
  other: "Collectible Cards",
};

const seo: Record<Sport, { title: string; description: string }> = {
  pokemon: {
    title: "Buy Pokemon Cards Online | Singles & Sealed Products",
    description:
      "Shop Pokemon cards, singles, sealed products, packs and collectibles at NB Cards.",
  },
  soccer: {
    title: "Buy Soccer Cards Online | Messi, Rookies & Collectibles",
    description:
      "Shop authentic soccer trading cards, rookies, stars and collectibles at NB Cards.",
  },
  basketball: {
    title: "Buy Basketball Cards Online | NBA Cards & Collectibles",
    description:
      "Shop NBA basketball cards, rookies, legends and collectible sports cards at NB Cards.",
  },
  nfl: {
    title: "Buy NFL Cards Online | Football Cards & Collectibles",
    description:
      "Shop NFL football cards, rookies, stars and collectible trading cards at NB Cards.",
  },
  other: {
    title: "Buy Collectible Cards Online | NB Cards",
    description:
      "Shop collectible cards, trading cards and unique card products at NB Cards.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, sport } = await params;

  if (!validSports.includes(sport as Sport)) return {};

  const cleanSport = sport as Sport;
const title = seo[cleanSport].title;
const description = seo[cleanSport].description;

  return {
    title,
    description,
    alternates: {
      canonical: `https://nbcards.com/${locale}/${cleanSport}`,
    },
    openGraph: {
      title,
      description,
      url: `https://nbcards.com/${locale}/${cleanSport}`,
      siteName: "NB Cards",
      type: "website",
    },
  };
}

export default async function SportPage({ params }: Props) {
  const { sport } = await params;

  if (!validSports.includes(sport as Sport)) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">Cargando…</div>}>
      <StorePageClient initialSport={sport as Sport} />
    </Suspense>
  );
}