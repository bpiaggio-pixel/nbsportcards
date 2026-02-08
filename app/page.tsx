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
  image?: string; // URL o /cards/archivo.jpg
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
      <TopBar />

      {/* Hero */}
      <header className="border-b border-white/10 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                NB Sport Cards
              </h1>
              <p className="mt-2 text-slate-300">
                Catálogo público de basketball & soccer · precios en USD
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-300">
              <StatPill label="Total" value={cards.length} />
              <StatPill label="Mostrando" value={filtered.length} />
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
            <CardTile key={c.id} c={c} />
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

      <Footer />
    </div>
  );
}

function TopBar() {
  return (
    <div className="border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-white/10">
            <span className="text-lg">🃏</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-50">NB Sport Cards</div>
            <div className="text-xs text-slate-400">Basketball & Soccer</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <a
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-200 hover:border-white/20 hover:bg-white/10"
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-200 hover:border-white/20 hover:bg-white/10"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Arriba ↑
          </a>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-8 border-t border-white/10 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-400">
            © {year} NB Sport Cards · Hecho con Next.js + Tailwind
          </div>

          <div className="flex gap-2">
            <a
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:border-white/20 hover:bg-white/10"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert("Si querés, acá ponemos tus redes o un link de contacto 🙂");
              }}
            >
              Contacto
            </a>
            <a
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:border-white/20 hover:bg-white/10"
              href="https://vercel.com"
              target="_blank"
              rel="noreferrer"
            >
              Deploy en Vercel
            </a>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Nota: los precios son informativos y pueden cambiar.
        </p>
      </div>
    </footer>
  );
}

function CardTile({ c }: { c: Card }) {
  const fallback =
    c.sport === "basketball"
      ? "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80"
      : "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80";

  const img = c.image?.trim() ? c.image : fallback;

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-sm transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* Usamos <img> para simplicidad. Después lo pasamos a next/image si querés */}
        <img
          src={img}
          alt={c.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-100 backdrop-blur">
          {c.sport === "basketball" ? "🏀 Basketball" : "⚽ Soccer"}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-slate-50">
          {c.title}
        </h3>

        <p className="mt-2 text-sm text-slate-300">{c.player}</p>

        <div className="mt-4 flex items-end justify-between">
          <div className="text-lg font-semibold text-slate-50">
            {formatUSD(c.price)}
          </div>
          <span className="text-xs text-slate-400">#{c.id}</span>
        </div>
      </div>
    </article>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
      {label}: <b className="text-slate-50">{value}</b>
    </span>
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
