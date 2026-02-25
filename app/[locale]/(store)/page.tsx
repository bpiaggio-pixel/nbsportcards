import React, { Suspense } from "react";
import StorePageClient from "./StorePageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buy Authentic Sports Cards | Soccer, NBA & NFL Collectibles",
  description:
    "Discover authentic sports trading cards from top leagues like Soccer, NBA and NFL. Secure payments in USD. Expand your collection today.",
  keywords: [
    "sports cards",
    "trading cards",
    "soccer cards",
    "NBA cards",
    "NFL cards",
    "buy sports cards online",
    "Messi cards",
    "Michael Jordan cards",
    "Lebron James cards",
    "collectible cards",
    "football trading cards"
  ],
  openGraph: {
    title: "Buy Authentic Sports Cards | Soccer, NBA & NFL Collectibles",
    description:
      "Discover authentic sports trading cards from top leagues like Soccer, NBA and NFL. Secure payments in USD. Expand your collection today.",
    url: "https://nbcards.com",
    siteName: "NB cards",
    type: "website",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">Cargando…</div>}>
      <StorePageClient />
    </Suspense>
  );
}