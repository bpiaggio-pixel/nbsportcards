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

  // modal
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

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
    return;
  }

  try {
    const cartRes = await fetch(`/api/cart?userId=${encodeURIComponent(user.id)}`, { cache: "no-store" });
    const cartData = await cartRes.json();

    const existing = Array.isArray(cartData.items)
      ? cartData.items.find((x: any) => String(x.cardId) === String(cardId))
      : null;

    const nextQty = (existing?.qty ?? 0) + 1;

    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, cardId, qty: nextQty }),
    });

    if (!res.ok) return;

    window.dispatchEvent(new Event("cart:changed"));
  } catch (e) {
    console.log("addToCart error:", e);
  }
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
                      <p className="text-lg font-bold text-gray-900">{formatUSD(card.price)}</p>
                    </div>
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
              <img
                src={selectedCard.image?.trim() ? selectedCard.image : getFallback(selectedCard.sport)}
                alt={selectedCard.title}
                className="w-full max-h-[420px] object-contain rounded-2xl bg-[#f3f4f6] p-6"
                draggable={false}
              />

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900">{selectedCard.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{selectedCard.player}</p>
                <div className="mt-4 text-2xl font-bold text-gray-900">{formatUSD(selectedCard.price)}</div>
                <button
                  type="button"
                  onClick={() => addToCart(String(selectedCard.id))}
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
