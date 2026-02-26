"use client";

import React from "react";
import { Heart, X } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

type Sport = "basketball" | "soccer" | "nfl";

type Card = {
  id: string;
  sport: Sport;
  title: string;
  player: string;
  price?: number;
  priceCents?: number;
  image?: string;
  image2?: string;
  stock?: number;
  auto?: boolean;
  great_deal?: string;
  greatDeal?: string;
};

type SessionUser = { id: string; email: string } | null;

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function getFallback(sport: Sport) {
  if (sport === "basketball")
    return "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=60";
  if (sport === "soccer")
    return "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=60";
  return "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=60";
}

function priceFromCard(card: Card) {
  if (typeof card.priceCents === "number") return card.priceCents / 100;
  if (typeof card.price === "number") return card.price;
  return 0;
}

export default function CardModal({
  cardId,
  onClose,
}: {
  cardId: string;
  onClose: () => void;
}) {
  const t = useTranslations("Store");

  const [card, setCard] = React.useState<Card | null>(null);

  // USER SESSION (mismo criterio que StorePageClient: localStorage "user")
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

  // Fetch card
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/cards/${encodeURIComponent(cardId)}`, { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        setCard((data?.card ?? null) as Card | null);
      } catch {
        if (!alive) return;
        setCard(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [cardId]);

  // Escape closes
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // wishlist (favoritos) — versión mínima, compatible con tu API
  const [wishlist, setWishlist] = React.useState<Record<string, boolean>>({});

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

  React.useEffect(() => {
    async function loadFavs() {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/favorites?userId=${encodeURIComponent(user.id)}`, { cache: "no-store" });
        const data = await res.json();
        const ids: string[] = Array.isArray(data.cardIds) ? data.cardIds : [];
        setWishlist(Object.fromEntries(ids.map((id) => [String(id), true])));
      } catch {
        setWishlist({});
      }
    }
    loadFavs();
  }, [user?.id]);

  async function toggleWish(id: string) {
    if (!user?.id) {
      setWishlist((prev) => {
        const next = { ...prev };
        if (next[id]) delete next[id];
        else next[id] = true;
        return next;
      });
      window.dispatchEvent(new Event("wishlist:changed"));
      return;
    }

    const res = await fetch("/api/favorites/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, cardId: id }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.log("toggle favorite error:", data);
      return;
    }

    const favorited = !!data.favorited;
    const returnedId = String(data.cardId ?? id);

    setWishlist((prev) => {
      const next = { ...prev };
      if (favorited) next[returnedId] = true;
      else delete next[returnedId];
      return next;
    });

    window.dispatchEvent(new Event("wishlist:changed"));
  }

  async function addToCart(id: string) {
    if (!user?.id) {
      window.location.href = "/login";
      return;
    }

    try {
      const cartRes = await fetch(`/api/cart?userId=${encodeURIComponent(user.id)}`, { cache: "no-store" });
      const cartData = await cartRes.json();

      const existing = Array.isArray(cartData.items)
        ? cartData.items.find((x: any) => x.cardId === id)
        : null;

      const nextQty = (existing?.qty ?? 0) + 1;

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, cardId: id, qty: nextQty }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.log("addToCart error:", data);
        return;
      }

      window.dispatchEvent(new Event("cart:changed"));
    } catch (e) {
      console.log("addToCart error:", e);
    }
  }

  // zoom/pan/side (copiado del StorePageClient, pero local al modal)
  const [activeSide, setActiveSide] = React.useState<"front" | "back">("front");
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const ZOOM_MIN = 0.6;
  const ZOOM_MAX = 4;
  const clampZoom = (v: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v));

  const frontImg = card?.image?.trim() ? card.image : card ? getFallback(card.sport) : "";
  const backImg = card?.image2?.trim() ? card.image2 : "";
  const activeImg = activeSide === "back" && backImg ? backImg : frontImg;

  const isFav = card ? !!wishlist[String(card.id)] : false;

  // UI
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 md:p-10" onPointerDown={onClose}>
      <div
        className="w-full max-w-4xl max-h-[78vh] md:max-h-[82vh] overflow-hidden rounded-3xl bg-white shadow-xl flex flex-col"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 relative pr-16">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{card?.player ?? ""}</span> ·{" "}
            <span className="uppercase">{card?.sport ?? ""}</span> ·{" "}
            <span className="font-mono">{card?.id ?? cardId}</span>
          </div>

          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full border border-gray-200 bg-white/90 backdrop-blur p-2 hover:bg-gray-50"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {!card ? (
          <div className="p-6 text-sm text-gray-600">{t("loading") ?? "Cargando..."}</div>
        ) : (
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

              <div className="absolute inset-0 flex items-center justify-center">
                <motion.img
                  key={activeImg}
                  src={activeImg}
                  alt={card.title}
                  className="max-h-full max-w-full select-none"
                  draggable={false}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    cursor: zoom > 1 ? "grab" : "default",
                  }}
                />
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-extrabold text-gray-900">{card.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{card.player}</p>

              <div className="mt-4 text-2xl font-extrabold text-gray-900">{formatUSD(priceFromCard(card))}</div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => addToCart(card.id)}
                  className="flex-1 rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition"
                >
                  {t("add_to_cart") ?? "Add to cart"}
                </button>

                <button
                  type="button"
                  onClick={() => toggleWish(card.id)}
                  className="rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <Heart size={18} className={isFav ? "fill-pink-500 text-pink-500" : "text-gray-700"} />
                  {t("save") ?? "Guardar"}
                </button>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSide("front")}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    activeSide === "front" ? "border-sky-300 bg-sky-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Front
                </button>

                <button
                  type="button"
                  disabled={!backImg}
                  onClick={() => setActiveSide("back")}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    activeSide === "back" ? "border-sky-300 bg-sky-50" : "border-gray-200 hover:bg-gray-50"
                  } ${!backImg ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
