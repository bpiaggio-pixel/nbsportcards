"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  // Si ya está logueado, mandalo al home
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) router.replace("/");
    } catch {}
  }, [router]);

  async function handleRegister() {
    setMsg("Creando usuario...");

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg("❌ " + (data?.error ?? "Error"));
        return;
      }

      // ✅ Guardar sesión
      localStorage.setItem("user", JSON.stringify(data.user));

      // ✅ Redirigir
      router.replace("/");
    } catch {
      setMsg("❌ Error conectando con la API");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/nb-logo.png"
            alt="NB"
            width={140}
            height={140}
            priority
            className="mb-3"
          />
          <h1 className="text-2xl font-bold">Crear cuenta</h1>
        </div>

        <input
          className="w-full border p-3 rounded mb-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRegister();
          }}
        />

        <input
          className="w-full border p-3 rounded mb-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRegister();
          }}
        />

        <button
          type="button"
          onClick={handleRegister}
          className="w-full rounded-full bg-black py-3 text-white font-semibold hover:bg-gray-900"
        >
          Registrarse
        </button>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mt-3 w-full rounded-full border border-gray-200 bg-white py-3 text-sm font-semibold hover:bg-gray-50"
        >
          Ya tengo cuenta
        </button>

        {msg && <p className="mt-4 text-sm text-gray-700">{msg}</p>}
      </div>
    </div>
  );
}
