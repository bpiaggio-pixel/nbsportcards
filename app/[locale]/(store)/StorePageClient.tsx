"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Heart, X, ShoppingCart, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import BannerFX from "@/components/BannerFX";
import Image from "next/image";

type Sport = "basketball" | "soccer" | "nfl" | "pokemon";

type Card = {
  id: string;
  sport: Sport;
  title: string;
  player: string;
  price: number;
  priceCents?: number;
  image?: string;
  image2?: string;
  views?: number;
  createdAt?: string;
  updatedAt?: string;

  // ✅ STOCK
  stock?: number;

  // ✅ AUTÓGRAFO
  auto?: boolean;

  great_deal?: string;
  greatDeal?: string;
  inventory_location?: string;   
  ships_from?: string;          
};

type SessionUser = { id: string; email: string } | null;

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

// 🔥 Global Sale Config
const SALE_ACTIVE = String(process.env.NEXT_PUBLIC_SALE_ACTIVE ?? "false") === "true";

// Mapa de descuentos por deporte. Ej: {"soccer":10,"basketball":5}
const SALES_RULES: Record<string, number> = (() => {
  try {
    const raw = process.env.NEXT_PUBLIC_SALES_RULES ?? "{}";
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
})();

function getSalePercentForSport(sport?: Sport | string) {
  const s = String(sport ?? "").trim().toLowerCase();
  const percent = Number((SALES_RULES as any)[s] ?? 0);
  return Number.isFinite(percent) ? percent : 0;
}
// Siempre trabajar en CENTAVOS (enteros)
function getBaseCents(card: { price: number; priceCents?: number }) {
  if (typeof card.priceCents === "number" && Number.isFinite(card.priceCents)) return card.priceCents;
  return Math.round(Number(card.price) * 100);
}

// Devuelve CENTAVOS (enteros)
function applySalePrice(cents: number, sport?: Sport | string) {
  if (!SALE_ACTIVE) return cents;

  const percent = getSalePercentForSport(sport);
  if (percent <= 0) return cents;

  const discounted = cents * (1 - percent / 100);
  return Math.round(discounted);
}

function getFallback(sport: Sport) {
  if (sport === "basketball") return "/images/basketball.jpg";
  if (sport === "soccer") return "/images/soccer.jpg";
  if (sport === "nfl") return "/images/nfl.jpg";
  if (sport === "pokemon") return "/images/pokemon.jpg";
  return "/images/cards.jpg";
}

function isGreatDeal(card: Card) {
  const raw = String(card.greatDeal ?? card.great_deal ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return raw === "si" || raw === "true" || raw === "1" || raw === "x" || raw === "yes";
}

function getInventoryLocation(card: Card) {
  return String(card.inventory_location ?? "")
    .trim()
    .toLowerCase();
}

function getShipsFrom(card: Card) {
  return String(card.ships_from ?? "")
    .trim()
    .toLowerCase();
}

function getInventoryBadge(card: Card) {
  const location = getInventoryLocation(card);

  if (location === "comc") {
    return {
      label: "Stored at COMC",
      className: "bg-blue-100 text-blue-600",
    };
  }

  if (location === "fanatics") {
    return {
      label: "Stored at Fanatics",
      className: "bg-blue-100 text-blue-600",
    };
  }

  if (location === "argentina") {
    return {
      label: "Stored in Argentina",
      className: "bg-blue-100 text-blue-600",
    };
  }

  return null;
}

function parsePercent(input: unknown, fallbackYes = 1) {
  // Acepta: "25%", "25", "25.5", etc.
  // Si viene algo tipo "si/true/x" (sin número), devuelve fallbackYes.
  const s = String(input ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const m = s.match(/-?\d+(?:[\.,]\d+)?/);
  if (m) {
    const n = Number(m[0].replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  if (s === "si" || s === "true" || s === "1" || s === "x" || s === "yes") return fallbackYes;
  return 0;
}

/* -------------------------
   BANNER (por deporte)
-------------------------- */
function getBannerSrc(s: "all" | Sport) {
  if (s === "basketball") return "/banners/basketball1.webp";
  if (s === "soccer") return "/banners/soccer.webp";
  if (s === "nfl") return "/banners/nfl.webp";
  if (s === "pokemon") return "/banners/pokemon.webp";
  return "/banners/all9d.webp";
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
  const t = setInterval(() => {
    setOrder((prev) => rotateLeft(prev));
  }, intervalMs);

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
                      <img src={c.image} alt={c.title} className="h-full w-full object-contain p-3" draggable={false} />
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

/* STORE PAGE CLIENT (REAL) */
export default function StorePageClient() {
  const t = useTranslations("Store");
  const locale = useLocale();
  const router = useRouter();
  const [addedToCartId, setAddedToCartId] = React.useState<string | null>(null);
  const [maxStockId, setMaxStockId] = React.useState<string | null>(null);
  const pathname = usePathname();
  const [cards, setCards] = React.useState<Card[]>([]);
  const [total, setTotal] = React.useState(0);
  const [topShowcaseCards, setTopShowcaseCards] = React.useState<Card[]>([]);
  const [cardsLoading, setCardsLoading] = React.useState(true);

 // ✅ NUEVO STATE PARA LOS HIGHLIGHTS
const [highlights, setHighlights] = React.useState<{
  mostViewed: Card | null;
  recommended: Card | null;
  greatDealPick: Card | null;
}>({
  mostViewed: null,
  recommended: null,
  greatDealPick: null,
});

  // ✅ BUSCADOR: se lee desde la URL (?q=...)
  const searchParams = useSearchParams();
  const search = (searchParams?.get("q") ?? "").toLowerCase().trim();

const normId = React.useCallback((v: any) => String(v ?? "").trim(), []);

  // ✅ ZOOM + PAN (solo para el modal)
  const [zoom, setZoom] = React.useState(1);
  const ZOOM_MIN = 0.6;
  const ZOOM_MAX = 4;
  const clampZoom = (v: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v));

  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const dragRef = React.useRef<{
    dragging: boolean;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);
// ✅ Pinch-to-zoom (2 dedos) usando Pointer Events
const pointersRef = React.useRef(new Map<number, { x: number; y: number }>());
const pinchRef = React.useRef<{
  pinching: boolean;
  startDist: number;
  startZoom: number;
  startPan: { x: number; y: number };
  startMid: { x: number; y: number };
  containerRect: { left: number; top: number; width: number; height: number };
} | null>(null);

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

  // ✅ Límites de pan (evita que la imagen se vaya “fuera de vista”)
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mediaRef = React.useRef<HTMLImageElement | null>(null);

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  const clampPan = (nextPan: { x: number; y: number }, nextZoom: number) => {
    const c = containerRef.current;
    const m = mediaRef.current;
    if (!c || !m) return nextPan;

    const cw = c.clientWidth;
    const ch = c.clientHeight;

    // tamaño base (sin transform). Para <img> funciona bien.
    const baseW = m.offsetWidth;
    const baseH = m.offsetHeight;

    const scaledW = baseW * nextZoom;
    const scaledH = baseH * nextZoom;

    const maxX = Math.max(0, (scaledW - cw) / 2);
    const maxY = Math.max(0, (scaledH - ch) / 2);

    return {
      x: clamp(nextPan.x, -maxX, maxX),
      y: clamp(nextPan.y, -maxY, maxY),
    };
  };

  React.useEffect(() => {
    // Si cambia el zoom por botones o por pinch, ajusta el pan a los nuevos límites
    setPan((p) => clampPan(p, zoom));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  // ✅ 1) Normaliza IDs y elimina duplicados por id (NORMALIZADO)
  // ✅ + Normaliza stock a number
const uniqueCards = React.useMemo(() => {
  const map = new Map<string, Card>();

  for (const c of cards) {
    const id = normId(c.id);

    if (!id) continue;

    const stock = Math.max(0, Math.floor(Number((c as any).stock ?? 0)));

    // 🔥 IMPORTANTE: forzar ID limpio SIEMPRE
    const normalizedCard = {
      ...c,
      id, // 👈 esto es clave
      stock,
    };

    map.set(id, normalizedCard);
  }

  return Array.from(map.values());
}, [cards, normId]);



  // ✅ 5) blog
  const [latestPost, setLatestPost] = React.useState<any>(null);

React.useEffect(() => {
  async function loadLatestPost() {
    try {
      const res = await fetch(`/api/blog/latest?locale=${locale}`, {
        next: { revalidate: 300 },
      });
      const data = await res.json();
      setLatestPost(data?.post ?? null);
    } catch {}
  }

  loadLatestPost();
}, [locale]);
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
  const [autoFilter, setAutoFilter] = React.useState<"all" | "yes" | "no">("all");
  const [inventoryLocationFilter, setInventoryLocationFilter] = React.useState<"all" | "comc" | "fanatics" | "argentina">("all");
  const [sort, setSort] = React.useState<"recommended" | "price_desc" | "price_asc">("recommended");

  // ✅ mobile filters drawer
  const [filtersOpen, setFiltersOpen] = React.useState(false);

function clearFilters() {
  setSport("all");
  setPlayer("all");
  setAutoFilter("all");
  setInventoryLocationFilter("all");
  setSort("recommended");
  setPage(1);
}

  // pagination
  const pageSize = 9;
  const [page, setPage] = React.useState(1);

React.useEffect(() => {
  setPage(1);
}, [search, sport, player, autoFilter, inventoryLocationFilter, sort]);

React.useEffect(() => {
  let cancelled = false;

  async function loadCards() {
    setCardsLoading(true);

    try {
      const params = new URLSearchParams({
        q: search,
        sport,
        player,
        auto: autoFilter,
        inventory_location: inventoryLocationFilter,
        sort,
        page: String(page),
        pageSize: String(pageSize),
      });

const res = await fetch(`/api/cards?${params.toString()}`, {
  next: { revalidate: 60 },
});
      const data = await res.json();

      if (cancelled) return;

      setCards(Array.isArray(data.cards) ? data.cards : []);
      setTotal(Number(data.total ?? 0));
    } catch {
      if (!cancelled) {
        setCards([]);
        setTotal(0);
      }
    } finally {
      if (!cancelled) setCardsLoading(false);
    }
  }

  loadCards();

  return () => {
    cancelled = true;
  };
}, [search, sport, player, autoFilter, inventoryLocationFilter, sort, page]);
React.useEffect(() => {
  async function loadHighlights() {
    try {
      const params = new URLSearchParams({
        q: search,
        sport,
        player,
        auto: autoFilter,
  inventory_location: inventoryLocationFilter,
      });

      const res = await fetch(`/api/cards/highlights?${params.toString()}`, {
  next: { revalidate: 120 },
});

      const data = await res.json();

      setHighlights({
        mostViewed: data?.mostViewed ?? null,
        recommended: data?.recommended ?? null,
        greatDealPick: data?.greatDealPick ?? null,
      });
    } catch {
      setHighlights({
        mostViewed: null,
        recommended: null,
        greatDealPick: null,
      });
    }
  }

  loadHighlights();
}, [search, sport, player, autoFilter, inventoryLocationFilter]);

React.useEffect(() => {
  async function loadTopShowcase() {
    try {
      const res = await fetch("/api/cards/top-showcase", {
  next: { revalidate: 300 },
});

      const data = await res.json();
      setTopShowcaseCards(Array.isArray(data.cards) ? data.cards : []);
    } catch {
      setTopShowcaseCards([]);
    }
  }

  loadTopShowcase();
}, []);

  // modal
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

const currentQs = React.useMemo(() => {
  const s = searchParams?.toString() ?? "";
  return s ? `?${s}` : "";
}, [searchParams]);

const openCard = React.useCallback(
  (id: string) => {
    setSelectedId(id);
    router.push(`/${locale}/cards/${encodeURIComponent(id)}${currentQs}`, { scroll: false });
  },
  [router, locale, currentQs]
);

const closeCard = React.useCallback(() => {
  setSelectedId(null);
  router.push(`/${locale}${currentQs}`, { scroll: false });
}, [router, locale, currentQs]);

  const [portalRoot, setPortalRoot] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    // Create (or reuse) a dedicated portal root so the modal is always above everything
    const id = "app-portal-root";
    let el = document.getElementById(id) as HTMLElement | null;
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      document.body.appendChild(el);
    }
    setPortalRoot(el);
  }, []);

  React.useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") closeCard();
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [closeCard]);
const selectedCard = React.useMemo(() => {
  if (!selectedId) return null;

  const safeId = normId(selectedId);

  const highlightCards = [
    highlights.mostViewed,
    highlights.recommended,
    highlights.greatDealPick,
  ].filter(Boolean) as Card[];

  return (
    uniqueCards.find((c) => normId(c.id) === safeId) ??
    topShowcaseCards.find((c) => normId(c.id) === safeId) ??
    highlightCards.find((c) => normId(c.id) === safeId) ??
    null
  );
}, [uniqueCards, topShowcaseCards, highlights, selectedId, normId]);

const [activeSide, setActiveSide] = React.useState<"front" | "back">("front");

  // ✅ bloquear scroll del body cuando el modal está abierto
  React.useEffect(() => {
    if (!selectedCard) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedCard]);

  // ✅ reset del zoom al abrir/cerrar modal
  React.useEffect(() => {
    setZoom(1);
  }, [selectedId]);

  // ✅ reset del pan al abrir/cerrar modal (MOVIDO AQUÍ: ya existe selectedId)
  React.useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [selectedId]);

  React.useEffect(() => {
    setActiveSide("front");
  }, [selectedId]);

  const frontImg =
    selectedCard?.image?.trim() ? selectedCard.image : selectedCard ? getFallback(selectedCard.sport) : "";

  const backImg = selectedCard?.image2?.trim() ? selectedCard.image2 : "";

  const activeImg = activeSide === "back" && backImg ? backImg : frontImg;

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

  // ✅ cargar favoritos del user (NORMALIZADOS)
  React.useEffect(() => {
    async function loadFavs() {
      if (!user?.id) return;

      try {
        const res = await fetch(`/api/favorites?userId=${encodeURIComponent(user.id)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        const ids: string[] = Array.isArray(data.cardIds) ? data.cardIds : [];

        const normalized = ids.map(normId).filter(Boolean);
        setWishlist(Object.fromEntries(normalized.map((id) => [id, true])));
      } catch {
        setWishlist({});
      }
    }
    loadFavs();
  }, [user?.id, normId]);

  // ✅ TOGGLE FAVORITO
  async function toggleWish(id: string) {
    const cardId = normId(id);

    if (!user?.id) {
      setWishlist((prev) => {
        const next = { ...prev };
        if (next[cardId]) delete next[cardId];
        else next[cardId] = true;
        return next;
      });
      window.dispatchEvent(new Event("wishlist:changed"));
      return;
    }

    const res = await fetch("/api/favorites/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, cardId }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.log("toggle favorite error:", data);
      return;
    }

    const favorited = !!data.favorited;
    const returnedId = normId(data.cardId ?? cardId);

    setWishlist((prev) => {
      const next = { ...prev };
      if (favorited) next[returnedId] = true;
      else delete next[returnedId];
      return next;
    });

    window.dispatchEvent(new Event("wishlist:changed"));
  }

  // ✅ listado de jugadores
  const players = React.useMemo(() => {
    const set = new Set<string>();

    const base = sport === "all" ? uniqueCards : uniqueCards.filter((c) => c.sport === sport);

    for (const c of base) {
      const p = c.player?.trim();
      if (p) set.add(p);
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [uniqueCards, sport]);

  // ✅ resetear player si ya no existe en el sport seleccionado
  React.useEffect(() => {
    if (player === "all") return;
    if (players.includes(player)) return;
    setPlayer("all");
  }, [sport, players, player]);

  // ✅ filtros


const totalPages = Math.max(1, Math.ceil(total / pageSize));
const safePage = Math.min(Math.max(page, 1), totalPages);
const paged = cards;

async function addToCart(cardId: string) {
  if (!user?.id) {
    const redirectTo = pathname ?? `/${locale}`;
    router.push(`/${locale}/login?redirect=${encodeURIComponent(redirectTo)}`);
    return { ok: false };
  }

  try {
    const safeId = normId(cardId);

    const card = uniqueCards.find((c) => normId(c.id) === safeId);
    const stock = Number(card?.stock ?? 0);

    if (stock <= 0) {
      return { ok: false, reason: "OUT_OF_STOCK" };
    }

    const cartRes = await fetch(`/api/cart?userId=${encodeURIComponent(user.id)}`, {
      cache: "no-store",
    });

    const cartData = await cartRes.json();

    const existing = Array.isArray(cartData.items)
      ? cartData.items.find((x: any) => normId(x.cardId) === safeId)
      : null;

    const currentQty = Number(existing?.qty ?? 0);
    const nextQty = currentQty + 1;

    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        cardId: safeId,
        qty: nextQty,
      }),
    });


    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (data?.error === "MAX_STOCK_EXCEEDED") {
        return { ok: false, reason: "MAX_STOCK" };
      }
      if (data?.error === "OUT_OF_STOCK") {
        return { ok: false, reason: "OUT_OF_STOCK" };
      }

      console.log("addToCart error:", data);
      return { ok: false };
    }

    window.dispatchEvent(new Event("cart:changed"));

    return { ok: true };
  } catch (e) {
    console.log("addToCart error:", e);
    return { ok: false };
  }
}

async function handleAddToCart(cardId: string) {
  const safeId = normId(cardId);

  const result = await addToCart(safeId);

  if (!result?.ok) {
    if (result?.reason === "MAX_STOCK" || result?.reason === "OUT_OF_STOCK") {
      setMaxStockId(safeId);

      window.setTimeout(() => {
        setMaxStockId((id) => (id === safeId ? null : id));
      }, 1500);
    }
    return;
  }

  setAddedToCartId(safeId);

  window.setTimeout(() => {
    setAddedToCartId((id) => (id === safeId ? null : id));
  }, 900);
}
// ✅ Items para el showcase (Great Deal primero, completa si faltan)
const topShowcaseItems = React.useMemo(() => {
  const deals = topShowcaseCards.filter((c) => isGreatDeal(c));
  const others = topShowcaseCards.filter((c) => !isGreatDeal(c));

  return [...deals, ...others]
  .slice(0, 7)
  .map((c) => ({
    id: c.id,
    title: c.title,
    image: getCardThumb(c.image?.trim() ? c.image : getFallback(c.sport)),
  }));
}, [topShowcaseCards]);

  const favCount = React.useMemo(() => Object.values(wishlist).filter(Boolean).length, [wishlist]);

  return (
<div className="min-h-screen bg-gradient-to-b from-black from-0% via-gray-800 via-35% to-white to-65% text-white">

{/* MAIN */}
<div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-6 lg:grid-cols-[280px_1fr] lg:px-6 lg:py-10">
        {/* SIDEBAR */}
<aside className="hidden lg:block space-y-6 rounded-3xl border border-white/30 bg-gradient-to-b from-white/90 via-white/82 to-white/72 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.14)] backdrop-blur-md lg:p-6">          <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{t("filters")}</h2>
          <button
            type="button"
            onClick={clearFilters}
            className=" text-xs
  px-3 py-1
  rounded-md
  border border-gray-300
  bg-white
  text-gray-700
  hover:bg-sky-500
  hover:text-white
  hover:border-sky-500
  cursor-pointer
  transition-colors
  duration-200"
          >
            Limpiar
          </button>
        </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-gray-800">{t("category")}</p>
            <div className="space-y-2 text-sm text-gray-700">
              <label className="flex items-center gap-2">
                <input type="radio" checked={sport === "all"} onChange={() => setSport("all")} />
                {t("all")}
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
	<label className="flex items-center gap-2">
  		<input type="radio" checked={sport === "pokemon"} onChange={() => setSport("pokemon")} />
  		Pokemon
		</label>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-gray-800">Player</p>
            <select
              value={player}
              onChange={(e) => setPlayer(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="all">{t("all")}</option>
              {players.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-gray-800">{t("auto")}</p>
            <select
              value={autoFilter}
              onChange={(e) => setAutoFilter(e.target.value as any)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="all">{t("all")}</option>
              <option value="yes">{t("autosi")}</option>
              <option value="no">{t("autono")}</option>
            </select>
          </div>
<div>
  <p className="mb-3 text-sm font-semibold text-gray-800">Stored at</p>
  <select
    value={inventoryLocationFilter}
    onChange={(e) => setInventoryLocationFilter(e.target.value as any)}
    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-black/10"
  >
    <option value="all">{t("all")}</option>
    <option value="comc">COMC</option>
    <option value="fanatics">Fanatics</option>
    <option value="argentina">Argentina</option>
  </select>
</div>

          <div>
            <p className="mb-3 text-sm font-semibold text-gray-800">{t("wishlist")}</p>
            <div className="text-sm text-gray-600">
              {t("saved")}: <span className="font-semibold text-gray-900">{favCount}</span>
            </div>
          </div>

          <div className="my-8 border-t border-gray-200" />

          <div className="pt-2">
            <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">
  {t("highlights")}
</h3>

            <div className="space-y-10 min-h-[760px]">
              {highlights.mostViewed && (
  <div className="transition hover:-translate-y-[1px] hover:shadow-md">
    <SidebarCard
      title={t("mostViewed")}
      card={highlights.mostViewed}
      onOpen={() => openCard(highlights.mostViewed!.id)}
    />
  </div>
)}

{highlights.recommended && (
  <div className="transition hover:-translate-y-[1px] hover:shadow-md">
    <SidebarCard
      title={t("recommended")}
      card={highlights.recommended}
      onOpen={() => openCard(highlights.recommended!.id)}
    />
  </div>
)}

{highlights.greatDealPick && (
  <div className="transition hover:-translate-y-[1px] hover:shadow-md">
    <SidebarCard
      title={t("greatDeal")}
      card={highlights.greatDealPick}
      onOpen={() => openCard(highlights.greatDealPick!.id)}
    />
  </div>
)}

              {/* ✅ BLOG (última nota) */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm min-h-[320px]">
                <div className="text-sm font-bold text-gray-900 mb-3">Blog</div>

                {latestPost ? (
                  <>
                    <a
                      href={`/${locale}/blog/${String(latestPost.slug).replace(/^\/+/, "")}`}
                      className="block text-sm font-semibold text-gray-800 hover:text-black transition"
                    >
                      {latestPost.title}
                    </a>
                    {latestPost.coverImage && (
  <div className="relative mb-5 h-32 w-full overflow-hidden rounded-xl border border-gray-200">
    <Image
      src={`/${latestPost.coverImage.replace(/^[/\\]+/, "").replace(/\\/g, "/")}`}
      alt={latestPost.title}
      fill
      sizes="300px"
      className="object-cover"
    />
  </div>
)}

                    <p className="mt-1 text-sm text-gray-500 line-clamp-4">{latestPost.excerpt}</p>

                      <a href={`/${locale}/blog`} className="font-semibold mt-2 text-sm text-sky-600 hover:text-sky-900">
                      {t("goToBlog")}
                    </a>
                  </>
                ) : (
                  <div className="text-xs text-gray-500">Sin artículos todavía</div>
                )}
              </div>
            </div>
          </div>
        </aside>

{/* ✅ MOBILE FILTERS DRAWER */}
{filtersOpen && (
  <div className="fixed inset-0 z-[200] lg:hidden">
    {/* fondo */}
    <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />

    {/* panel */}
   <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto rounded-t-3xl bg-gradient-to-b from-gray-100 to-gray-200 p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-bold text-gray-900">{t("filters")}</div>
        <div className="flex items-center gap-2"><button type="button" onClick={clearFilters} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-sky-600 hover:bg-gray-50">Limpiar</button><button
          type="button"
          onClick={() => setFiltersOpen(false)}
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          Close
        </button>
      </div></div>

      {/* ✅ filtros (mobile) */}
      <div className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-semibold text-gray-800">{t("category")}</p>
          <div className="space-y-2 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input type="radio" checked={sport === "all"} onChange={() => setSport("all")} />
              {t("all")}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={sport === "basketball"}
                onChange={() => setSport("basketball")}
              />
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
		<label className="flex items-center gap-2">
  		<input type="radio" checked={sport === "pokemon"} onChange={() => setSport("pokemon")} />
  		Pokemon
		</label>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-gray-800">Player</p>
          <select
            value={player}
            onChange={(e) => setPlayer(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
          >
            <option value="all">{t("all")}</option>
            {players.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
<div>
  <p className="mb-3 text-sm font-semibold text-gray-800">{t("auto")}</p>
  <select
    value={autoFilter}
    onChange={(e) => setAutoFilter(e.target.value as any)}
    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-black/10"
  >
    <option value="all">{t("all")}</option>
    <option value="yes">{t("autosi")}</option>
    <option value="no">{t("autono")}</option>
  </select>
</div>

<div>
  <p className="mb-3 text-sm font-semibold text-gray-800">Stored at</p>
  <select
    value={inventoryLocationFilter}
    onChange={(e) => setInventoryLocationFilter(e.target.value as any)}
    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-black/10"
  >
    <option value="all">{t("all")}</option>
    <option value="comc">COMC</option>
    <option value="fanatics">Fanatics</option>
    <option value="argentina">Argentina</option>
  </select>
</div>
        <div>
          <p className="mb-3 text-sm font-semibold text-gray-800">{t("wishlist")}</p>
          <div className="text-sm text-gray-600">
            {t("saved")}: <span className="font-semibold text-gray-900">{favCount}</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setFiltersOpen(false)}
          className="w-full rounded-full bg-black py-3 text-sm font-semibold text-white hover:bg-gray-900"
        >
          Ver resultados
        </button>
      </div>
    </div>
  </div>
)}

{/* GRID */}
        <main>
          {/* BANNER SOLO EN COLUMNA DE TARJETAS */}
          <div className="-mt-10 mb-6 overflow-hidden">
  <div className="relative h-[180px] sm:h-[230px] md:h-[300px] w-full bg-gradient-to-b from-black via-gray-900 to-transparent">


    {/* FX atrás */}

<div className="pointer-events-none absolute inset-0 z-[7] hidden md:block">
  <BannerFX density={240} />
</div>



{/* Glow azul detrás de los jugadores */}



<div className="pointer-events-none absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-black via-gray/90 to-transparent z-20" />
<div className="pointer-events-none absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-black via-gray/0 to-transparent z-20" />
<div className="pointer-events-none absolute bottom-0 left-0 w-full h-18 bg-gradient-to-t from-black via-gray/95 to-transparent z-20" />


    {/* PNG jugadores */}
    <div className="relative h-[180px] sm:h-[230px] md:h-[300px] w-full bg-gradient-to-b from-black via-gray-900 to-transparent">
<Image
  src={getBannerSrc(sport)}
  alt="Category banner"
  fill
  priority
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 900px"
  className="relative z-10 object-contain select-none md:animate-[bannerZoom_10s_ease-in-out_infinite_alternate]"
/>
</div>

<style jsx>{`
  @keyframes bannerZoom {
    from {
      transform: scale(1);
    }
    to {
      transform: scale(1.09);
    }
  }
`}</style>

  </div>
</div>



          <div className="mb-6 flex min-h-[44px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <h2 className="min-h-[28px] text-lg font-semibold">
    {total} {t("results")}
  </h2>

            <div className="flex items-center gap-2">
      {/* ✅ Mobile: abrir menú de filtros */}
      <button
  type="button"
  onClick={() => setFiltersOpen(true)}
  className="rounded-full border border-gray-300 bg-gradient-to-b from-gray-200 to-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:from-gray-300 hover:to-gray-400 lg:hidden transition"
>
  {t("filters")}
</button>

      <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="rounded-xl border border-gray-300 bg-gradient-to-b from-white via-gray-200 to-gray-300 shadow-sm px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="recommended">{t("sortRecommended")}</option>
                <option value="price_desc">{t("priceHighToLow")}</option>
                <option value="price_asc">{t("priceLowToHigh")}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 items-start min-h-[2200px] sm:min-h-[1800px] lg:gap-6 lg:grid-cols-3 lg:min-h-[980px]">
  {cardsLoading
  ? Array.from({ length: 9 }).map((_, i) => <CardTileSkeleton key={i} />)
  : paged.map((card, index) => (
      <CardTile
        key={card.id}
        card={card}
        index={index}
        wished={!!wishlist[normId(card.id)]}
        added={addedToCartId === normId(card.id)}
        maxStock={maxStockId === normId(card.id)}
        onToggleWish={() => toggleWish(card.id)}
        onOpen={() => {
          openCard(card.id);
          fetch(`/api/cards/${encodeURIComponent(card.id)}/view`, { method: "POST" }).catch(() => {});
        }}
        onAddToCart={() => handleAddToCart(card.id)}
        t={t}
      />
    ))}
</div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="text-sm text-gray-600">
              {t("page")} <span className="font-semibold text-gray-900">{safePage}</span> of{" "}
              <span className="font-semibold text-gray-900">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
  type="button"
  onClick={() => setPage(1)}
  disabled={safePage === 1}
  className="cursor-pointer rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
>
  {t("first")}
</button>

               <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="cursor-pointer rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="cursor-pointer rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t("next")}
              </button>

<button
  type="button"
  onClick={() => setPage(totalPages)}
  disabled={safePage === totalPages}
  className="cursor-pointer rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
>
  {t("last")}
</button>
            </div>
          </div>
        </main>
      </div>

      {/* CARROUSEL ABAJO */}
      <TopCardsShowcase items={topShowcaseItems} onSelect={(id) => openCard(id)} />

{/* MODAL */}
{portalRoot && selectedCard && createPortal(
        <div
                  className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 md:p-10"

                  onPointerDown={closeCard}
                >
                  <div
                     className="w-full max-w-4xl max-h-[78vh] md:max-h-[82vh] overflow-hidden rounded-3xl bg-white shadow-xl flex flex-col"

                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-300 bg-gradient-to-b from-gray-100 to-gray-200 px-6 py-4 relative pr-16">
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{selectedCard.player}</span> ·{" "}
                        <span className="uppercase">{selectedCard.sport}</span> ·{" "}
                        <span className="font-mono">{selectedCard.id}</span>
                      </div>
        

                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full border border-gray-200 bg-white/90 backdrop-blur p-2 hover:bg-gray-50"
                        onClick={closeCard}
                      >
                        <X size={18} />
                      </button>
                    </div>
        
                    <div className="grid flex-1 gap-0 overflow-y-auto md:grid-cols-[1.2fr_0.8fr]">
                      <div
                        className="relative h-[260px] sm:h-[340px] md:h-[380px] lg:h-[600px] border-b border-gray-200 bg-[#f3f4f6] md:border-b-0 md:border-r"
                        onWheelCapture={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const factor = e.deltaY > 0 ? 0.9 : 1.1;
                          setZoom((z) => clampZoom(z * factor));
                        }}
                        style={{ overscrollBehavior: "contain" }}
                      >
                        {/* controles de zoom */}
                        <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setZoom((z) => clampZoom(z * 1.1))}
                            className="rounded-full border border-gray-200 bg-white/90 px-3 py-2 text-sm font-bold shadow-sm backdrop-blur hover:bg-gray-50"
                            aria-label="Zoom in"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => setZoom((z) => clampZoom(z / 1.1))}
                            className="rounded-full border border-gray-200 bg-white/90 px-3 py-2 text-sm font-bold shadow-sm backdrop-blur hover:bg-gray-50"
                            aria-label="Zoom out"
                          >
                            –
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setZoom(1);
                              setPan({ x: 0, y: 0 });
                            }}
                            className="rounded-full border border-gray-200 bg-white/90 px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur hover:bg-gray-50"
                            aria-label="Reset zoom"
                          >
                            1:1
                          </button>
                        </div>
        
                        <div
                          className="relative z-10 flex h-full items-center justify-center p-6 overflow-hidden"
                          ref={containerRef}
                          style={{
                            cursor: zoom > 1 ? "grab" : "default",
                            touchAction: "none",
                          }}
                          onPointerDown={(e) => {
  const el = e.currentTarget as HTMLDivElement;
  el.setPointerCapture(e.pointerId);

  // guardo este dedo
  pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

  // si ahora hay 2 dedos -> arranca pinch
  if (pointersRef.current.size === 2) {
    const pts = Array.from(pointersRef.current.values());
    const rect = el.getBoundingClientRect();

    pinchRef.current = {
      pinching: true,
      startDist: dist(pts[0], pts[1]),
      startZoom: zoom,
      startPan: { ...pan },
      startMid: mid(pts[0], pts[1]),
      containerRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    };

    // corto cualquier drag previo
    if (dragRef.current) dragRef.current.dragging = false;
    return;
  }

  // si es 1 dedo y hay zoom, permito pan (drag)
  if (zoom <= 1) return;

  dragRef.current = {
    dragging: true,
    sx: e.clientX,
    sy: e.clientY,
    ox: pan.x,
    oy: pan.y,
  };
}}
onPointerMove={(e) => {
  // actualizo posición del dedo
  if (pointersRef.current.has(e.pointerId)) {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  // si estoy pincheando y sigo con 2 dedos
  if (pinchRef.current?.pinching && pointersRef.current.size === 2) {
    const pts = Array.from(pointersRef.current.values());
    const info = pinchRef.current;

    const newDist = dist(pts[0], pts[1]);
    const ratio = newDist / Math.max(1, info.startDist);

    const newZoom = clampZoom(info.startZoom * ratio);

    // mantengo el “punto bajo los dedos” estable ajustando pan
    const rect = info.containerRect;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const m = mid(pts[0], pts[1]);
    const d0 = { x: m.x - cx, y: m.y - cy };

    const Z0 = info.startZoom;
    const Z1 = newZoom;
    const r = Z1 / Math.max(0.0001, Z0);

    const newPan = {
      x: d0.x * (1 - r) + info.startPan.x * r,
      y: d0.y * (1 - r) + info.startPan.y * r,
    };

    setZoom(newZoom);
    setPan(clampPan(newPan, newZoom));
    return;
  }

  // si no hay pinch, manejo drag (pan)
  const st = dragRef.current;
  if (!st?.dragging) return;

  const dx = e.clientX - st.sx;
  const dy = e.clientY - st.sy;
  setPan(clampPan({ x: st.ox + dx, y: st.oy + dy }, zoom));
}}
onPointerUp={(e) => {
  pointersRef.current.delete(e.pointerId);

  // si ya no hay 2 dedos, termina pinch
  if (pointersRef.current.size < 2 && pinchRef.current?.pinching) {
    pinchRef.current = null;
  }

  const st = dragRef.current;
  if (st) dragRef.current = { ...st, dragging: false };

  try {
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  } catch {}
}}
onPointerCancel={(e) => {
  pointersRef.current.delete(e.pointerId);
  if (pointersRef.current.size < 2 && pinchRef.current?.pinching) {
    pinchRef.current = null;
  }
  const st = dragRef.current;
  if (st) dragRef.current = { ...st, dragging: false };
}}

                        >
                          <img
                            ref={mediaRef}
                            src={activeImg}
                            alt={`${selectedCard.title} - ${activeSide}`}
                            draggable={false}
                            style={{
                              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                              transformOrigin: "center",
                            }}
                            className="h-full w-full select-none object-contain transition-transform"
                          />
                        </div>
                      </div>
        
                      <div className="p-6">
                        <h3 className="text-lg font-semibold leading-snug text-gray-900">{selectedCard.title}</h3>
                        <p className="mt-2 text-sm text-gray-600">{selectedCard.player}</p>

        
{(() => {
  const baseCents = getBaseCents(selectedCard);
  const discountedCents = applySalePrice(baseCents, selectedCard.sport);
  const percent = getSalePercentForSport(selectedCard.sport);
  const onSale = SALE_ACTIVE && percent > 0;
  const badge = getInventoryBadge(selectedCard);
  const shipsFrom = getShipsFrom(selectedCard);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {onSale && (
          <span className="rounded-full bg-gray-200 text-gray-800 px-2 py-0.5 text-[10px] font-bold">
            -{percent}%
          </span>
        )}

        {isGreatDeal(selectedCard) && (
          <span className="rounded-full bg-green-200 px-2 py-0.5 text-[10px] font-semibold text-green-700">
            Great Deal
          </span>
        )}

        {badge && (
          <span className={`shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${badge.className}`}>
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        {onSale && (
          <span className="text-xs text-gray-400 line-through">
            {formatUSD(baseCents / 100)}
          </span>
        )}

        <span className={`text-sm font-bold ${onSale ? "text-sky-600" : "text-gray-900"}`}>
          {formatUSD(discountedCents / 100)}
        </span>
      </div>

      {shipsFrom && (
        <p className="mt-2 text-xs text-gray-500">
          This card ships from {shipsFrom}.
        </p>
      )}
    </div>
  );
})()} 


   
                        {/* ✅ STOCK: modal */}
                        {((selectedCard.stock ?? 0) <= 0) && (
                          <div className="mt-3 inline-flex rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                            Sin stock
                          </div>
                        )}
        
                        <div className="mt-6 flex gap-2">
                          <button
  type="button"
  onClick={() => handleAddToCart(selectedCard.id)}
  disabled={(selectedCard.stock ?? 0) <= 0}
  className={[
    "flex-1 rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer",
    (selectedCard.stock ?? 0) <= 0
      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
      : maxStockId === normId(selectedCard.id)
      ? "bg-orange-500 text-white scale-[0.97]"
      : addedToCartId === normId(selectedCard.id)
      ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-[0.97]"
      : "bg-gradient-to-r from-sky-400 to-sky-600 text-white hover:from-sky-600 hover:to-sky-800 shadow-md active:scale-[0.97]",
  ].join(" ")}
>
  {(selectedCard.stock ?? 0) <= 0 ? (
    "Sin stock"
  ) : maxStockId === normId(selectedCard.id) ? (
    "Máximo disponible"
  ) : addedToCartId === normId(selectedCard.id) ? (
    <>
      <Check size={18} />
      Added!
    </>
  ) : (
    <>
      <ShoppingCart size={18} />
      {t("addToCart")}
    </>
  )}
</button>
        
                          <button
                            type="button"
                            onClick={() => toggleWish(selectedCard.id)}
                            className="rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50"
                          >
                            {wishlist[normId(selectedCard.id)] ? t("savedBtn") : t("save")}
                          </button>
                        </div>
        
                        <div className="mt-14 flex gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSide("front");
                              setZoom(1);
                              setPan({ x: 0, y: 0 });
                            }}
                            className={[
                              "relative h-[92px] w-[92px] overflow-hidden rounded-2xl border bg-gray-100",
                              "transition hover:shadow-md",
                              activeSide === "front" ? "border-sky-500 ring-2 ring-sky-200" : "border-gray-200",
                            ].join(" ")}
                            aria-label="View front"
                          >
                            <img
                              src={frontImg}
                              alt="Front thumbnail"
                              className="h-full w-full object-contain p-2"
                              draggable={false}
                            />
                            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                              Front
                            </span>
                          </button>
        
                          <button
                            type="button"
                            disabled={!backImg}
                            onClick={() => {
                              setActiveSide("back");
                              setZoom(1);
                              setPan({ x: 0, y: 0 });
                            }}
                            className={[
                              "relative h-[92px] w-[92px] overflow-hidden rounded-2xl border bg-gray-100",
                              "transition hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed",
                              activeSide === "back" ? "border-sky-500 ring-2 ring-sky-200" : "border-gray-200",
                            ].join(" ")}
                            aria-label="View back"
                          >
                            {backImg ? (
                              <img
                                src={backImg}
                                alt="Back thumbnail"
                                className="h-full w-full object-contain p-2"
                                draggable={false}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
                                No back
                              </div>
                            )}
                            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                              Back
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>,
        portalRoot
      )}
    </div>
  );
}

/* ---- El resto de tus componentes (SidebarCard, CardTile) quedan igual ---- */

function SidebarCard({
  title,
  card,
  onOpen,
}: {
  title: string;
  card: Card;
  onOpen: () => void;
}) {
  const baseCents = getBaseCents(card);
  const discountedCents = applySalePrice(baseCents, card.sport);
  const percent = getSalePercentForSport(card.sport);
  const onSale = SALE_ACTIVE && percent > 0;
  const badge = getInventoryBadge(card);

  return (
    <button type="button" onClick={onOpen} className="group relative w-full rounded-2xl p-[2px] text-left transition">
      <div className="pointer-events-none absolute -inset-0 rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 opacity-0 blur-lg transition duration-300 group-hover:opacity-80" />
      <div className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition group-hover:shadow-md">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>

        <div className="mt-3 relative h-28 overflow-hidden rounded-xl border border-gray-200 bg-[#f3f4f6]">
          <Image
            src={getCardThumb(card.image?.trim() ? card.image : getFallback(card.sport))}
            alt={card.title}
            fill
            sizes="120px"
            quality={70}
            className="object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
            draggable={false}
          />
        </div>

        <p className="mt-3 line-clamp-2 text-sm font-semibold text-gray-900">{card.title}</p>
        <p className="mt-1 text-xs text-gray-500">{card.player}</p>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              {onSale && (
                <span className="rounded-full bg-gray-200 text-gray-800 px-2 py-0.5 text-[10px] font-bold">
                  -{percent}%
                </span>
              )}

              {isGreatDeal(card) && (
                <span className="rounded-full bg-green-200 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                  Great Deal
                </span>
              )}

              {badge && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                  {badge.label}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-2">
              {onSale && (
                <span className="text-xs text-gray-400 line-through">
                  {formatUSD(baseCents / 100)}
                </span>
              )}

              <span className={`text-sm font-bold ${onSale ? "text-sky-600" : "text-gray-900"}`}>
                {formatUSD(discountedCents / 100)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function getCardThumb(src?: string) {
  if (!src) return "";
  const clean = src.trim();

  if (!clean.startsWith("/cards/")) return clean;

  return clean.replace(
    /^\/cards\/(.+)\.[a-zA-Z0-9]+$/,
    "/cards/thumbs/$1.webp"
  );
}

function CardTile({
  card,
  index,
  wished,
  added,
  maxStock,
  onToggleWish,
  onOpen,
  onAddToCart,
  t,
}: {
  card: Card;
  index: number;
  wished: boolean;
  added: boolean;
  maxStock: boolean;
  onToggleWish: () => void;
  onOpen: () => void;
  onAddToCart: () => void;
  t: (key: string) => string;
}) {
const img = card.image?.trim() ? card.image : getFallback(card.sport);
const gridImg = getCardThumb(img);

// ✅ STOCK
const outOfStock = (card.stock ?? 0) <= 0;

const baseCents = getBaseCents(card);
const discountedCents = applySalePrice(baseCents, card.sport);
const percent = getSalePercentForSport(card.sport);
const onSale = SALE_ACTIVE && percent > 0;
const inventoryBadge = getInventoryBadge(card);

  return (
    <div className="group relative rounded-[22px] p-[2px] transition">
      <div className="absolute inset-0 rounded-[22px] bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-400 opacity-0 blur-lg transition group-hover:opacity-100" />

      {/* ✅ STOCK: gris cuando no hay stock */}
      <div
        className={[
          "relative overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm transition group-hover:shadow-lg",
          outOfStock ? "opacity-60" : "",
        ].join(" ")}
      >
        {/* ✅ STOCK: badge */}
        {outOfStock && (
          <div className="absolute left-4 top-4 z-20 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
            Sin stock
          </div>
        )}

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
          <div className="relative h-[180px] sm:h-[280px] overflow-hidden border-b border-gray-200 bg-[#f3f4f6]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.95),rgba(255,255,255,0)_58%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(0,0,0,0.10),rgba(0,0,0,0)_65%)] opacity-40" />
            <div className="relative z-10 flex h-full items-center justify-center">
 		 <Image
  src={gridImg}
  alt={card.title}
  fill
  priority={index < 2}
  sizes="(max-width: 640px) 46vw, (max-width: 1024px) 46vw, 260px"
  quality={70}
  className="object-contain p-6 transition duration-300 group-hover:scale-[1.03]"
/>
		</div>
          </div>

<div className="flex flex-col justify-between h-[260px] p-3 sm:p-5">
  <h3 className="h-[40px] line-clamp-2 text-sm font-semibold leading-snug text-gray-900">{card.title}</h3>
  <p className="text-sm text-gray-500">{card.player}</p>

  <div className="flex items-center gap-2">
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2 min-h-[26px]">
        {onSale && (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-gray-200 text-gray-800 px-2 py-1 text-xs font-bold">
            -{percent}%
          </span>
        )}

        {isGreatDeal(card) && (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-green-200 px-2 py-1 text-xs font-semibold text-green-700">
            Great Deal
          </span>
        )}

        {inventoryBadge && (
          <span
            className={`shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${inventoryBadge.className}`}
          >
            {inventoryBadge.label}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        {onSale && (
          <span className="text-sm text-gray-400 line-through whitespace-nowrap">
            {formatUSD(baseCents / 100)}
          </span>
        )}

        <span className={`text-lg font-bold whitespace-nowrap ${onSale ? "text-sky-600" : "text-gray-900"}`}>
          {formatUSD(discountedCents / 100)}
        </span>
      </div>
    </div>
  </div>

  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      if (outOfStock) return;
      onAddToCart();
    }}
    disabled={outOfStock}
    className={[
      "w-full rounded-full py-3 text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2",
      outOfStock
        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
        : maxStock
        ? "bg-orange-500 text-white scale-[0.97] cursor-pointer"
        : added
        ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-[0.97] cursor-pointer"
        : "bg-gradient-to-r from-sky-400 to-sky-600 text-white hover:from-sky-600 hover:to-sky-800 shadow-md active:scale-[0.97] cursor-pointer",
    ].join(" ")}
  >
    {outOfStock ? (
      "Sin stock"
    ) : maxStock ? (
      "Máximo disponible"
    ) : added ? (
      <>
        <Check size={18} />
        Added!
      </>
    ) : (
      <>
        <ShoppingCart size={18} />
        {t("addToCart")}
      </>
    )}
  </button>
</div>       
      </div>
      </div>
    </div>
  );
}

function CardTileSkeleton() {
  return (
    <div className="relative h-[410px] overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm">
      <div className="h-[280px] border-b border-gray-200 bg-[#f3f4f6] animate-pulse" />
      <div className="flex h-[130px] flex-col justify-between p-5">
        <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
        <div className="h-6 w-24 rounded bg-gray-200 animate-pulse" />
        <div className="h-11 w-full rounded-full bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}