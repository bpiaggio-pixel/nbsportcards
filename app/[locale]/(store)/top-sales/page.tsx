
import { createClient } from "@supabase/supabase-js";
import TopSalesClient from "./TopSalesClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function TopSalesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const { data } = await supabase
    .from("top_ebay_sales")
    .select("*")
    .order("price_usd", { ascending: false })
    .limit(50);

  return <TopSalesClient sales={data ?? []} locale={locale} />;
}