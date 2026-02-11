import React, { Suspense } from "react";
import StorePageClient from "./StorePageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">Cargando…</div>}>
      <StorePageClient />
    </Suspense>
  );
}