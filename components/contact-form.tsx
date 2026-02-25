"use client";

import React from "react";

export default function ContactForm({ locale }: { locale: "es" | "en" }) {
  const isEs = locale === "es";

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [orderId, setOrderId] = React.useState(""); // ✅ nuevo (opcional)
  const [message, setMessage] = React.useState("");

  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [ticketId, setTicketId] = React.useState<string | null>(null); // ✅ nuevo

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    setTicketId(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          locale, // ✅ nuevo
          orderId: orderId.trim() ? orderId.trim() : undefined, // ✅ nuevo
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      setStatus("success");
      setTicketId(data?.ticketId ?? null);

      setName("");
      setEmail("");
      setSubject("");
      setOrderId("");
      setMessage("");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message || "Error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-gray-900">{isEs ? "Nombre" : "Name"}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
            required
            autoComplete="name"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-900">{isEs ? "Email" : "Email"}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-semibold text-gray-900">{isEs ? "Asunto" : "Subject"}</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
          required
        />
      </div>

      {/* ✅ nuevo: número de pedido opcional */}
      <div className="mt-4">
        <label className="text-sm font-semibold text-gray-900">
          {isEs ? "Número de pedido (opcional)" : "Order number (optional)"}
        </label>
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
          placeholder={isEs ? "Ej: 10234" : "e.g. 10234"}
        />
      </div>

      <div className="mt-4">
        <label className="text-sm font-semibold text-gray-900">{isEs ? "Mensaje" : "Message"}</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
          required
        />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "loading"}
          className="group relative rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200 via-cyan-200 to-blue-200 opacity-0 blur-lg transition group-hover:opacity-60 -z-10" />
          <span className="relative z-10">
            {status === "loading" ? (isEs ? "Enviando…" : "Sending…") : isEs ? "Enviar" : "Send"}
          </span>
        </button>

        {status === "success" && (
          <span className="text-sm font-semibold text-green-700">
            {isEs ? "¡Mensaje enviado!" : "Message sent!"}
            {ticketId && (
              <span className="ml-2 font-bold text-gray-800">
                {isEs ? "Ticket:" : "Ticket:"} {ticketId}
              </span>
            )}
          </span>
        )}

        {status === "error" && (
          <span className="text-sm font-semibold text-red-700">
            {isEs ? "Error al enviar:" : "Send error:"} {errorMsg}
          </span>
        )}
      </div>
    </form>
  );
}