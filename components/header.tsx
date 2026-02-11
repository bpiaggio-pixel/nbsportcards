"use client";

import React from "react";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";

type SessionUser = { id: string; email: string } | null;

export default function Header() {
  const [search, setSearch] = React.useState("");

  const [user, setUser] = React.useState<SessionUser>(null);
  const [wishlist, setWishlist] = React.useState<Record<string, boolean>>({});
  const [cartCount, setCartCount] = React.useState(0);

  // ✅ normaliza ids (por si DB trae "11" y UI usa "Card-011")
  const normId = React.useCallback((v: any) => {
    const s = String(v ?? "").trim();
    const m = s.match(/\d+/);
    return m ? String(parseInt(m[0], 10)) : s;
  }, []);

  React.useEffect(() => {
    function syncUser() {
      try {
        const raw = localStorage.getItem("user");
        setUser(raw ? JSON.parse(raw) : null);
      } catch {
        setUser(null);
      }
    }
    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("focus", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("focus", syncUser);
    };
  }, []);

  function logout() {
    try {
      localStorage.removeItem("user");
    } catch {}
    setUser(null);

    try {
      const raw = localStorage.getItem("wishlist");
      setWishlist(raw ? JSON.parse(raw) : {});
    } catch {
      setWishlist({});
    }
  }

  // ✅ helper: recargar favoritos desde DB (user logueado) o localStorage (guest)
  const refreshWishlist = React.useCallback(async () => {
    // user logueado => DB
    if (user?.id) {
      try {
        const res = await fetch(`/api/favorites?userId=${encodeURIComponent(user.id)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        const ids: string[] = Array.isArray(data.cardIds) ? data.cardIds : [];
        const normalized = ids.map(normId);
        setWishlist(Object.fromEntries(normalized.map((id) => [id, true])));
      } catch {}
      return;
    }

    // guest => localStorage
    try {
      const raw = localStorage.getItem("wishlist");
      setWishlist(raw ? JSON.parse(raw) : {});
    } catch {
      setWishlist({});
    }
  }, [user?.id, normId]);

  React.useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  React.useEffect(() => {
    const onWishChanged = () => {
      refreshWishlist();
    };

    window.addEventListener("wishlist:changed", onWishChanged as EventListener);
    window.addEventListener("focus", onWishChanged as EventListener);

    return () => {
      window.removeEventListener("wishlist:changed", onWishChanged as EventListener);
      window.removeEventListener("focus", onWishChanged as EventListener);
    };
  }, [refreshWishlist]);

  // ✅ helper: recargar cartCount (DB si hay user, localStorage si guest)
  const refreshCartCount = React.useCallback(async () => {
    // user logueado => DB
    if (user?.id) {
      try {
        const res = await fetch(`/api/cart?userId=${encodeURIComponent(user.id)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];

        // suma qty de todos los items
        const totalQty = items.reduce((sum: number, it: any) => {
          return sum + Number(it.qty ?? 0);
        }, 0);

        setCartCount(totalQty);
      } catch {}
      return;
    }

    // guest => localStorage
    try {
      const raw = localStorage.getItem("cartCount");
      setCartCount(raw ? Number(raw) : 0);
    } catch {}
  }, [user?.id]);

  // ✅ cart count: carga inicial + escucha evento global
  React.useEffect(() => {
    refreshCartCount();

    const onCartChanged = () => {
      refreshCartCount();
    };

    window.addEventListener("cart:changed", onCartChanged as EventListener);
    window.addEventListener("storage", onCartChanged as EventListener);
    window.addEventListener("focus", onCartChanged as EventListener);

    return () => {
      window.removeEventListener("cart:changed", onCartChanged as EventListener);
      window.removeEventListener("storage", onCartChanged as EventListener);
      window.removeEventListener("focus", onCartChanged as EventListener);
    };
  }, [refreshCartCount]);

  const favCount = Object.values(wishlist).filter(Boolean).length;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-[#fcfcfd]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          🃏 NB SportCards
        </Link>

        <div className="flex-1">
          <input
            placeholder="Search cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-gray-200 bg-gray-100 px-5 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
          />
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              className="group flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition relative"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200 via-cyan-200 to-blue-200 opacity-0 blur-lg transition group-hover:opacity-60" />
              <ShoppingCart size={16} className="relative z-10 text-gray-900" />
              <span className="relative z-10">
                Cart{" "}
                {cartCount > 0 && (
                  <span className="ml-1 text-xs font-bold text-gray-700">
                    ({cartCount})
                  </span>
                )}
              </span>
            </Link>

            <Link
              href="/orders"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              🧾 Orders
            </Link>

            <Link
              href="/favorites"
              className="group flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition relative"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200 via-cyan-200 to-blue-200 opacity-0 blur-lg transition group-hover:opacity-60" />
              <Heart
                size={16}
                className={`relative z-10 ${favCount > 0 ? "text-pink-600" : "text-gray-500"}`}
                fill={favCount > 0 ? "currentColor" : "none"}
              />
              <span className="relative z-10">
                Favorites{" "}
                {favCount > 0 && (
                  <span className="ml-1 text-xs font-bold text-gray-700">
                    ({favCount})
                  </span>
                )}
              </span>
            </Link>

            <span className="hidden sm:block text-sm font-semibold text-gray-700">
              👤 {user.email}
            </span>

            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
