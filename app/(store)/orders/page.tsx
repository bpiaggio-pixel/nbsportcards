"use client";

import React from "react";

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function OrdersPage() {
  const [user, setUser] = React.useState<any>(null);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  React.useEffect(() => {
    async function load() {
      if (!user?.id) return;
      const res = await fetch(`/api/orders?userId=${encodeURIComponent(user.id)}`);
      const data = await res.json();
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    }
    load();
  }, [user?.id]);

  if (!user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold mb-3">Compras</h1>
          <p className="text-sm text-gray-700 mb-6">Tenés que iniciar sesión para ver tus compras.</p>
          <a className="w-full block text-center rounded-full bg-black py-3 text-white font-semibold hover:bg-gray-900" href="/login">
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
          <h1 className="text-2xl font-bold">🧾 Mis compras</h1>
          <a className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50" href="/">
            ← Volver
          </a>
        </div>

        {msg && <div className="mb-4 text-sm text-gray-700">{msg}</div>}

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-700">Todavía no tenés compras.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">Orden #{o.id}</div>
                    <div className="text-sm text-gray-600">Estado: {o.status}</div>
                    <div className="text-sm text-gray-600">
                      Total: <span className="font-bold text-gray-900">{formatUSD(o.totalCents / 100)}</span>
                    </div>
                  </div>
                  {o.mpPreferenceId && (
                    <div className="text-xs text-gray-500">
                      MP Pref: <span className="font-mono">{o.mpPreferenceId}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4 space-y-2">
                  {o.items?.map((it: any) => (
                    <div key={it.id} className="flex items-center justify-between text-sm">
                      <div className="text-gray-800">
                        {it.title} <span className="text-gray-500">x{it.qty}</span>
                      </div>
                      <div className="font-semibold text-gray-900">{formatUSD((it.unitCents * it.qty) / 100)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
