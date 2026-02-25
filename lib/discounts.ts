// lib/discounts.ts

const SALE_ACTIVE = String(process.env.SALE_ACTIVE ?? "false") === "true";
const SALE_PERCENT = Number(process.env.SALE_PERCENT ?? "0") || 0;
// tu app usa "soccer" en minúscula
const SALE_SPORT = String(process.env.SALE_SPORT ?? "soccer").toLowerCase();

export function applySaleCents(usdCents: number, sport?: string | null) {
  if (!SALE_ACTIVE || SALE_PERCENT <= 0) return usdCents;

  const s = String(sport ?? "").toLowerCase();
  if (!s || s !== SALE_SPORT) return usdCents;

  const discounted = usdCents * (1 - SALE_PERCENT / 100);
  return Math.round(discounted);
}

