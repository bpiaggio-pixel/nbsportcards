"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatInventoryLocation(value: string) {
  const v = String(value ?? "").toUpperCase();

  if (v === "COMC") return "Stored at COMC";
  if (v === "FANATICS") return "Stored at Fanatics";
  if (v === "ARGENTINA") return "Stored in Argentina";

  return v || "Shipment";
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

function OrderTimeline({ status }: { status: string }) {
  const s = String(status || "").toUpperCase();

  const steps = [
    { key: "PENDING", label: "Creada" },
    { key: "PAID", label: "Pagada" },
    { key: "SHIPPED", label: "Enviada" },
    { key: "DELIVERED", label: "Entregada" },
  ] as const;

  const idx =
    s === "PAID" ? 1 :
    s === "SHIPPED" ? 2 :
    s === "DELIVERED" ? 3 :
    0;

  const cancelled = s === "CANCELLED";

  return (
    <div className="mt-3">
      <div className="flex items-center">
        {steps.map((st, i) => {
          const done = i <= idx && !cancelled;

          return (
            <React.Fragment key={st.key}>
              <div
                className={[
                  "h-3 w-3 rounded-full border",
                  done ? "border-sky-500 bg-sky-500" : "border-gray-300 bg-gray-200",
                ].join(" ")}
                title={st.label}
              />
              {i < steps.length - 1 && (
                <div
                  className={[
                    "mx-2 h-1 flex-1 rounded-full",
                    done ? "bg-sky-500" : "bg-gray-200",
                  ].join(" ")}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-gray-500">
        {steps.map((st) => (
          <span key={st.key}>{st.label}</span>
        ))}
      </div>

      {cancelled && (
        <div className="mt-2 text-xs font-semibold text-red-600">
          Cancelada
        </div>
      )}
    </div>
  );
}

function ShipmentTimeline({ status }: { status: string }) {
  const s = String(status || "").toUpperCase();

  const steps = [
    { key: "PENDING", label: "Preparando" },
    { key: "SHIPPED", label: "Enviado" },
    { key: "DELIVERED", label: "Entregado" },
  ] as const;

  const idx =
    s === "SHIPPED" ? 1 :
    s === "DELIVERED" ? 2 :
    0;

  return (
    <div className="mt-3">
      <div className="flex items-center">
        {steps.map((st, i) => {
          const done = i <= idx;

          return (
            <React.Fragment key={st.key}>
              <div
                className={[
                  "h-2.5 w-2.5 rounded-full border",
                  done ? "border-sky-500 bg-sky-500" : "border-gray-300 bg-gray-200",
                ].join(" ")}
                title={st.label}
              />
              {i < steps.length - 1 && (
                <div
                  className={[
                    "mx-2 h-1 flex-1 rounded-full",
                    done ? "bg-sky-500" : "bg-gray-200",
                  ].join(" ")}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-gray-500">
        {steps.map((st) => (
          <span key={st.key}>{st.label}</span>
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const searchParams = useSearchParams();

  const [user, setUser] = React.useState<any>(null);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    const status = searchParams?.get("status") ?? null;
    const orderId = searchParams?.get("orderId") ?? null;

    if (status) {
      if (status === "success") {
        setMsg(`✅ Pago aprobado${orderId ? ` (orden ${orderId})` : ""}.`);
      } else if (status === "pending") {
        setMsg(`⏳ Pago pendiente${orderId ? ` (orden ${orderId})` : ""}.`);
      } else if (status === "failure") {
        setMsg(`❌ Pago rechazado/cancelado${orderId ? ` (orden ${orderId})` : ""}.`);
      }
    }
  }, [searchParams]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  async function loadOrders(uid: string) {
    const res = await fetch(`/api/orders?userId=${encodeURIComponent(uid)}`, {
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg("❌ " + (data?.error ?? "Error cargando órdenes"));
      return;
    }

    setOrders(Array.isArray(data.orders) ? data.orders : []);
  }

  React.useEffect(() => {
    if (!user?.id) return;
    loadOrders(user.id);
  }, [user?.id]);

  if (!user?.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
          <h1 className="mb-3 text-2xl font-bold">Compras</h1>
          <p className="mb-6 text-sm text-gray-700">
            Tenés que iniciar sesión para ver tus compras.
          </p>
          <a
            className="block w-full rounded-full bg-black py-3 text-center font-semibold text-white hover:bg-gray-900"
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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">🧾 Orders</h1>
          <a
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            href="/"
          >
            ← Volver
          </a>
        </div>

        {msg && <div className="mb-4 text-sm text-gray-700">{msg}</div>}

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-700">You haven't made any purchases yet.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {orders.map((o) => {
              const status = String(o.status ?? "PENDING").toUpperCase();

              const hasShippingAddress =
                o.fullName || o.phone || o.address1 || o.city || o.state || o.zip || o.country;

              return (
                <div
                  key={o.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 font-semibold">
                        <span>Orden #{o.id}</span>
                        <StatusBadge status={status} />
                      </div>

                      <div className="mt-1 text-sm text-gray-600">
                        Total:{" "}
                        <span className="font-bold text-gray-900">
                          {formatUSD((o.totalCents ?? 0) / 100)}
                        </span>
                        {o.currency ? <span className="text-gray-500"> ({o.currency})</span> : null}
                      </div>

                      {o.createdAt && (
                        <div className="mt-1 text-xs text-gray-500">
                          Creada: {new Date(o.createdAt).toLocaleString()}
                        </div>
                      )}

                      <OrderTimeline status={status} />
                    </div>

                    {o.mpPreferenceId && (
                      <div className="text-xs text-gray-500">
                        MP Pref: <span className="font-mono">{o.mpPreferenceId}</span>
                      </div>
                    )}
                  </div>

                  {hasShippingAddress && (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-2 text-sm font-semibold">📦 Envío</div>
                      <div className="text-sm text-gray-700">
                        {o.fullName ? (
                          <div>
                            <span className="font-semibold">Nombre:</span> {o.fullName}
                          </div>
                        ) : null}
                        {o.phone ? (
                          <div>
                            <span className="font-semibold">Tel:</span> {o.phone}
                          </div>
                        ) : null}
                        {o.address1 ? (
                          <div>
                            <span className="font-semibold">Dirección:</span> {o.address1}
                          </div>
                        ) : null}
                        {o.address2 ? (
                          <div>
                            <span className="font-semibold">Aclaración:</span> {o.address2}
                          </div>
                        ) : null}
                        {o.city || o.state || o.zip ? (
                          <div>
                            <span className="font-semibold">Ciudad/Estado/CP:</span>{" "}
                            {[o.city, o.state, o.zip].filter(Boolean).join(" - ")}
                          </div>
                        ) : null}
                        {o.country ? (
                          <div>
                            <span className="font-semibold">País:</span> {o.country}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

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

                  <div className="mt-8 space-y-4">
                    {(o.shipments ?? []).map((shipment: any) => {
                      const shipmentId = String(shipment.id);
                      const shipmentStatus = String(shipment.status ?? "PENDING").toUpperCase();

                      const shipmentItems = (o.items ?? []).filter(
                        (it: any) => String(it.shipmentId ?? "") === shipmentId
                      );

                      const hasTracking = Boolean(shipment.trackingCode);

                      return (
                        <div
                          key={shipmentId}
                          className="rounded-xl border border-gray-200 bg-white p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold">
                                🚚 {formatInventoryLocation(shipment.inventoryLocation)}
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                Shipment ID: <span className="font-mono">{shipmentId}</span>
                              </div>
                            </div>

                            <StatusBadge status={shipmentStatus} />
                          </div>

                          <ShipmentTimeline status={shipmentStatus} />

                          <div className="mt-4">
                            <div className="mb-2 text-sm font-semibold text-gray-800">
                              Items de este envío
                            </div>

                            <div className="space-y-2">
                              {shipmentItems.map((it: any) => (
                                <div
                                  key={it.id}
                                  className="flex items-center justify-between text-sm"
                                >
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

                          {hasTracking && (
                            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                              <div className="mb-2 text-sm font-semibold">Seguimiento</div>

                              <div className="space-y-1 text-sm text-gray-700">
                                {shipment.trackingCarrier ? (
                                  <div>
                                    <span className="font-semibold">Carrier:</span>{" "}
                                    {shipment.trackingCarrier}
                                  </div>
                                ) : null}

                                <div>
                                  <span className="font-semibold">Código:</span>{" "}
                                  <span className="font-mono">{shipment.trackingCode}</span>
                                </div>

                                {shipment.trackingUrl ? (
                                  <a
                                    href={shipment.trackingUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-block rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold hover:bg-gray-50"
                                  >
                                    Ver seguimiento
                                  </a>
                                ) : null}

                                {shipment.shippedAt ? (
                                  <div className="text-xs text-gray-500">
                                    Enviado: {new Date(shipment.shippedAt).toLocaleString()}
                                  </div>
                                ) : null}

                                {shipment.deliveredAt ? (
                                  <div className="text-xs text-gray-500">
                                    Entregado: {new Date(shipment.deliveredAt).toLocaleString()}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          )}

                          {!hasTracking && (
                            <div className="mt-4 text-xs text-gray-500">
                              Todavía no hay tracking cargado para este envío.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {status === "PENDING" && (
                    <div className="mt-4 text-xs text-gray-500">
                      Si pagaste recién, el estado puede demorar unos segundos en actualizar
                      (webhook). Refrescá esta página.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}