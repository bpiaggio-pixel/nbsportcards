"use client";

import React from "react";

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function StatusBadge({ status }: { status: string }) {
  const s = String(status || "").toUpperCase();

  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border";

  if (s === "PAID")
    return <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}>PAID</span>;

  if (s === "SHIPPED")
    return <span className={`${base} border-sky-200 bg-sky-50 text-sky-700`}>SHIPPED</span>;

  if (s === "DELIVERED")
    return <span className={`${base} border-indigo-200 bg-indigo-50 text-indigo-700`}>DELIVERED</span>;

  if (s === "CANCELLED")
    return <span className={`${base} border-red-200 bg-red-50 text-red-700`}>CANCELLED</span>;

  return <span className={`${base} border-amber-200 bg-amber-50 text-amber-700`}>PENDING</span>;
}

export default function AdminOrdersPage() {
  const [secret, setSecret] = React.useState("");
  const [orders, setOrders] = React.useState<any[]>([]);
  const [msg, setMsg] = React.useState("");

  const [form, setForm] = React.useState<
    Record<string, { carrier: string; code: string; url: string }>
  >({});

  async function load() {
    setMsg("Cargando órdenes...");

    const res = await fetch("/api/admin/orders", {
      headers: { "x-admin-secret": secret },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg("❌ " + (data?.error ?? "Error"));
      return;
    }

    setOrders(Array.isArray(data.orders) ? data.orders : []);
    setMsg("");
  }

  async function ship(shipmentId: string) {
    const f = form[shipmentId] || { carrier: "", code: "", url: "" };

    if (!f.code.trim()) {
      setMsg("❌ Falta trackingCode");
      return;
    }

    setMsg("Guardando tracking...");

    const res = await fetch("/api/admin/orders/ship", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": secret,
      },
      body: JSON.stringify({
        shipmentId,
        trackingCarrier: f.carrier,
        trackingCode: f.code,
        trackingUrl: f.url,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg("❌ " + (data?.error ?? "Error"));
      return;
    }

    setMsg("✅ Tracking guardado!");
    await load();
    setTimeout(() => setMsg(""), 1500);
  }

  async function deliver(shipmentId: string) {
    setMsg("Marcando shipment como entregado...");

    const res = await fetch("/api/admin/orders/deliver", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": secret,
      },
      body: JSON.stringify({ shipmentId }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg("❌ " + (data?.error ?? "Error"));
      return;
    }

    setMsg("✅ Shipment marcado como entregado!");
    await load();
    setTimeout(() => setMsg(""), 1500);
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-gray-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">🔧 Admin Orders</h1>
          <a
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            href="/"
          >
            ← Volver
          </a>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-2 text-sm font-semibold">Clave admin</div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded border p-3"
              placeholder="ADMIN_SECRET"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              type="password"
            />
            <button
              className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-900"
              onClick={load}
              type="button"
            >
              Cargar
            </button>
          </div>

          {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
        </div>

        <div className="mt-6 space-y-3">
          {orders.map((o) => {
            const id = String(o.id);
            const status = String(o.status ?? "PENDING").toUpperCase();

            return (
              <div key={id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 font-semibold">
                      <span>Orden #{id}</span>
                      <StatusBadge status={status} />
                    </div>

                    <div className="mt-1 text-sm text-gray-600">
                      Cliente:{" "}
                      <span className="font-semibold text-gray-900">
                        {o.user?.email ?? "-"}
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-gray-600">
                      Total:{" "}
                      <span className="font-bold text-gray-900">
                        {formatUSD((o.totalCents ?? 0) / 100)}
                      </span>{" "}
                      {o.currency ? (
                        <span className="text-gray-500">({o.currency})</span>
                      ) : null}
                    </div>

                    {o.createdAt && (
                      <div className="mt-1 text-xs text-gray-500">
                        Creada: {new Date(o.createdAt).toLocaleString()}
                      </div>
                    )}

                    {o.shippedAt && (
                      <div className="mt-1 text-xs text-gray-500">
                        Enviada: {new Date(o.shippedAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {o.mpPreferenceId ? (
                    <div className="text-xs text-gray-500">
                      MP Pref: <span className="font-mono">{o.mpPreferenceId}</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="mb-3 text-sm font-semibold">Items de la orden</div>

                  <div className="space-y-2">
                    {o.items?.map((it: any) => (
                      <div key={it.id} className="flex items-center justify-between text-sm">
                        <div className="text-gray-800">
                          {it.title} <span className="text-gray-500">x{it.qty}</span>
                        </div>
                        <div className="font-semibold text-gray-900">
                          {formatUSD(((it.unitCents ?? 0) * (it.qty ?? 0)) / 100)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {(o.shipments ?? []).length > 0 ? (
                    o.shipments.map((shipment: any) => {
                      const shipmentId = String(shipment.id);
                      const shipmentStatus = String(shipment.status ?? "PENDING").toUpperCase();

                      const currentShipment = form[shipmentId] || {
                        carrier: shipment.trackingCarrier ?? "",
                        code: shipment.trackingCode ?? "",
                        url: shipment.trackingUrl ?? "",
                      };

                      const shipmentItems = (o.items ?? []).filter(
                        (it: any) => String(it.shipmentId ?? "") === shipmentId
                      );

                      return (
                        <div
                          key={shipmentId}
                          className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold">
                                🚚 Shipment · {String(shipment.inventoryLocation ?? "")}
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                ID: <span className="font-mono">{shipmentId}</span>
                              </div>
                            </div>

                            <StatusBadge status={shipmentStatus} />
                          </div>

                          {shipment.shippedAt && (
                            <div className="mb-2 text-xs text-gray-500">
                              Enviada: {new Date(shipment.shippedAt).toLocaleString()}
                            </div>
                          )}

                          {shipment.deliveredAt && (
                            <div className="mb-2 text-xs text-gray-500">
                              Entregada: {new Date(shipment.deliveredAt).toLocaleString()}
                            </div>
                          )}

                          <div className="mb-4 space-y-2">
                            {shipmentItems.map((it: any) => (
                              <div key={it.id} className="flex items-center justify-between text-sm">
                                <div className="text-gray-800">
                                  {it.title} <span className="text-gray-500">x{it.qty}</span>
                                </div>
                                <div className="font-semibold text-gray-900">
                                  {formatUSD(((it.unitCents ?? 0) * (it.qty ?? 0)) / 100)}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <input
                              className="rounded border p-3"
                              placeholder="Carrier (opcional)"
                              value={currentShipment.carrier}
                              onChange={(e) =>
                                setForm((m) => ({
                                  ...m,
                                  [shipmentId]: { ...currentShipment, carrier: e.target.value },
                                }))
                              }
                            />

                            <input
                              className="rounded border p-3"
                              placeholder="Tracking code (obligatorio)"
                              value={currentShipment.code}
                              onChange={(e) =>
                                setForm((m) => ({
                                  ...m,
                                  [shipmentId]: { ...currentShipment, code: e.target.value },
                                }))
                              }
                            />

                            <input
                              className="rounded border p-3"
                              placeholder="Tracking URL (opcional)"
                              value={currentShipment.url}
                              onChange={(e) =>
                                setForm((m) => ({
                                  ...m,
                                  [shipmentId]: { ...currentShipment, url: e.target.value },
                                }))
                              }
                            />
                          </div>

                          <div className="mt-3 flex items-center justify-end gap-2">
                            <button
                              className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-900"
                              onClick={() => ship(shipmentId)}
                              type="button"
                            >
                              Guardar tracking
                            </button>

                            <button
                              className="rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold hover:bg-gray-50"
                              onClick={() => deliver(shipmentId)}
                              type="button"
                            >
                              Marcar entregada
                            </button>
                          </div>

                          <div className="mt-2 text-xs text-gray-500">
                            Este tracking afecta solo este shipment.
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      Esta orden no tiene shipments nuevos. Puede ser una orden vieja del sistema anterior.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}