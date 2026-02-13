"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";


export default function LoginPage() {
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

  async function handleLogin() {
    setMsg("Iniciando sesión...");

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg("❌ " + (data?.error ?? "Error"));
        return;
      }

      // ✅ Guardar sesión (esto es lo que necesita el home)
      localStorage.setItem("user", JSON.stringify(data.user));

      // ✅ Redirigir al home inmediatamente
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
  width={200}
  height={200}
  className="w-32 h-32 object-contain"
  priority
/>

  <h1 className="text-2xl font-bold">Login</h1>
</div>


        <input
          className="w-full border p-3 rounded mb-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
        />

        <input
          className="w-full border p-3 rounded mb-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
        />

        <button
          type="button"
          onClick={handleLogin}
          className="w-full rounded-full bg-black py-3 text-white font-semibold hover:bg-gray-900"
        >
          Login
        </button>

        <button
          type="button"
          onClick={() => router.push("/register")}
          className="mt-3 w-full rounded-full border border-gray-200 bg-white py-3 text-sm font-semibold hover:bg-gray-50"
        >
          Crear cuenta
        </button>

        {msg && <p className="mt-4 text-sm text-gray-700">{msg}</p>}
      </div>
    </div>
  );
}

