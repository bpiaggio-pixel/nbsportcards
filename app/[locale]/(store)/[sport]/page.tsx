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

const seo: Record<
  Sport,
  {
    en: { title: string; description: string };
    es: { title: string; description: string };
  }
> = {
  pokemon: {
    en: {
      title: "Buy Pokemon Cards Online | Singles & Sealed Products",
      description:
        "Shop Pokemon cards, singles, booster boxes and sealed products at NB Cards.",
    },
    es: {
      title: "Comprar Cartas Pokémon | Singles y Productos Sellados",
      description:
        "Compra cartas Pokémon, singles, boosters y productos sellados en NB Cards.",
    },
  },
  soccer: {
    en: {
      title: "Buy Soccer Cards Online | Rookies & Collectibles",
      description:
        "Shop soccer trading cards, rookies, stars and collectibles at NB Cards.",
    },
    es: {
      title: "Comprar Cartas de Fútbol | Rookies y Coleccionables",
      description:
        "Compra cartas de fútbol, rookies y coleccionables en NB Cards.",
    },
  },
  basketball: {
    en: {
      title: "Buy Basketball Cards Online | NBA Cards",
      description:
        "Shop NBA cards, rookies, autos and legends at NB Cards.",
    },
    es: {
      title: "Comprar Cartas de Básquet | NBA y Coleccionables",
      description:
        "Compra cartas NBA, rookies y leyendas en NB Cards.",
    },
  },
  nfl: {
    en: {
      title: "Buy NFL Cards Online | Football Cards",
      description:
        "Shop NFL football cards, rookies and collectibles at NB Cards.",
    },
    es: {
      title: "Comprar Cartas NFL | Fútbol Americano",
      description:
        "Compra cartas NFL, rookies y coleccionables en NB Cards.",
    },
  },
  other: {
    en: {
      title: "Buy Collectible Cards Online | NB Cards",
      description:
        "Shop trading cards and collectibles at NB Cards.",
    },
    es: {
      title: "Comprar Cartas Coleccionables | NB Cards",
      description:
        "Compra cartas y coleccionables en NB Cards.",
    },
  },
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, sport } = await params;

  if (!validSports.includes(sport as Sport)) return {};

  const cleanSport = sport as Sport;
const lang = locale === "es" ? "es" : "en";

const title = seo[cleanSport][lang].title;
const description = seo[cleanSport][lang].description;

return {
    title,
    description,
    alternates: {
      canonical: `https://nbcards.com/${locale}/${cleanSport}`,
      languages: {
        en: `https://nbcards.com/en/${cleanSport}`,
        es: `https://nbcards.com/es/${cleanSport}`,
      },
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