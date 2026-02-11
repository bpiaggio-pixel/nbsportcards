"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

type Sport = "basketball" | "soccer" | "nfl";

type Card = {
  id: string;
  sport: Sport;
  title: string;
  player: string;
  price: number;
  image?: string;

  // ✅ NUEVO (viene del Excel vía /api/cards)
  stock?: number;
};

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

// ✅ normaliza IDs: "Card-011" -> "11"
const normId = (v: any) => {
  const s = String(v ?? "").trim();
  const m = s.match(/\d+/);
  return m ? String(parseInt(m[0], 10)) : s;
};

export default function CartPage() {
  const router = useRouter();

  const [user, setUser] = React.useState<any>(null);
  const [cards, setCards] = React.useState<Card[]>([]);
  const [items, setItems] = React.useState<{ cardId: string; qty: number }[]>([]);
  const [msg, setMsg] = React.useState("");

  // user from localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  // ✅ carga cards desde Excel (API), no desde cards.json
  async function loadCards() {
    try {
      const res = await fetch("/api/cards", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return;

      const list: Card[] = Array.isArray(data.cards) ? data.cards : [];

      // normaliza ids
      setCards(
        list.map((c) => ({
          ...c,
          id: normId(c.id),
          stock: Math.max(0, Math.floor(Number(c.stock ?? 0))), // ✅ asegura número
        }))
      );
    } catch {}
  }

  React.useEffect(() => {
    loadCards();
  }, []);

  async function loadCart(uid: string) {
    const res = await fetch(`/api/cart?userId=${encodeURIComponent(uid)}`, { cache: "no-store" });
    const data = await res.json();
    const list = Array.isArray(data.items) ? data.items : [];

    // ✅ normaliza + unifica duplicados por cardId
    const map = new Map<string, number>();
    for (const x of list) {
      const id = normId(x.cardId);
      const qty = Number(x.qty ?? 0);
      map.set(id, (map.get(id) ?? 0) + qty);
    }

    setItems(Array.from(map.entries()).map(([cardId, qty]) => ({ cardId, qty })));
  }

  React.useEffect(() => {
    if (!user?.id) return;
    loadCart(user.id);
  }, [user?.id]);

  const cardsById = React.useMemo(() => {
    const m = new Map<string, Card>();
    for (const c of cards) m.set(normId(c.id), c);
    return m;
  }, [cards]);

  const enriched = React.useMemo(() => {
    return items.map((it) => {
      const c = cardsById.get(normId(it.cardId));
      return {
        ...it,
        card:
          c ??
          ({
            id: it.cardId,
            sport: "basketball",
            title: `Card ${it.cardId}`,
            player: "-",
            price: 0,
            image: undefined,
            stock: 0,
          } as Card),
      };
    });
  }, [items, cardsById]);

  const total = enriched.reduce((acc, it) => acc + Number(it.card.price) * it.qty, 0);

  async function setQty(cardId: string, qty: number) {
    if (!user?.id) return;
    const normalized = normId(cardId);

    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, cardId: normalized, qty }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // si el server responde sin stock
      if (data?.error) setMsg("❌ " + data.error);
      return;
    }

    await loadCart(user.id);
    window.dispatchEvent(new Event("cart:changed")); // ✅ header count
  }

  async function removeItem(cardId: string) {
    if (!user?.id) return;
    const normalized = normId(cardId);

    const res = await fetch(
      `/api/cart?userId=${encodeURIComponent(user.id)}&cardId=${encodeURIComponent(normalized)}`,
      { method: "DELETE" }
    );

    if (!res.ok) return;

    await loadCart(user.id);
    window.dispatchEvent(new Event("cart:changed"));
  }

  async function checkout() {
    if (!user?.id) {
      router.push("/login");
      return;
    }

    setMsg("Procesando checkout...");
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMsg("❌ " + (data?.error ?? "Server error"));
      return;
    }

 const initPoint = data?.mp?.initPoint ?? data?.initPoint;

if (initPoint) {
  setMsg("Redirigiendo a Mercado Pago...");
  window.location.href = initPoint;
  return;
}


    setMsg("✅ Orden creada!");
    router.push("/orders");
  }

  if (!user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold mb-3">Carrito</h1>
          <p className="text-sm text-gray-700 mb-6">Tenés que iniciar sesión para ver el carrito.</p>
          <a
            className="w-full block text-center rounded-full bg-black py-3 text-white font-semibold hover:bg-gray-900"
            href="/login"
          >
            Ir a Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-gray-200 bg-white p-2">
              <ShoppingCart size={18} />
            </div>
            <h1 className="text-2xl font-bold">Cart</h1>
          </div>

          <a
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            href="/"
          >
            ← Volver
          </a>
        </div>

        {enriched.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-700">Tu carrito está vacío.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {enriched.map((it) => {
              const img = it.card.image?.trim()
                ? it.card.image
                : getFallback(it.card.sport ?? "basketball");

              const stock = Math.max(0, Math.floor(Number(it.card.stock ?? 0)));
              const canInc = stock > 0 && it.qty < stock;

              return (
                <div
                  key={it.cardId}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* thumbnail + info */}
                    <div className="flex gap-4">
                      <div className="h-20 w-20 overflow-hidden rounded-xl border border-gray-200 bg-[#f3f4f6]">
                        <img
                          src={img}
                          alt={it.card.title}
                          className="h-full w-full object-contain p-2"
                          draggable={false}
                        />
                      </div>

                      <div>
                        <div className="font-semibold">{it.card.title}</div>
                        <div className="text-sm text-gray-600">{it.card.player}</div>

                        <div className="mt-2 font-bold">{formatUSD(Number(it.card.price))}</div>

                        {/* ✅ stock visible */}
                        <div className="mt-1 text-xs text-gray-500">
                          Stock: <span className="font-semibold">{stock}</span>
                        </div>

                        {/* ✅ aviso cuando llega al máximo */}
                        {stock > 0 && it.qty >= stock && (
                          <div className="mt-1 text-xs font-semibold text-amber-600">
                            Máximo disponible
                          </div>
                        )}
                        {stock === 0 && (
                          <div className="mt-1 text-xs font-semibold text-red-600">
                            Sin stock
                          </div>
                        )}
                      </div>
                    </div>

                    {/* qty controls */}
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                        onClick={() => setQty(it.cardId, Math.max(1, it.qty - 1))}
                        type="button"
                      >
                        −
                      </button>

                      <div className="w-10 text-center text-sm font-semibold">{it.qty}</div>

                      <button
                        className="rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => {
                          if (!canInc) return;
                          setQty(it.cardId, it.qty + 1);
                        }}
                        disabled={!canInc}
                        type="button"
                        title={!canInc ? "No hay más stock" : "Agregar 1"}
                      >
                        +
                      </button>

                      <button
                        className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                        onClick={() => removeItem(it.cardId)}
                        type="button"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Total: <span className="text-lg font-bold text-gray-900">{formatUSD(total)}</span>
              </div>

              <button
                className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-900"
                onClick={checkout}
                type="button"
              >
                Checkout
              </button>
            </div>

            {msg && <div className="text-sm text-gray-700">{msg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
