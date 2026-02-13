"use client";

import React from "react";
import { Link } from "@/navigation";
import { Heart, ShoppingCart, FileText, Receipt, Menu, X } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

type SessionUser = { id: string; email: string } | null;

export default function Header() {
  const [search, setSearch] = React.useState("");

  const [user, setUser] = React.useState<SessionUser>(null);
  const [wishlist, setWishlist] = React.useState<Record<string, boolean>>({});
  const [cartCount, setCartCount] = React.useState(0);

  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();

  const t = useTranslations("Header");
  const locale = useLocale(); // "en" | "es"
const pathLocale = (pathname?.split("/")?.[1] ?? "");

const activeLocale = ((locale || pathLocale) === "es" ? "es" : "en") as "es" | "en";


  const [langOpen, setLangOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Cambiar idioma manteniendo la ruta actual (/en/lo-que-sea => /es/lo-que-sea)
  function switchLocale(nextLocale: "en" | "es") {
    const segments = (pathname ?? "/").split("/");

    const rest = "/" + segments.slice(2).join("/"); // todo lo que viene después del locale
    const newPath = `/${nextLocale}${rest === "/" ? "" : rest}`;

    setLangOpen(false);
    router.push(newPath);
  }

  // ... el resto de tu componente sigue acá (effects, return, etc)

  // inicializa el input desde la URL (por si recargás la página)
  React.useEffect(() => {
    setSearch(params?.get("q") ?? "");

    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  <header className="sticky top-0 z-[500] border-b border-gray-200 bg-[#fcfcfd]/95 backdrop-blur">

    <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
      {/* ✅ DESKTOP (sm+): como antes, en una fila */}
      <div className="hidden sm:flex items-center gap-6">
        <Link href="/" className="group relative flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="absolute -inset-3 rounded-full bg-gradient-to-r from-sky-200 via-cyan-200 to-blue-200 opacity-0 blur-xl transition group-hover:opacity-30 -z-10" />
          <Image
            src="/nb-logo3.png"
            alt="NB"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
          <span>
            <span className="text-gray-700">Sport</span>
            <span className="text-gray-400">Cards</span>
          </span>
        </Link>

        <div className="flex-1">
          <input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => {
              const v = e.target.value;
              setSearch(v);

              const next = new URLSearchParams(params?.toString() ?? "");
              const q = v.trim();
              if (q) next.set("q", q);
              else next.delete("q");

              const qs = next.toString();
              const safePath = pathname ?? "/";
              router.replace(qs ? `${safePath}?${qs}` : safePath);
            }}
            className="w-full rounded-full border border-gray-200 bg-gray-100 px-5 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
          />
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/blog"
                className="group flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition relative"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200 via-cyan-200 to-blue-200 opacity-0 blur-lg transition group-hover:opacity-60 -z-10" />
                <FileText size={16} className="relative z-10 text-gray-600" />
                <span className="relative z-10">{t("blog")}</span>
              </Link>

              <Link
                href="/favorites"
                className="group flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition relative"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200 via-cyan-200 to-blue-200 opacity-0 blur-lg transition group-hover:opacity-60 -z-10" />
                <Heart
                  size={16}
                  className={`relative z-10 ${favCount > 0 ? "text-pink-600" : "text-gray-500"}`}
                  fill={favCount > 0 ? "currentColor" : "none"}
                />
                <span className="relative z-10">
                  {t("favorites")}
                  {favCount > 0 && <span className="ml-1 text-xs font-bold text-gray-700">({favCount})</span>}
                </span>
              </Link>

              <Link
                href="/orders"
                className="group flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition relative"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200 via-cyan-200 to-blue-200 opacity-0 blur-lg transition group-hover:opacity-60 -z-10" />
                <Receipt size={16} className="relative z-10 text-gray-600" />
                <span className="relative z-10">{t("orders")}</span>
              </Link>

              <Link
                href="/cart"
                className="group flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition relative"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200 via-cyan-200 to-blue-200 opacity-0 blur-lg transition group-hover:opacity-60 -z-10" />
                <ShoppingCart size={16} className="relative z-10 text-gray-900" />
                <span className="relative z-10">
                  {t("cart")}{" "}
                  {cartCount > 0 && <span className="ml-1 text-xs font-bold text-gray-700">({cartCount})</span>}
                </span>
              </Link>

              <span
                title={user.email}
                className="hidden lg:block text-sm font-semibold text-gray-700 max-w-[120px] truncate"
              >
                👤 {user.email.length > 10 ? `${user.email.slice(0, 10)}…` : user.email}
              </span>

              <button
                type="button"
                onClick={logout}
                className="group relative rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200 via-cyan-200 to-blue-200 opacity-0 blur-lg transition group-hover:opacity-60 -z-10" />
                <span className="relative z-10">{t("logout")}</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/blog"
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 flex items-center gap-2"
              >
                <FileText size={16} className="text-gray-600" />
                {t("blog")}
              </Link>

              <Link
                href="/login"
                className="group relative rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200 via-cyan-200 to-blue-200 opacity-0 blur-lg transition group-hover:opacity-60 -z-10" />
                <span className="relative z-10">{t("login")}</span>
              </Link>

              <Link
                href="/register"
                className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
              >
                {t("register")}
              </Link>
            </>
          )}

          {/* ✅ LANGUAGE SWITCHER (desktop) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50 transition"
            >
              <img
                src={activeLocale === "es" ? "/flags/es.png" : "/flags/us.png"}
                alt="flag"
                width={18}
                height={18}
                className="rounded-sm"
                draggable={false}
              />
              <span key={`label-${activeLocale}`}>{activeLocale === "es" ? "ES" : "EN"}</span>
              <span className="text-gray-500">▾</span>
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-gray-200 bg-white shadow-lg">
                <button
                  type="button"
                  onClick={() => switchLocale("en")}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <Image src="/flags/us.png" alt="English" width={18} height={18} className="rounded-sm" />
                  <span>English</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchLocale("es")}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <Image src="/flags/es.png" alt="Español" width={18} height={18} className="rounded-sm" />
                  <span>Español</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ MOBILE (sm-): fila (logo + idioma + menú) + búsqueda abajo */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="group relative flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="absolute -inset-3 rounded-full bg-gradient-to-r from-sky-200 via-cyan-200 to-blue-200 opacity-0 blur-xl transition group-hover:opacity-30 -z-10" />
            <Image
              src="/nb-logo3.png"
              alt="NB"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            {/* idioma */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50 transition"
              >
                <img
                  src={activeLocale === "es" ? "/flags/es.png" : "/flags/us.png"}
                  alt="flag"
                  width={18}
                  height={18}
                  className="rounded-sm"
                  draggable={false}
                />
                <span className="text-gray-500">▾</span>
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-gray-200 bg-white shadow-lg">
                  <button
                    type="button"
                    onClick={() => switchLocale("en")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <Image src="/flags/us.png" alt="English" width={18} height={18} className="rounded-sm" />
                    <span>English</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => switchLocale("es")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <Image src="/flags/es.png" alt="Español" width={18} height={18} className="rounded-sm" />
                    <span>Español</span>
                  </button>
                </div>
              )}
            </div>

            {/* menú */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-full border border-gray-200 bg-white p-2 hover:bg-gray-50"
              aria-label="Open menu"
            >
              <Menu size={18} className="text-gray-700" />
            </button>
          </div>
        </div>

        <div className="mt-3">
          <input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => {
              const v = e.target.value;
              setSearch(v);

              const next = new URLSearchParams(params?.toString() ?? "");
              const q = v.trim();
              if (q) next.set("q", q);
              else next.delete("q");

              const qs = next.toString();
              const safePath = pathname ?? "/";
              router.replace(qs ? `${safePath}?${qs}` : safePath);
            }}
            className="w-full rounded-full border border-gray-200 bg-gray-100 px-5 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
          />
        </div>
      </div>

      {/* ✅ Drawer mobile */}
      {mobileMenuOpen && (
<div className="fixed inset-0 z-[1000] sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
              <div className="text-sm font-bold text-gray-900">Menu</div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full border border-gray-200 bg-white p-2 hover:bg-gray-50"
                aria-label="Close menu"
              >
                <X size={18} className="text-gray-700" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-2">
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50"
              >
                <FileText size={16} className="text-gray-600" />
                {t("blog")}
              </Link>

              {user ? (
                <>
                  <Link
                    href="/favorites"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Heart
                        size={16}
                        className={favCount > 0 ? "text-pink-600" : "text-gray-500"}
                        fill={favCount > 0 ? "currentColor" : "none"}
                      />
                      {t("favorites")}
                    </div>
                    {favCount > 0 && <span className="text-xs font-bold text-gray-700">({favCount})</span>}
                  </Link>

                  <Link
                    href="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50"
                  >
                    <Receipt size={16} className="text-gray-600" />
                    {t("orders")}
                  </Link>

                  <Link
                    href="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart size={16} className="text-gray-900" />
                      {t("cart")}
                    </div>
                    {cartCount > 0 && <span className="text-xs font-bold text-gray-700">({cartCount})</span>}
                  </Link>

                  <div className="mt-3 rounded-xl border border-gray-200 p-4">
                    <div className="text-xs text-gray-500 mb-1">👤</div>
                    <div className="text-sm font-semibold text-gray-900 break-all">{user.email}</div>

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="mt-3 w-full rounded-full bg-black py-3 text-sm font-semibold text-white hover:bg-gray-900"
                    >
                      {t("logout")}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50"
                  >
                    {t("login")}
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-3 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-900"
                  >
                    {t("register")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </header>
);

}
