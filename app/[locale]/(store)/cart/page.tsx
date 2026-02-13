"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { usePathname } from "next/navigation";



type Sport = "basketball" | "soccer" | "nfl";

type Card = {
  id: string;
  sport: Sport;
  title: string;
  player: string;
  price: number;
  image?: string;
  stock?: number;
};

type Shipping = {
  fullName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
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

const ALLOWED_COUNTRIES = [
  { code: "AR", label: "Argentina" },
  { code: "US", label: "United States" },
  { code: "ES", label: "Spain" },
  { code: "IT", label: "Italy" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
] as const;

type AllowedCountry = (typeof ALLOWED_COUNTRIES)[number]["code"];

const SHIPPING_USD: Record<AllowedCountry, number> = {
  AR: 12,
  US: 30,
  ES: 50,
  IT: 50,
  DE: 50,
  FR: 50,
};

const normCountry = (v: any) => String(v ?? "").trim().toUpperCase();
const isAllowedCountry = (code: string): code is AllowedCountry =>
  (ALLOWED_COUNTRIES as readonly any[]).some((c) => c.code === code);



function handleUserNotFound(res: Response, data: any, router: any) {
  if (res.status === 401 && data?.error === "USER_NOT_FOUND") {
    try {
      localStorage.removeItem("user");
    } catch {}
    router.push("/login");
    return true;
  }
  return false;
}

export default function CartPage() {
  const router = useRouter();

  const [user, setUser] = React.useState<any>(null);
  const [cards, setCards] = React.useState<Card[]>([]);
  const [items, setItems] = React.useState<{ cardId: string; qty: number }[]>([]);
  const [msg, setMsg] = React.useState("");
const pathname = usePathname();
const locale = pathname.split("/")[1] || "en"; // toma "es" o "en" del URL
const ordersUrl = `/${locale}/orders`;


  const [shipping, setShipping] = React.useState<Shipping>({
    fullName: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "AR",
  });

  // user from localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  // ✅ carga cards desde Excel (API)
  async function loadCards() {
    try {
      const res = await fetch("/api/cards", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return;

      const list: Card[] = Array.isArray(data.cards) ? data.cards : [];

      setCards(
        list.map((c) => ({
          ...c,
          id: normId(c.id),
          stock: Math.max(0, Math.floor(Number(c.stock ?? 0))),
        }))
      );
    } catch {}
  }

  React.useEffect(() => {
    loadCards();
  }, []);

  async function loadCart(uid: string) {
  const res = await fetch(`/api/cart?userId=${encodeURIComponent(uid)}`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));

  // ✅ NUEVO: si user no existe, limpiar y login
  if (handleUserNotFound(res, data, router)) return;

  const list = Array.isArray(data.items) ? data.items : [];

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

  const subtotal = enriched.reduce((acc, it) => acc + Number(it.card.price) * it.qty, 0);

const countryCode = normCountry(shipping.country);
const shippingUsd = isAllowedCountry(countryCode) ? SHIPPING_USD[countryCode] : 0;

const total = subtotal + shippingUsd;


  async function setQty(cardId: string, qty: number) {
    if (!user?.id) return;
    const normalized = normId(cardId);

    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, cardId: normalized, qty }),
    });

    const data = await res.json().catch(() => ({}));
if (handleUserNotFound(res, data, router)) return;
    if (!res.ok) {
      if (data?.error) setMsg("❌ " + data.error);
      return;
    }

    await loadCart(user.id);
    window.dispatchEvent(new Event("cart:changed"));
  }

  async function removeItem(cardId: string) {
  if (!user?.id) return;
  const normalized = normId(cardId);

  const res = await fetch(
    `/api/cart?userId=${encodeURIComponent(user.id)}&cardId=${encodeURIComponent(normalized)}`,
    { method: "DELETE" }
  );

  const data = await res.json().catch(() => ({}));

  // ✅ NUEVO
  if (handleUserNotFound(res, data, router)) return;

  if (!res.ok) return;

  await loadCart(user.id);
  window.dispatchEvent(new Event("cart:changed"));
}


  function validateShipping(s: Shipping) {
    const fullName = s.fullName.trim();
    const phone = s.phone.trim();
    const address1 = s.address1.trim();
    const city = s.city.trim();
    const state = s.state.trim();
    const zip = s.zip.trim();

    if (!fullName || !phone || !address1 || !city || !state || !zip) {
      return "Completá nombre, teléfono, dirección, ciudad, provincia/estado y código postal.";
    }
    return "";
  }

