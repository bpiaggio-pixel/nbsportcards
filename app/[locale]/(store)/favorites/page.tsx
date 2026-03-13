"use client";

import React from "react";
import { X, Heart } from "lucide-react";

type Sport = "basketball" | "soccer";
type Card = {
  id: string;
  sport: Sport;
  title: string;
  player: string;
  price: number;
  image?: string;
};

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function getFallback(sport: Sport) {
  return sport === "basketball"
    ? "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80"
    : "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80";
}
// 🔥 Global Sale Config (client)
const SALE_ACTIVE = String(process.env.NEXT_PUBLIC_SALE_ACTIVE ?? "false") === "true";
const SALES_RULES: Record<string, number> = (() => {
  try {
    const raw = process.env.NEXT_PUBLIC_SALES_RULES ?? "{}";

    // raw debería ser algo como:
    // {"soccer":10,"basketball":5}

    const parsed = JSON.parse(raw);

    // Validación básica para evitar errores
    if (!parsed || typeof parsed !== "object") return {};

    return parsed;
  } catch (err) {
    console.error("Invalid NEXT_PUBLIC_SALES_RULES JSON");
    return {};
  }
})();

function getSalePercentForSport(sport?: string) {
  const s = String(sport ?? "").trim().toLowerCase();

  const percent = SALES_RULES[s];

  if (typeof percent !== "number") return 0;

  return percent;
}


// Siempre trabajar en CENTAVOS (enteros) para descuentos
function getBaseCentsFromPrice(price: number) {
  return Math.round(Number(price) * 100);
}

// Devuelve CENTAVOS (enteros)
function applySalePrice(cents: number, sport?: string) {
  if (!SALE_ACTIVE) return cents;

  const percent = getSalePercentForSport(sport);

  if (percent <= 0) return cents;

  return Math.round(cents * (1 - percent / 100));
}


function handleUserNotFound(res: Response, data: any) {
  if (res.status === 401 && data?.error === "USER_NOT_FOUND") {
    try {
      localStorage.removeItem("user");
    } catch {}
    window.location.href = "/login";
    return true;
  }
  return false;
}


export default function FavoritesPage() {
  const [user, setUser] = React.useState<any>(null);
  const [cards, setCards] = React.useState<Card[]>([]);
  const [favIds, setFavIds] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
const [addedToCartId, setAddedToCartId] = React.useState<string | null>(null);
const [maxStockId, setMaxStockId] = React.useState<string | null>(null);

  // modal
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

// ✅ ZOOM + PAN (modal) igual al Home
const [zoom, setZoom] = React.useState(1);
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 4;
const clampZoom = (v: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v));

const [pan, setPan] = React.useState({ x: 0, y: 0 });

const containerRef = React.useRef<HTMLDivElement | null>(null);
const mediaRef = React.useRef<HTMLImageElement | null>(null);

const dragRef = React.useRef<{
  dragging: boolean;
  sx: number;
  sy: number;
  ox: number;
  oy: number;
} | null>(null);

