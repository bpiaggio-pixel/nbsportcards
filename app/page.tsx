"use client";
import React from "react";
import cardsData from "@/data/cards.json";

type Sport = "basketball" | "soccer";
type Card = {
  id: string;
  sport: Sport;
  title: string;
  player: string;
  price: number;
};

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function Page() {
  const cards = cardsData as Card[];
  return <ClientGallery initialCards={cards} />;
}

function ClientGallery({ initialCards }: { initialCards: Card[] }) {
  "use client";

  const [q, setQ] = React.useState("");
  const [sport, setSport] = React.useState<"all" | Sport>("all");
  const [sort, setSort] = React.useState<"price_asc" | "price_desc">(
    "price_desc"
  );

  // paginación
  const [page, setPage] = React.useState(1);
  const pageSize = 24;

  React.useEffect(() => {
    setPage(1);
  }, [q, sport, sort]);

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();

    let result = initialCards.filter((c) => {
      const matchesSport = sport === "all" ? true : c.sport === sport;
      const matchesQuery =
        query.length === 0
          ? true
          : c.title.toLowerCase().includes(query) ||
            c.player.toLowerCase().includes(query);

      return matchesSport && matchesQuery;
    });

    result.sort((a, b) =>
      sort === "price_asc" ? a.price - b.price : b.price - a.price
    );

    return result;
  }, [initialCards, q, sport, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Mi Colección</h1>
        <p style={{ marginTop: 8, opacity: 0.75 }}>
          {initialCards.length} tarjetas · Mostrando <b>{filtered.length}</b> ·
          Página <b>{page}</b> / <b>{totalPages}</b>
        </p>
      </header>

      <section style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por título o jugador…"
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.2)",
            fontSize: 14,
          }}
        />

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <label style={{ fontSize: 14, opacity: 0.8 }}>Deporte:</label>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value as any)}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.2)",
            }}
          >
            <option value="all">Todos</option>
            <option value="basketball">Basketball</option>
            <option value="soccer">Soccer</option>
          </select>

          <label style={{ fontSize: 14, opacity: 0.8 }}>Orden:</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.2)",
            }}
          >
            <option value="price_desc">Precio (mayor a menor)</option>
            <option value="price_asc">Precio (menor a mayor)</option>
          </select>

          <div style={{ marginLeft: "auto", fontSize: 14, opacity: 0.8 }}>
            Mostrando <b>{filtered.length}</b>
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {paged.map((c) => (
          <article
            key={c.id}
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 16,
              padding: 14,
              background: "white",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
              {c.sport === "basketball" ? "BASKETBALL" : "SOCCER"}
            </div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{c.title}</div>
            <div style={{ marginTop: 6, fontSize: 14, opacity: 0.85 }}>
              {c.player}
            </div>
            <div style={{ marginTop: 12, fontSize: 16, fontWeight: 800 }}>
              {formatUSD(c.price)}
            </div>
          </article>
        ))}
      </section>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 18 }}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← Anterior
        </button>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Siguiente →
        </button>
      </div>
    </main>
  );
}