async function checkout() {
  if (!user?.id) {
    router.push("/login");
    return;
  }

  if (enriched.length === 0) {
    setMsg("Tu carrito está vacío.");
    return;
  }

  const err = validateShipping(shipping);
  if (err) {
    setMsg("❌ " + err);
    return;
  }

  try {
    setMsg("Creando orden...");

    const resCreate = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, shipping }),
    });

    const rawCreate = await resCreate.text();
    let dataCreate: any = {};
    try { dataCreate = rawCreate ? JSON.parse(rawCreate) : {}; } catch { dataCreate = { raw: rawCreate }; }

    console.log("orders/create status:", resCreate.status, dataCreate);

    if (!resCreate.ok) {
      setMsg("❌ /api/orders/create: " + (dataCreate?.error ?? dataCreate?.raw ?? "Error"));
      return;
    }

    const orderId = String(dataCreate?.orderId ?? "");
    if (!orderId) {
      setMsg("❌ /api/orders/create: orderId vacío");
      return;
    }

    setMsg("Generando MercadoPago...");

    const resMp = await fetch("/api/checkout/mp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, locale }),
    });

    const rawMp = await resMp.text();
    let dataMp: any = {};
    try { dataMp = rawMp ? JSON.parse(rawMp) : {}; } catch { dataMp = { raw: rawMp }; }

    console.log("checkout/mp status:", resMp.status, dataMp);

    if (!resMp.ok) {
      setMsg("❌ /api/checkout/mp: " + (dataMp?.error ?? dataMp?.raw ?? "Error"));
      return;
    }

    const initPoint = dataMp?.initPoint;
    if (initPoint) {
      window.location.href = initPoint;
      return;
    }

    setMsg("❌ /api/checkout/mp: No initPoint");
  } catch (e: any) {
    console.error("CHECKOUT ERROR:", e);
    setMsg("❌ " + (e?.message ?? "Server error"));
  }
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
            <p className="text-sm text-gray-700">Your cart is empty.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* ✅ Shipping form */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-lg font-bold mb-4">Datos de envío</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="w-full border p-3 rounded"
                  placeholder="Nombre y apellido"
                  value={shipping.fullName}
                  onChange={(e) => setShipping((s) => ({ ...s, fullName: e.target.value }))}
                />
                <input
                  className="w-full border p-3 rounded"
                  placeholder="Teléfono"
                  value={shipping.phone}
                  onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))}
                />
                <input
                  className="w-full border p-3 rounded md:col-span-2"
                  placeholder="Dirección (calle y número)"
                  value={shipping.address1}
                  onChange={(e) => setShipping((s) => ({ ...s, address1: e.target.value }))}
                />
                <input
                  className="w-full border p-3 rounded md:col-span-2"
                  placeholder="Depto / Piso / Aclaración (opcional)"
                  value={shipping.address2}
                  onChange={(e) => setShipping((s) => ({ ...s, address2: e.target.value }))}
                />
                <input
                  className="w-full border p-3 rounded"
                  placeholder="Ciudad"
                  value={shipping.city}
                  onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                />
                <input
                  className="w-full border p-3 rounded"
                  placeholder="Provincia / Estado"
                  value={shipping.state}
                  onChange={(e) => setShipping((s) => ({ ...s, state: e.target.value }))}
                />
                <input
                  className="w-full border p-3 rounded"
                  placeholder="Código Postal"
                  value={shipping.zip}
                  onChange={(e) => setShipping((s) => ({ ...s, zip: e.target.value }))}
                />
                <select
  className="w-full border p-3 rounded"
  value={normCountry(shipping.country)}
  onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value }))}
>
  {ALLOWED_COUNTRIES.map((c) => (
    <option key={c.code} value={c.code}>
      {c.label}
    </option>
  ))}
