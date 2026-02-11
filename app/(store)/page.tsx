"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useSearchParams } from "next/navigation";
import React from "react";
import { Heart, ShoppingCart, X } from "lucide-react";
import { motion } from "framer-motion";

type Sport = "basketball" | "soccer" | "nfl";

type Card = {
  id: string;
  sport: Sport;
  title: string;
  player: string;
  price: number;
  image?: string;

  great_deal?: string;
  greatDeal?: string;
};

type SessionUser = { id: string; email: string } | null;

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function getFallback(sport: Sport) {
  if (sport === "basketball")
    return "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80";
  if (sport === "soccer")
    return "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80";
  return "https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?auto=format&fit=crop&w=1200&q=80";
}

function isGreatDeal(card: Card) {
  const raw = String(card.greatDeal ?? card.great_deal ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return raw === "si" || raw === "true" || raw === "1" || raw === "x" || raw === "yes";
}

/* -------------------------
   TOP SHOWCASE (rotating)
-------------------------- */
function rotateLeft<T>(arr: T[]) {
  if (arr.length <= 1) return arr;
  const copy = [...arr];
  copy.push(copy.shift() as T);
  return copy;
}

function TopCardsShowcase({
  items,
  intervalMs = 2000,
  onSelect,
}: {
  items: { id: string; title: string; image: string }[];
  intervalMs?: number;
  onSelect: (id: string) => void;
}) {
  const baseSeven = React.useMemo(() => items.slice(0, 7), [items]);
  const [order, setOrder] = React.useState(baseSeven);

  React.useEffect(() => {
    setOrder(baseSeven);
  }, [baseSeven]);

  React.useEffect(() => {
    if (order.length < 2) return;
    const t = setInterval(() => setOrder((prev) => rotateLeft(prev)), intervalMs);
    return () => clearInterval(t);
  }, [order.length, intervalMs]);

  const slotX = [-480, -320, -160, 0, 160, 320, 480];
  const centerIdx = 3;

  return (
    <section className="w-full bg-white">
      <div className="w-full px-6 py-6">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.95),rgba(255,255,255,0)_60%)]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9),rgba(255,255,255,0)_62%)] opacity-70" />

          <div className="relative h-[350px] pb-4">
            {order.map((c, idx) => {
              const x = slotX[idx] ?? 0;
              const dist = Math.abs(idx - centerIdx);
              const isCenter = idx === centerIdx;

              const scale = isCenter ? 1.14 : dist === 1 ? 1.0 : dist === 2 ? 0.93 : 0.88;
              const opacity = isCenter ? 1 : 0.92;
              const filter = isCenter ? "grayscale(0)" : "grayscale(0.12)";
              const zIndex = 50 - dist;

              return (
                <motion.article
                  key={c.id}
                  initial={false}
                  animate={{ x, y: isCenter ? -12 : 10, scale, opacity, filter }}
                  transition={{ type: "spring", stiffness: 140, damping: 20, mass: 0.7 }}
                  style={{ zIndex }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className="group relative isolate flex flex-col items-center"
                  >
                    {isCenter && (
                      <>
                        <div
                          className="pointer-events-none absolute -inset-2 z-0 rounded-[30px] opacity-95 blur-md"
                          style={{
                            backgroundImage:
                              "radial-gradient(circle at 50% 45%, rgba(90,190,255,0.95) 0%, rgba(90,190,255,0.45) 26%, rgba(90,190,255,0.12) 50%, rgba(255,255,255,0) 70%)",
                          }}
                        />
                        <div
                          className="pointer-events-none absolute -inset-[2px] z-0 rounded-[28px] opacity-70 blur-[1px]"
                          style={{
                            backgroundImage:
                              "radial-gradient(circle at 50% 50%, rgba(90,190,255,0.95) 0%, rgba(255,255,255,0) 62%)",
                          }}
                        />
                        <div
                          className="pointer-events-none absolute left-1/2 top-[-8px] z-0 h-[54px] w-[120px] -translate-x-1/2 rounded-full opacity-55 blur-md"
                          style={{
                            backgroundImage:
                              "radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 72%)",
                          }}
                        />
                      </>
                    )}

                    <div
                      className={[
                        "relative z-10 h-[170px] w-[145px] overflow-hidden rounded-2xl border bg-white",
                        "transition",
                        isCenter ? "border-white/70" : "border-black/5",
                        "shadow-[0_18px_55px_rgba(0,0,0,.12)]",
                        "group-hover:shadow-[0_22px_70px_rgba(0,0,0,.16)]",
                      ].join(" ")}
                    >
                      <img
                        src={c.image}
                        alt={c.title}
                        className="h-full w-full object-contain p-3"
                        draggable={false}
                      />
                    </div>

                    <div className="relative mt-3 h-8 w-56">
                      <div
                        className="absolute left-1/2 top-1/2 h-8 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[2px] opacity-55"
                        style={{
                          backgroundImage:
                            "radial-gradient(ellipse at center, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.12) 35%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0) 75%)",
                        }}
                      />
                    </div>
                  </button>
                </motion.article>
              );
            })}
          </div>

          <div className="relative flex justify-center pt-2 pb-1">
            <div className="text-center">
              <div className="text-lg font-extrabold tracking-tight text-gray-800">TOP CARDS</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------
   PAGE
-------------------------- */
export default function Page() {
  const [cards, setCards] = React.useState<Card[]>([]);

  // ✅ NORMALIZADOR DE ID (CLAVE)
  const normId = React.useCallback((v: any) => {
    const s = String(v ?? "").trim();
    const m = s.match(/\d+/);
    return m ? String(parseInt(m[0], 10)) : s;
  }, []);

  const searchParams = useSearchParams();
const search = (searchParams?.get("q") ?? "").toString();




  React.useEffect(() => {
    async function loadCards() {
      try {
        const res = await fetch("/api/cards", { cache: "no-store" });
        const data = await res.json();
        setCards(Array.isArray(data.cards) ? data.cards : []);
      } catch {
        setCards([]);
      }
    }
    loadCards();
  }, []);

  // ✅ 1) Normaliza IDs y elimina duplicados por id (NORMALIZADO)
  const uniqueCards = React.useMemo(() => {
    const map = new Map<string, Card>();
    for (const c of cards) {
      const id = normId(c.id);
      if (!id) continue;
      if (!map.has(id)) map.set(id, { ...c, id });
    }
    return Array.from(map.values());
  }, [cards, normId]);

  // ✅ 2) Recommended = primera Great Deal, si no hay, primera card
  const recommended = React.useMemo(() => {
    const deal = uniqueCards.find((c) => isGreatDeal(c));
    return deal ?? uniqueCards[0] ?? null;
  }, [uniqueCards]);

  // ✅ 3) Great deal = segunda Great Deal distinta a recommended
  const greatDealPick = React.useMemo(() => {
    const deals = uniqueCards.filter((c) => isGreatDeal(c));
    const second = deals.find((c) => c.id !== recommended?.id);
    return second ?? null;
  }, [uniqueCards, recommended]);

  // ✅ 4) Most viewed = primera distinta a las otras dos
  const mostViewed = React.useMemo(() => {
    return uniqueCards.find((c) => c.id !== recommended?.id && c.id !== greatDealPick?.id) ?? null;
  }, [uniqueCards, recommended, greatDealPick]);

  // -----------------------
  // USER SESSION (MVP)
  // -----------------------
  const [user, setUser] = React.useState<SessionUser>(null);

  React.useEffect(() => {
    function syncUser() {
      try {
        const raw = localStorage.getItem("user");
        setUser(raw ? JSON.parse(raw) : null);
      } catch {
        setUser(null);
      }
    }

    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("focus", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("focus", syncUser);
    };
  }, []);

  function logout() {
    try {
      localStorage.removeItem("user");
    } catch {}
    setUser(null);

    try {
      const raw = localStorage.getItem("wishlist");
      setWishlist(raw ? JSON.parse(raw) : {});
    } catch {
      setWishlist({});
    }
  }

  // filters
  const [sport, setSport] = React.useState<"all" | Sport>("all");
  const [player, setPlayer] = React.useState<"all" | string>("all");
  const [sort, setSort] = React.useState<"recommended" | "price_desc" | "price_asc">("recommended");

  // pagination
  const pageSize = 9;
  const [page, setPage] = React.useState(1);

  // modal
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selectedCard = React.useMemo(
    () => uniqueCards.find((c) => normId(c.id) === normId(selectedId)) ?? null,
    [uniqueCards, selectedId, normId]
  );

  // wishlist (favoritos)
  const [wishlist, setWishlist] = React.useState<Record<string, boolean>>({});

  // guest wishlist
  React.useEffect(() => {
    if (user?.id) return;
    try {
      const raw = localStorage.getItem("wishlist");
      if (raw) setWishlist(JSON.parse(raw));
      else setWishlist({});
    } catch {}
  }, [user?.id]);

  React.useEffect(() => {
    if (user?.id) return;
    try {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    } catch {}
  }, [wishlist, user?.id]);

  // ✅ cargar favoritos del user (NORMALIZADOS) y actualiza conteo sin refresh
  React.useEffect(() => {
    async function loadFavs() {
      if (!user?.id) return;

      try {
        const res = await fetch(`/api/favorites?userId=${encodeURIComponent(user.id)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        const ids: string[] = Array.isArray(data.cardIds) ? data.cardIds : [];
        const normalized = ids.map(normId);

        setWishlist(Object.fromEntries(normalized.map((id) => [id, true])));
      } catch {}
    }
    loadFavs();
  }, [user?.id, normId]);

  // ✅ TOGGLE FAVORITO: pinta corazón + cambia conteo al instante
async function toggleWish(id: string) {
  const cardId = normId(id);

  // guest: local toggle
  if (!user?.id) {
    setWishlist((prev) => {
      const next = { ...prev };
      if (next[cardId]) delete next[cardId];
      else next[cardId] = true;
      return next;
    });

    // ✅ avisa al Header
    window.dispatchEvent(new Event("wishlist:changed"));
    return;
  }

  const res = await fetch("/api/favorites/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.id, cardId }), // ✅ mando normalizado
  });

  const data = await res.json();

  if (!res.ok) {
    console.log("toggle favorite error:", data);
    return;
  }

  // ✅ TU API devuelve favorited (no wished)
  const favorited = !!data.favorited;
  const returnedId = normId(data.cardId ?? cardId);

  setWishlist((prev) => {
    const next = { ...prev };
    if (favorited) next[returnedId] = true;
    else delete next[returnedId];
    return next;
  });

  // ✅ avisa al Header (cuando estás logueado)
  window.dispatchEvent(new Event("wishlist:changed"));
}


  // Close modal with ESC
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ✅ Cart count (simple MVP)
  const [cartCount, setCartCount] = React.useState(0);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("cartCount");
      setCartCount(raw ? Number(raw) : 0);
    } catch {}
  }, []);

  // ✅ listado de jugadores
  const players = React.useMemo(() => {
    const set = new Set<string>();
    for (const c of uniqueCards) {
      const p = c.player?.trim();
      if (p) set.add(p);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [uniqueCards]);

  // ✅ rango de precios dinámico + slider max
  const priceRange = React.useMemo(() => {
    if (uniqueCards.length === 0) return { min: 0, max: 1000 };
    const prices = uniqueCards.map((c) => c.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [uniqueCards]);

  const [minPrice, setMinPrice] = React.useState<number | null>(null);
  const [maxPrice, setMaxPrice] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (minPrice === null) setMinPrice(priceRange.min);
    if (maxPrice === null) setMaxPrice(priceRange.max);
  }, [priceRange.min, priceRange.max, minPrice, maxPrice]);

  React.useEffect(() => {
    setPage(1);
  }, [search, sport, sort, player, minPrice, maxPrice]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    let result = uniqueCards.filter((c) => {
      const matchesSport = sport === "all" ? true : c.sport === sport;
      const matchesPlayer = player === "all" ? true : c.player === player;

      const matchesSearch =
        q.length === 0 ? true : c.title.toLowerCase().includes(q) || c.player.toLowerCase().includes(q);

      const min = minPrice ?? priceRange.min;
      const max = maxPrice ?? priceRange.max;
      const matchesPrice = c.price >= min && c.price <= max;

      return matchesSport && matchesPlayer && matchesSearch && matchesPrice;
    });

    if (sort === "price_desc") result = [...result].sort((a, b) => b.price - a.price);
    if (sort === "price_asc") result = [...result].sort((a, b) => a.price - b.price);

    return result;
  }, [uniqueCards, search, sport, sort, player, minPrice, maxPrice, priceRange.min, priceRange.max]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

 async function addToCart(cardId: string) {
  if (!user?.id) {
    window.location.href = "/login";
    return;
  }

  try {
    // 1️⃣ Trae el carrito actual
    const cartRes = await fetch(
      `/api/cart?userId=${encodeURIComponent(user.id)}`,
      { cache: "no-store" }
    );
    const cartData = await cartRes.json();

    const existing = Array.isArray(cartData.items)
      ? cartData.items.find((x: any) => x.cardId === cardId)
      : null;

    const nextQty = (existing?.qty ?? 0) + 1;

    // 2️⃣ Guarda en DB
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        cardId,
        qty: nextQty,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.log("addToCart error:", data);
      return;
    }

    // ✅ 3️⃣ AVISA AL HEADER QUE CAMBIÓ EL CARRITO
    window.dispatchEvent(new Event("cart:changed"));
  } catch (e) {
    console.log("addToCart error:", e);
  }
}


  // ✅ Items para el showcase
  const topShowcaseItems = React.useMemo(() => {
    return uniqueCards.slice(0, 7).map((c) => ({
      id: c.id,
      title: c.title,
      image: c.image?.trim() ? c.image : getFallback(c.sport),
    }));
  }, [uniqueCards]);

  // ✅ HERO / BANNER por deporte seleccionado
  const sportHero = React.useMemo(() => {
    if (sport === "all") return { title: "ALL SPORTS CARDS", image: "/all-hero.jpg", alt: "All Sport Cards" };
    if (sport === "basketball") return { title: "NBA CARDS", image: "/lebron.jpg", alt: "NBA Cards" };
    if (sport === "soccer") return { title: "SOCCER CARDS", image: "/soccer-hero.jpg", alt: "Soccer Cards" };
    if (sport === "nfl") return { title: "NFL CARDS", image: "/nfl-hero.jpg", alt: "NFL Cards" };
    return null;
  }, [sport]);

  const favCount = React.useMemo(() => Object.values(wishlist).filter(Boolean).length, [wishlist]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* MAIN */}
      <div className="mx-auto grid max-w-7xl grid-cols-[280px_1fr] gap-8 px-6 py-10">
        {/* SIDEBAR */}
        <aside className="space-y-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Filters</h2>

          <div>
            <p className="mb-3 text-sm font-semibold text-gray-800">Category</p>
            <div className="space-y-2 text-sm text-gray-700">
              <label className="flex items-center gap-2">
                <input type="radio" checked={sport === "all"} onChange={() => setSport("all")} />
                All
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={sport === "basketball"} onChange={() => setSport("basketball")} />
                Basketball
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={sport === "soccer"} onChange={() => setSport("soccer")} />
                Soccer
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={sport === "nfl"} onChange={() => setSport("nfl")} />
                NFL
              </label>
            </div>
          </div>

          {/* Player */}
          <div>
            <p className="mb-3 text-sm font-semibold text-gray-800">Player</p>
            <select
              value={player}
              onChange={(e) => setPlayer(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="all">All</option>
              {players.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-gray-800">Wishlist</p>
            <div className="text-sm text-gray-600">
              Guardadas: <span className="font-semibold text-gray-900">{favCount}</span>
            </div>
          </div>

          <div className="my-8 border-t border-gray-200" />

          {/* Sidebar highlights */}
          <div className="pt-4">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">Highlights</h3>

            <div className="space-y-4">
              {mostViewed && (
                <div className="transition hover:-translate-y-[1px] hover:shadow-md">
                  <SidebarCard title="Most viewed" card={mostViewed} onOpen={() => setSelectedId(mostViewed.id)} />
                </div>
              )}

              {recommended && (
                <div className="transition hover:-translate-y-[1px] hover:shadow-md">
                  <SidebarCard title="Recommended" card={recommended} onOpen={() => setSelectedId(recommended.id)} />
                </div>
              )}

              {greatDealPick && (
                <div className="transition hover:-translate-y-[1px] hover:shadow-md">
                  <SidebarCard title="Great deal" card={greatDealPick} onOpen={() => setSelectedId(greatDealPick.id)} />
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* GRID */}
        <main>
          {sportHero && (
            <div className="mb-6">
              <img
                src={sportHero.image}
                alt={sportHero.alt}
                draggable={false}
                className="w-full h-[260px] object-cover object-top rounded-2xl"
              />
            </div>
          )}

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">{filtered.length} Results</h2>

            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="recommended">Recommended</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="price_asc">Price: Low to High</option>
              </select>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((card) => (
              <CardTile
                key={card.id}
                card={card}
                wished={!!wishlist[normId(card.id)]}               // ✅ clave normalizada
                onToggleWish={() => toggleWish(card.id)}          // ✅ toggle normaliza adentro
                onOpen={() => setSelectedId(card.id)}
                onAddToCart={() => addToCart(card.id)}
              />
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="text-sm text-gray-600">
              Page <span className="font-semibold text-gray-900">{safePage}</span> of{" "}
              <span className="font-semibold text-gray-900">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="cursor-pointer rounded-full border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="cursor-pointer rounded-full border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* CARROUSEL ABAJO */}
      <TopCardsShowcase items={topShowcaseItems} onSelect={(id) => setSelectedId(id)} />

      {/* MODAL */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={() => setSelectedId(null)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{selectedCard.player}</span> ·{" "}
                <span className="uppercase">{selectedCard.sport}</span> ·{" "}
                <span className="font-mono">{selectedCard.id}</span>
              </div>

              <button
                type="button"
                className="rounded-full border border-gray-200 p-2 hover:bg-gray-50"
                onClick={() => setSelectedId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
              <div className="relative h-[420px] border-b border-gray-200 bg-[#f3f4f6] md:border-b-0 md:border-r">
                <div className="relative z-10 flex h-full items-center justify-center p-6">
                  <img
                    src={selectedCard.image?.trim() ? selectedCard.image : getFallback(selectedCard.sport)}
                    alt={selectedCard.title}
                    className="h-full w-full select-none object-contain"
                    draggable={false}
                  />
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold leading-snug text-gray-900">{selectedCard.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{selectedCard.player}</p>

                <div className="mt-5 text-2xl font-bold text-gray-900">{formatUSD(selectedCard.price)}</div>

                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    onClick={() => addToCart(selectedCard.id)}
                    className="flex-1 rounded-full bg-sky-500 py-3 text-sm font-semibold text-white hover:bg-sky-600"
                  >
                    Add to cart
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleWish(selectedCard.id)}
                    className="rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50"
                  >
                    {wishlist[normId(selectedCard.id)] ? "Saved" : "Save"}
                  </button>
                </div>

                <p className="mt-6 text-xs text-gray-500">Tip: después sumamos condición, año, set y frente/dorso.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarCard({
  title,
  card,
  onOpen,
}: {
  title: string;
  card: Card;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full rounded-2xl p-[2px] text-left transition"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-200 via-cyan-200 to-blue-200 opacity-0 blur-lg transition group-hover:opacity-70" />

      <div className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition group-hover:shadow-md">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>

        <div className="mt-3 relative h-28 overflow-hidden rounded-xl border border-gray-200 bg-[#f3f4f6]">
          <img
            src={card.image?.trim() ? card.image : getFallback(card.sport)}
            alt={card.title}
            className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
            draggable={false}
          />
        </div>

        <p className="mt-3 line-clamp-2 text-sm font-semibold text-gray-900">{card.title}</p>
        <p className="mt-1 text-xs text-gray-500">{card.player}</p>

        <div className="mt-2 flex items-center gap-2">
          <p className="text-sm font-bold text-gray-900">{formatUSD(card.price)}</p>

          {isGreatDeal(card) && (
            <span className="rounded-full bg-green-100 px-2 py-1 text-[11px] font-semibold text-green-700">
              Great Deal
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function CardTile({
  card,
  wished,
  onToggleWish,
  onOpen,
  onAddToCart,
}: {
  card: Card;
  wished: boolean;
  onToggleWish: () => void;
  onOpen: () => void;
  onAddToCart: () => void;
}) {
  const img = card.image?.trim() ? card.image : getFallback(card.sport);

  return (
    <div className="group relative rounded-[22px] p-[2px] transition">
      <div className="absolute inset-0 rounded-[22px] bg-gradient-to-r from-sky-200 via-cyan-200 to-blue-200 opacity-0 blur-lg transition group-hover:opacity-70" />

      <div className="relative overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm transition group-hover:shadow-lg">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWish();
          }}
          className="absolute right-4 top-4 z-20 rounded-full border border-gray-200 bg-white/90 p-2 shadow-sm backdrop-blur hover:bg-gray-50"
          aria-label="Save"
        >
          <Heart
            size={18}
            className={wished ? "text-pink-600" : "text-gray-600"}
            fill={wished ? "currentColor" : "none"}
          />
        </button>

        <div
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpen();
          }}
          className="block w-full text-left"
        >
          <div className="relative h-[280px] overflow-hidden border-b border-gray-200 bg-[#f3f4f6]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.95),rgba(255,255,255,0)_58%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(0,0,0,0.10),rgba(0,0,0,0)_65%)] opacity-40" />
            <div className="relative z-10 flex h-full items-center justify-center">
              <img
                src={img}
                alt={card.title}
                className="h-full object-contain p-6 transition duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </div>
          </div>

          <div className="space-y-3 p-5">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">{card.title}</h3>
            <p className="text-sm text-gray-500">{card.player}</p>

            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-gray-900">{formatUSD(card.price)}</p>
              {isGreatDeal(card) && (
                <span className="rounded-full bg-green-200 px-2 py-1 text-xs font-semibold text-green-700">
                  Great Deal
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              className="w-full rounded-full bg-sky-400 py-3 text-sm font-semibold text-white hover:bg-sky-600"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
