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

  const [q, setQ] = React.useState("");
  const [sport, setSport] = React.useState<"all" | Sport>("all");
  const [sort, setSort] = React.useState<"price_desc" | "price_asc">(
    "price_desc"
  );

  const [page, setPage] = React.useState(1);
  const pageSize = 24;

  React.useEffect(() => setPage(1), [q, sport, sort]);

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();

    let result = cards.filter((c) => {
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
  }, [cards, q, sport, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-white/10 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                NB Sport Cards
              </h1>
              <p className="mt-2 text-slate-300">
                Colección pública de basketball & soccer · precios en USD
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Total: <b className="text-slate-50">{cards.length}</b>
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Mostrando: <b className="text-slate-50">{filtered.length}</b>
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título o jugador…"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 placeholder:text-slate-400 outline-none focus:border-white/20"
            />

            <div className="flex gap-2">
              <Chip active={sport === "all"} onClick={() => setSport("all")}>
                Todos
              </Chip>
              <Chip
                active={sport === "basketball"}
                onClick={() => setSport("basketball")}
              >
                🏀 Basketball
              </Chip>
              <Chip active={sport === "soccer"} onClick={() => setSport("soccer")}>
                ⚽ Soccer
              </Chip>
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none focus:border-white/20"
            >
              <option value="price_desc">Precio: mayor → menor</option>
              <option value="price_asc">Precio: menor → mayor</option>
            </select>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paged.map((c) => (
            <article
              key={c.id}
              className="group rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-200">
                  {c.sport === "basketball" ? "BASKETBALL" : "SOCCER"}
                </span>
                <span className="text-xs text-slate-400">#{c.id}</span>
              </div>

              <h3 className="mt-3 line-clamp-2 text-base font-semibold text-slate-50">
                {c.title}
              </h3>

              <p className="mt-2 text-sm text-slate-300">{c.player}</p>

              <div className="mt-4 flex items-end justify-between">
                <div className="text-lg font-semibold text-slate-50">
                  {formatUSD(c.price)}
                </div>
                <div className="text-xs text-slate-400 opacity-0 transition group-hover:opacity-100">
                  Ver detalle (próximo)
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="text-sm text-slate-300">
            Página <b className="text-slate-50">{page}</b> de{" "}
            <b className="text-slate-50">{totalPages}</b>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-2xl border px-4 py-3 text-sm transition",
        active
          ? "border-white/20 bg-white/15 text-slate-50"
          : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