</select>

              </div>

              <div className="mt-3 text-xs text-gray-500">
                Estos datos se guardan en la orden para que puedas hacer el envío.
              </div>
            </div>

            {/* items */}
            {enriched.map((it) => {
              const img = it.card.image?.trim()
                ? it.card.image
                : getFallback(it.card.sport ?? "basketball");

              const stock = Math.max(0, Math.floor(Number(it.card.stock ?? 0)));
              const canInc = stock > 0 && it.qty < stock;

              return (
                <div key={it.cardId} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
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

                        <div className="mt-1 text-xs text-gray-500">
                          Stock: <span className="font-semibold">{stock}</span>
                        </div>

                        {stock > 0 && it.qty >= stock && (
                          <div className="mt-1 text-xs font-semibold text-amber-600">Máximo disponible</div>
                        )}
                        {stock === 0 && (
                          <div className="mt-1 text-xs font-semibold text-red-600">Sin stock</div>
                        )}
                      </div>
                    </div>

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

            {/* total + checkout */}
<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
    {/* Totales */}
    <div className="text-sm text-gray-700 space-y-1">
      <div>
        Subtotal: <span className="font-semibold text-gray-900">{formatUSD(subtotal)}</span>
      </div>
      <div>
        Shipping (box): <span className="font-semibold text-gray-900">{formatUSD(shippingUsd)}</span>
      </div>
      <div>
        Total: <span className="text-lg font-bold text-gray-900">{formatUSD(total)}</span>
      </div>
    </div>

    {/* Pagos */}
    <div className="w-full md:w-[420px] grid grid-cols-1 gap-3">
      {/* MercadoPago */}
      <div className="rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-900">MercadoPago</div>
          <div className="text-xs text-gray-500">ARS</div>
        </div>

        <button
          className="w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-900"
          onClick={checkout}
          type="button"
        >
          Pagar con MercadoPago
        </button>

        <div className="mt-2 text-xs text-gray-500">
          Pago local (conversión fija en checkout)
        </div>
      </div>

      {/* PayPal */}
      <div className="rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-900">PayPal</div>
          <div className="text-xs text-gray-500">USD</div>
        </div>

        <PayPalScriptProvider
          options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID as string,
            currency: "USD",
            intent: "capture",
            components: "buttons",
          }}
        >
          <PayPalButtons
            style={{
              layout: "horizontal",
              height: 44,
              tagline: false,
            }}
            createOrder={async () => {
              try {
                if (!user?.id) {
                  router.push("/login");
                  throw new Error("Tenés que iniciar sesión.");
                }

                const resCreate = await fetch("/api/orders/create", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: user.id, shipping }),
                });

                const rawCreate = await resCreate.text();
                let dataCreate: any = {};
                try {
                  dataCreate = rawCreate ? JSON.parse(rawCreate) : {};
                } catch {
                  dataCreate = { raw: rawCreate };
                }

                if (!resCreate.ok) {
                  const m = String(
                    dataCreate?.error ?? dataCreate?.raw ?? "No se pudo crear la orden"
                  );
                  setMsg("❌ " + m);
                  throw new Error(m);
                }

                const orderId = String(dataCreate?.orderId ?? "");
                if (!orderId) {
                  const m = "No se generó orderId";
                  setMsg("❌ " + m);
                  throw new Error(m);
                }

                (window as any).__LAST_ORDER_ID__ = orderId;

                const resPP = await fetch("/api/paypal/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId }),
                });

                const rawPP = await resPP.text();
                let dataPP: any = {};
                try {
                  dataPP = rawPP ? JSON.parse(rawPP) : {};
                } catch {
                  dataPP = { raw: rawPP };
                }

                if (!resPP.ok) {
                  const m = String(
                    dataPP?.error ?? dataPP?.raw ?? "PayPal create-order falló"
                  );
                  setMsg("❌ " + m);
                  throw new Error(m);
                }

                return String(dataPP.paypalOrderId);
              } catch (e: any) {
                console.error("PAYPAL CREATE ERROR:", e);
                throw e;
              }
            }}
            onApprove={async (data) => {
              try {
                const orderId = (window as any).__LAST_ORDER_ID__;
                if (!orderId) throw new Error("Falta orderId local");

                const resCap = await fetch("/api/paypal/capture-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId, paypalOrderId: data.orderID }),
                });

                const out = await resCap.json().catch(() => ({}));
                if (!resCap.ok || !out.ok) throw new Error(out?.error ?? "PayPal capture falló");

                setMsg("✅ Pago PayPal aprobado!");
                router.push(ordersUrl);
              } catch (e: any) {
                setMsg("❌ " + (e?.message ?? "PayPal error"));
              }
            }}
            onError={(err) => {
              console.error("PAYPAL ERROR", err);
              setMsg("❌ Error PayPal");
            }}
          />
        </PayPalScriptProvider>

        <div className="mt-2 text-xs text-gray-500">
          Ideal para compras internacionales
        </div>
      </div>
    </div>
  </div>
</div>


            {msg && <div className="text-sm text-gray-700">{msg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}