// ✅ Pinch-to-zoom (2 dedos)
const pointersRef = React.useRef(new Map<number, { x: number; y: number }>());
const pinchRef = React.useRef<{
  pinching: boolean;
  startDist: number;
  startZoom: number;
  startPan: { x: number; y: number };
  containerRect: { left: number; top: number; width: number; height: number };
} | null>(null);

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const clampPan = (nextPan: { x: number; y: number }, nextZoom: number) => {
  const c = containerRef.current;
  const m = mediaRef.current;
  if (!c || !m) return nextPan;

  const cw = c.clientWidth;
  const ch = c.clientHeight;

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

// Ajusta pan cuando cambia zoom
React.useEffect(() => {
  setPan((p) => clampPan(p, zoom));
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [zoom]);

// ✅ Reset cuando cambia de card / abre modal
React.useEffect(() => {
  if (!selectedId) return;
  setZoom(1);
  setPan({ x: 0, y: 0 });
}, [selectedId]);

  // Normaliza IDs: "Card-011" => "11", " 11 " => "11"
  const normId = (v: any) => {
    const s = String(v ?? "").trim();
    const m = s.match(/\d+/);
    return m ? String(parseInt(m[0], 10)) : s;
  };

  const selectedCard = React.useMemo(() => {
    if (!selectedId) return null;
    return cards.find((c: any) => normId(c.id) === normId(selectedId)) ?? null;
  }, [cards, selectedId]);

  // Set de favoritos (para pintar)
  const favSet = React.useMemo(() => new Set(favIds.map(normId)), [favIds]);

  // Cards favoritas (las que están en Excel + matchean con DB)
  const favCards = React.useMemo(() => {
    const set = new Set(favIds.map(normId));
    return cards.filter((c: any) => set.has(normId(c.id)));
  }, [cards, favIds]);

  // Cargar user del localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  async function loadCards() {
    try {
      const res = await fetch("/api/cards", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return;
      setCards(Array.isArray(data.cards) ? data.cards : []);
    } catch {
      // no rompas UI
    }
  }

  async function loadFavs(uId: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/favorites?userId=${encodeURIComponent(uId)}`, {
        cache: "no-store",
      });
      const data = await res.json();
if (handleUserNotFound(res, data)) return;
      if (!res.ok) {
        setError(data?.error ?? "Error cargando favoritas");
        setFavIds([]);
        setLoading(false);
        return;
      }
      setFavIds(Array.isArray(data.cardIds) ? data.cardIds : []);
      setLoading(false);
    } catch {
      setError("Error conectando con la API");
      setLoading(false);
    }
  }

  // Cargar cards (Excel) al montar
  React.useEffect(() => {
    loadCards();
  }, []);

  // Cargar favs cuando hay user
  React.useEffect(() => {
    if (!user?.id) return;
    loadFavs(user.id);
  }, [user?.id]);

  async function removeFavorite(cardId: string) {
    if (!user?.id) return;

    const res = await fetch("/api/favorites/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        cardId: normId(cardId),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.log("remove favorite error:", data);
      return;
    }

    // cerrar modal si justo removiste la misma
    if (normId(selectedId) === normId(cardId)) setSelectedId(null);

    // siempre recargar desde DB (fuente de verdad)
    await loadFavs(user.id);
  }

async function addToCart(cardId: string) {
  if (!user?.id) {
    window.location.href = "/login";
    return { ok: false };
  }

  try {
    const safeId = normId(cardId);

    const cartRes = await fetch(`/api/cart?userId=${encodeURIComponent(user.id)}`, {
      cache: "no-store",
    });

    const cartData = await cartRes.json();

    const existing = Array.isArray(cartData.items)
      ? cartData.items.find((x: any) => normId(x.cardId) === safeId)
      : null;

    const nextQty = (existing?.qty ?? 0) + 1;

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

      setTimeout(() => {
        setMaxStockId((id) => (id === safeId ? null : id));
      }, 1500);
    }
    return;
  }

  setAddedToCartId(safeId);

  setTimeout(() => {
    setAddedToCartId((id) => (id === safeId ? null : id));
  }, 900);
}

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] p-10 text-gray-900">
        <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold">❤️ Mis favoritas</h1>
          <p className="mt-2 text-sm text-gray-600">Tenés que iniciar sesión para ver tus favoritas.</p>

          <div className="mt-4 flex gap-2">
            <a
              href="/login"
              className="inline-block rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-gray-900"
            >
              Ir a Login
            </a>

            <a
              href="/"
              className="inline-block rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Volver
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] p-10 text-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold">❤️ Mis favoritas</h1>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-xs text-gray-500">Total: {favIds.length}</p>
          </div>

          <a
            href="/"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            ← Volver
          </a>
        </div>

        {loading ? (
          <div className="text-sm text-gray-600">Cargando...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        ) : favCards.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            No tenés favoritas todavía. Volvé al inicio y marcá con ❤️.
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {favCards.map((card) => {
              const img = card.image?.trim() ? card.image : getFallback(card.sport);
              const isFav = favSet.has(normId(card.id));

              return (
                <div
                  key={card.id}
                  className="relative overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
                >
                  {/* remove button */}
                  <button
                    type="button"
                    onClick={() => removeFavorite(normId(card.id))}
                    className="absolute right-4 top-4 z-20 rounded-full border border-gray-200 bg-white/90 p-2 shadow-sm backdrop-blur hover:bg-gray-50"
                    aria-label="Quitar de favoritas"
                  >
                    <Heart
                      size={18}
                      className={isFav ? "text-pink-600" : "text-gray-400"}
                      fill={isFav ? "currentColor" : "none"}
                    />
                  </button>

                  {/* click to open modal */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(String(card.id))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedId(String(card.id));
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
                          className="h-full object-contain p-6 transition duration-300 hover:scale-[1.03]"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 p-5">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
                        {card.title}
                      </h3>
                      <p className="text-sm text-gray-500">{card.player}</p>
                      {(() => {
                        const baseCents = getBaseCentsFromPrice(card.price);
                        const discountedCents = applySalePrice(baseCents, card.sport);
                        const percent = getSalePercentForSport(card.sport);
const onSale =
  SALE_ACTIVE &&
  percent > 0 &&
  discountedCents !== baseCents;

                        return (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {onSale && (
                              <>
                                <span className="rounded-full bg-gray-200 text-gray-800 px-2 py-0.5 text-[10px] font-bold">
                                  -{percent}%
                                </span>
                                <span className="text-sm text-gray-400 line-through">
                                  {formatUSD(baseCents / 100)}
                                </span>
                              </>
                            )}
                            <span className="text-lg font-bold text-gray-900">
                              {formatUSD(discountedCents / 100)}
                            </span>
                          </div>
                        );
                      })()}
<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    handleAddToCart(String(card.id));
  }}
  className={[
    "w-full rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer",
    maxStockId === normId(card.id)
      ? "bg-orange-500 text-white scale-[0.97]"
      : addedToCartId === normId(card.id)
      ? "bg-emerald-500 text-white scale-[0.97]"
      : "bg-sky-500 text-white hover:bg-sky-600",
  ].join(" ")}
>
  {maxStockId === normId(card.id) ? (
    "Máximo disponible"
  ) : addedToCartId === normId(card.id) ? (
    "Added!"
  ) : (
    "Agregar al carrito"
  )}
</button>                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL (simple y estable) */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={() => setSelectedId(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl"
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

            <div className="p-6">
       <div
  className="relative h-[260px] sm:h-[340px] md:h-[420px] border border-gray-200 bg-[#f3f4f6] rounded-2xl overflow-hidden"
  onWheelCapture={(e) => {
    e.preventDefault();
    e.stopPropagation();
    const factor = (e as any).deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => clampZoom(z * factor));
  }}
  style={{ overscrollBehavior: "contain" }}
>
  {/* controles zoom */}
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
    ref={containerRef}
    className="relative z-10 flex h-full items-center justify-center p-6 overflow-hidden"
    style={{
      cursor: zoom > 1 ? "grab" : "default",
      touchAction: "none",
    }}
    onPointerDown={(e) => {
      const el = e.currentTarget as HTMLDivElement;
      el.setPointerCapture(e.pointerId);

      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // pinch
      if (pointersRef.current.size === 2) {
        const pts = Array.from(pointersRef.current.values());
        const rect = el.getBoundingClientRect();

        pinchRef.current = {
          pinching: true,
          startDist: dist(pts[0], pts[1]),
          startZoom: zoom,
          startPan: { ...pan },
          containerRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        };

        if (dragRef.current) dragRef.current.dragging = false;
        return;
      }

      // pan
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
      if (pointersRef.current.has(e.pointerId)) {
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // pinch move
      if (pinchRef.current?.pinching && pointersRef.current.size === 2) {
        const pts = Array.from(pointersRef.current.values());
        const info = pinchRef.current;

        const newDist = dist(pts[0], pts[1]);
        const ratio = newDist / Math.max(1, info.startDist);
        const newZoom = clampZoom(info.startZoom * ratio);

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

      // pan move
      const st = dragRef.current;
      if (!st?.dragging) return;

      const dx = e.clientX - st.sx;
      const dy = e.clientY - st.sy;
      setPan(clampPan({ x: st.ox + dx, y: st.oy + dy }, zoom));
    }}
    onPointerUp={(e) => {
      pointersRef.current.delete(e.pointerId);

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
      src={selectedCard.image?.trim() ? selectedCard.image : getFallback(selectedCard.sport)}
      alt={selectedCard.title}
      draggable={false}
      style={{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: "center",
      }}
      className="h-full w-full select-none object-contain transition-transform"
    />
  </div>
</div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900">{selectedCard.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{selectedCard.player}</p>
                {(() => {
                  const baseCents = getBaseCentsFromPrice(selectedCard.price);
                  const discountedCents = applySalePrice(baseCents, selectedCard.sport);
                  const percent = getSalePercentForSport(selectedCard.sport);
                  const onSale = SALE_ACTIVE && percent > 0 && discountedCents !== baseCents;
                  return (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {onSale && (
                        <>
                          <span className="text-base text-gray-400 line-through">
                            {formatUSD(baseCents / 100)}
                          </span>
                          <span className="rounded-full bg-gray-200 text-gray-800 px-2 py-1 text-xs font-bold">
                            -{percent}%
                          </span>
                        </>
                      )}
                      <span className={`text-2xl font-bold ${onSale ? "text-sky-600" : "text-gray-900"}`}>
                        {formatUSD(discountedCents / 100)}
                      </span>
                    </div>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => handleAddToCart(String(selectedCard.id))}
                  className="mt-6 w-full rounded-full bg-sky-500 py-3 text-sm font-semibold text-white hover:bg-sky-600"
                >
                  Agregar al carrito
                </button>


                <button
                  type="button"
                  onClick={() => removeFavorite(normId(selectedCard.id))}
                  className="mt-6 w-full rounded-full border border-gray-200 py-3 text-sm font-semibold hover:bg-gray-50"
                >
                  Quitar de favoritas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
