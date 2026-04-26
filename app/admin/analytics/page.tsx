import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AdminAnalyticsPage() {
  const [{ data: orders }, { data: topSales }, { data: cards }, { data: events }] =
    await Promise.all([
      supabase.from("Order").select("*"),
      supabase.from("top_ebay_sales").select("*"),
      supabase.from("Card").select("*"),
      supabase.from("site_events").select("*"),
    ]);

  const totalOrders = orders?.length ?? 0;

  const totalRevenue =
    orders?.reduce((sum, order: any) => {
      return sum + Number(order.total ?? order.total_usd ?? order.amount ?? 0);
    }, 0) ?? 0;

  const paidOrders =
    orders?.filter((order: any) =>
      ["paid", "shipped", "delivered"].includes(
        String(order.status ?? "").toLowerCase()
      )
    ).length ?? 0;

  const outOfStockCards =
    cards?.filter((card: any) => Number(card.stock ?? 0) <= 0).length ?? 0;

  const similarClicks =
    events?.filter(
      (event: any) => event.event_type === "top_sales_similar_click"
    ) ?? [];
const searches =
  events?.filter((event: any) => event.event_type === "search") ?? [];

const productViews =
  events?.filter((event: any) => event.event_type === "product_view") ?? [];

const addToCart =
  events?.filter((event: any) => event.event_type === "add_to_cart") ?? [];
  const topQueries = getTopCounts(similarClicks, "query", 5);
  const topCategories = getTopCountsFromMetadata(similarClicks, "category", 5);
  const topClickedTitles = getTopCountsFromMetadata(similarClicks, "title", 5);

const latestEvents =
  events?.slice(0, 30).map((e: any) => ({
    type: e.event_type,
    query: e.query,
    product: e.metadata?.title,
    date: new Date(e.created_at).toLocaleString("es-AR"),
  })) ?? [];

const mostViewedCards = getTopCountsFromMetadata(
  productViews,
  "title",
  8
);

const blogViews =
  events?.filter((event: any) => event.event_type === "blog_view") ?? [];

const guideViews =
  events?.filter((event: any) => event.event_type === "guide_view") ?? [];

const topBlogPosts = getTopCountsFromMetadata(blogViews, "title", 8);

const topGuides = getTopCountsFromMetadata(guideViews, "title", 8);

  const topSalesMissingImages =
    topSales?.filter((item: any) => !item.image_url).length ?? 0;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-gray-500">
          Métricas del negocio y comportamiento de usuarios
        </p>
      </div>

      {/* 🔵 MÉTRICAS WEB */}
      <Section title="Métricas web">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    <MetricCard title="Órdenes totales" value={totalOrders} />

    <MetricCard title="Órdenes pagadas" value={paidOrders} />

    <MetricCard
      title="Revenue"
      value={`USD ${totalRevenue.toLocaleString("es-AR")}`}
    />

    <MetricCard title="Cards sin stock" value={outOfStockCards} />

    <MetricCard title="Búsquedas" value={searches.length} />

    <MetricCard title="Productos vistos" value={productViews.length} />

    <MetricCard title="Add to cart" value={addToCart.length} />

    <MetricCard
      title="Conversion rate"
      value={
        productViews.length > 0
          ? `${((addToCart.length / productViews.length) * 100).toFixed(1)}%`
          : "0%"
      }
    />



    <MetricCard title="Eventos registrados" value={events?.length ?? 0} />
  </div>

  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
    <RankingCard title="Productos más visitados" items={mostViewedCards} />
  </div>

  <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <h3 className="font-bold mb-3">Eventos recientes</h3>

    {latestEvents.length === 0 ? (
      <p className="text-sm text-gray-500">Sin eventos todavía</p>
    ) : (
      <div className="max-h-[360px] overflow-y-auto pr-2 space-y-2">
        {latestEvents.map((e, i) => (
          <div
            key={i}
            className="text-sm border-b border-gray-100 pb-2 last:border-0"
          >
            <div className="flex justify-between gap-4">
              <span
  className={`rounded-full px-2 py-1 text-xs font-bold ${getEventBadgeClass(
    e.type
  )}`}
>
  {formatEventType(e.type)}
</span>
              <span className="text-gray-400 text-xs whitespace-nowrap">
                {e.date}
              </span>
            </div>

            {e.query && <div className="text-gray-600">🔎 {e.query}</div>}

            {e.product && (
              <div className="text-gray-600 line-clamp-2">
                🃏 {e.product}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
</Section>

      {/* 🟡 EBAY */}
      <Section title="Importaciones eBay">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard title="Top sales importadas" value={topSales?.length ?? 0} />
          <MetricCard title="Top sales sin imagen" value={topSalesMissingImages} />
<MetricCard
      title="Clicks en Ver similares"
      value={similarClicks.length}
    />
        </div>
<div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
  <RankingCard title="Queries más clickeadas" items={topQueries} />
  <RankingCard title="Categorías más clickeadas" items={topCategories} />
  <RankingCard title="Interés en Top Sales" items={topClickedTitles} />
</div>
    
      </Section>

      {/* 🟢 BLOG */}
<Section title="Blog">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    <MetricCard title="Vistas de blog" value={blogViews.length} />
  </div>

  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
    <RankingCard title="Posts más vistos" items={topBlogPosts} />
  </div>
</Section>

      {/* 🟣 GUÍAS */}
<Section title="Guías">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    <MetricCard title="Vistas de guías" value={guideViews.length} />
  </div>

  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
    <RankingCard title="Guías más vistas" items={topGuides} />
  </div>
</Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function RankingCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; count: number }[];
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-bold mb-3">{title}</h3>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Sin datos todavía</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>
                #{i + 1} {item.label}
              </span>
              <span className="font-bold">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getTopCounts(items: any[], key: string, limit = 5) {
  const map = new Map<string, number>();

  items.forEach((item) => {
    const val = item?.[key];
    if (!val) return;
    map.set(val, (map.get(val) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getTopCountsFromMetadata(items: any[], key: string, limit = 5) {
  const map = new Map<string, number>();

  items.forEach((item) => {
    const val = item?.metadata?.[key];
    if (!val) return;
    map.set(val, (map.get(val) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
function getEventBadgeClass(type: string) {
  switch (type) {
    case "search":
      return "bg-blue-100 text-blue-700";

    case "product_view":
      return "bg-purple-100 text-purple-700";

    case "add_to_cart":
      return "bg-green-100 text-green-700";

    case "top_sales_similar_click":
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatEventType(type: string) {
  switch (type) {
    case "search":
      return "Búsqueda";

    case "product_view":
      return "Producto visto";

    case "add_to_cart":
      return "Add to cart";

    case "top_sales_similar_click":
      return "Top Sales click";

    default:
      return type;
  }
}