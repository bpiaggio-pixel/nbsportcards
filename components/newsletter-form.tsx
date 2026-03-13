"use client";

import React from "react";

export default function NewsletterForm({ locale }: { locale: "es" | "en" }) {
  const isEs = locale === "es";

  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      setStatus("success");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message || "Error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={isEs ? "Email" : "Email"}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-black/10"
        required
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-fit rounded-xl bg-gray-800 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:opacity-60"
        >
          {status === "loading"
            ? isEs
              ? "Enviando…"
              : "Sending…"
            : isEs
            ? "Suscribirme"
            : "Subscribe"}
        </button>

        {status === "success" && (
          <span className="text-sm font-semibold text-green-700">
            {isEs ? "¡Suscripción enviada!" : "Subscribed!"}
          </span>
        )}

        {status === "error" && (
          <span className="text-sm font-semibold text-red-700">
            {isEs ? "Error:" : "Error:"} {errorMsg}
          </span>
        )}
      </div>
    </form>
  );
}