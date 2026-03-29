'use client';

import React from "react";
import { createPortal } from "react-dom";
import { Link } from "@/navigation";
import {
  Heart,
  ShoppingCart,
  FileText,
  Receipt,
  Menu,
  X,
  LayoutGrid,
  HelpCircle,
  UserCircle2,
  ClipboardList,
  LogOut,
  BookOpen,
  Search,
} from "lucide-react";
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
  const pathLocale = pathname?.split("/")?.[1] ?? "";

  const activeLocale = ((locale || pathLocale) === "es" ? "es" : "en") as "es" | "en";

  // ✅ Solo mostramos el buscador en Home (/{locale})
  // Nota: en este proyecto el home real es /es o /en (sin más segmentos)
  const isHome = React.useMemo(() => {
    if (!pathname) return false;
    return pathname === `/${activeLocale}` || pathname === `/${activeLocale}/`;
  }, [pathname, activeLocale]);

  const [langOpen, setLangOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [portalRoot, setPortalRoot] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    // Create (or reuse) a dedicated portal root to avoid stacking-context + SSR issues
    const id = "app-portal-root";
    let el = document.getElementById(id) as HTMLElement | null;
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      document.body.appendChild(el);
    }
    setPortalRoot(el);
  }, []);

  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  // Cambiar idioma manteniendo la ruta actual (/en/lo-que-sea => /es/lo-que-sea)
  function switchLocale(nextLocale: "en" | "es") {
    const segments = (pathname ?? "/").split("/");

    const rest = "/" + segments.slice(2).join("/"); // todo lo que viene después del locale
    const newPath = `/${nextLocale}${rest === "/" ? "" : rest}`;

    setLangOpen(false);
    router.push(newPath);
  }

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

  const glow = "from-sky-500/60 via-cyan-400/45 to-blue-600/60";

  return (
    <header className="sticky top-0 z-[9999] bg-black">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
        {/* ✅ DESKTOP (sm+): como antes, en una fila */}
        <div className="hidden sm:flex items-center gap-6">
<Link href="/" className="group relative flex items-center gap-2 font-bold tracking-tight">
  <span
    className={`absolute -inset-3 rounded-full bg-gradient-to-r ${glow} opacity-0 blur-xl transition group-hover:opacity-50 -z-10`}
  />
  <Image
    src="/nb-logo3.png"
    alt="NB"
    width={40}
    height={40}
    className="h-10 w-10 object-contain"
    priority
  />

  <span>
    <span className="text-xl text-white">Cards</span>
    <span className="text-xs text-white/55">   & collectibles</span>
  </span>
</Link>

          <div className="flex-1">
            {isHome ? (
  <div className="relative w-full group">
<Search
  size={18}
  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45 transition group-hover:text-gray-600 group-focus-within:text-gray-600"
/>
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
className="peer w-full rounded-full border border-white/10 bg-white/[0.04] py-2 pl-11 pr-5 text-sm text-white/90 placeholder:text-white/40 outline-none transition hover:bg-white hover:text-gray-900 hover:placeholder:text-gray-500 hover:border-sky-400/40 focus:bg-white focus:text-gray-900 focus:placeholder:text-gray-500 focus:ring-2 focus:ring-sky-500/30"
    />
  </div>
) : (
              <Link
                href="/"
                className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.07] transition relative"
              >
                <span
                  className={`absolute inset-0 rounded-full bg-gradient-to-r ${glow} opacity-0 blur-lg transition group-hover:bg-white/[0.27] transition relative -z-10`}
                />
                <LayoutGrid size={16} className="relative z-10 text-white/70" />
                <span className="relative z-10">{t("cards")}</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/blog"
                  className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.57] transition relative"
                >
                  <span
                    className={`absolute inset-2 rounded-full bg-gradient-to-r ${glow} opacity-0 blur-lg transition group-hover:opacity-60 -z-10`}
                  />
                  <FileText size={16} className="relative z-10 text-white/70" />
                  <span className="relative z-10">{t("blog")}</span>
                </Link>

<Link
  href="/guide"
  className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.57] transition relative"
>
  <span
    className={`absolute inset-2 rounded-full bg-gradient-to-r ${glow} opacity-0 blur-lg transition group-hover:opacity-60 -z-10`}
  />
  <BookOpen size={16} className="relative z-10 text-white/70" />
  <span className="relative z-10">{t("guide")}</span>
</Link>

                <Link
                  href="/favorites"
                  className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.57] transition relative"
                >
                  <span
                    className={`absolute inset-0 rounded-full bg-gradient-to-r ${glow} opacity-0 blur-lg transition group-hover:opacity-60 -z-10`}
                  />
                  <Heart
                    size={16}
                    className={`relative z-10 ${favCount > 0 ? "text-red-500" : "text-white/60"}`}
                    fill={favCount > 0 ? "currentColor" : "none"}
                  />
                  <span className="relative z-10">
                    {t("favorites")}
                    {favCount > 0 && <span className="ml-1 text-xs font-bold text-white/80">({favCount})</span>}
                  </span>
                </Link>

                <Link
                  href="/orders"
                  className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.57] transition relative"
                >
                  <span
                    className={`absolute inset-0 rounded-full bg-gradient-to-r ${glow} opacity-0 blur-lg transition group-hover:opacity-60 -z-10`}
                  />
                  <ClipboardList size={16} className="relative z-10 text-white/70" />
                  <span className="relative z-10">{t("orders")}</span>
                </Link>

                <Link
                  href="/cart"
                  className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.57] transition relative"
                >
                  <span
                    className={`absolute inset-0 rounded-full bg-gradient-to-r ${glow} opacity-0 blur-lg transition group-hover:opacity-60 -z-10`}
                  />
                  <ShoppingCart size={16} className="relative z-10 text-white/85" />
                  <span className="relative z-10">
                    {t("cart")}{" "}
                    {cartCount > 0 && <span className="ml-1 text-xs font-bold text-white/80">({cartCount})</span>}
                  </span>
                </Link>

                <span title={user.email} className="hidden lg:block text-sm font-semibold text-white/75 max-w-[140px] truncate">
                  <UserCircle2 size={20} className="text-white/60 inline align-middle mr-1" />{" "}
                  {user.email.length > 8 ? `${user.email.slice(0, 5)}…` : user.email}
                </span>
<button
  type="button"
  onClick={logout}
  aria-label={t("logout")}
  className="group relative h-9 w-9 flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/85 hover:bg-white/[0.57] transition cursor-pointer"
>
  <span
    className={`absolute inset-0 rounded-full bg-gradient-to-r ${glow} opacity-0 blur-lg transition group-hover:opacity-60 -z-10`}
  />
  <LogOut
    size={18}
    className="transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:rotate-6"
  />
</button>
              </>
            ) : (
              <>
                <Link
                  href="/blog"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.57] flex items-center gap-2 transition"
                >
                  <FileText size={16} className="text-white/70" />
                  {t("blog")}
                </Link>
<Link
  href="/guide"
  className="group relative rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.57] flex items-center gap-2 transition"
>
  <span
    className={`absolute inset-0 rounded-full bg-gradient-to-r ${glow} opacity-0 blur-lg transition group-hover:opacity-60 -z-10`}
  />
  <BookOpen size={16} className="relative z-10 text-white/70" />
  <span className="relative z-10">{t("guide")}</span>
</Link>
                <Link
                  href="/login"
                  className="group relative rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.57] transition"
                >
                  <span
                    className={`absolute inset-0 rounded-full bg-gradient-to-r ${glow} opacity-0 blur-lg transition group-hover:opacity-60 -z-10`}
                  />
                  <span className="relative z-10">{t("login")}</span>
                </Link>

                <Link
                  href="/register"
                  className="rounded-full bg-gradient-to-r from-sky-500/80 to-blue-600/80 px-4 py-2 text-sm font-semibold text-white hover:from-sky-400 hover:to-blue-500 shadow-[0_18px_50px_rgba(56,189,248,0.18)] transition"
                >
                  {t("register")}
                </Link>
              </>
            )}

            

            {/* ✅ HELP BUTTON (desktop) */}
            <Link
              href="/help"
              aria-label={activeLocale === "es" ? "Ayuda" : "Help"}
              title={activeLocale === "es" ? "Ayuda" : "Help"}
              className="group relative rounded-full border border-white/10 bg-white/[0.12] p-2 hover:bg-white/[0.57] transition"
            >
              <span
                className={`absolute inset-0 rounded-full bg-gradient-to-r ${glow} opacity-0 blur-lg transition group-hover:opacity-60 -z-10`}
              />
              <HelpCircle size={18} className="relative z-10 text-white/80" />
            </Link>
{/* ✅ LANGUAGE SWITCHER (desktop) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.27] transition"
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
                <span className="text-white/50">▾</span>
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-[#0f0f18]/95 shadow-2xl backdrop-blur">
                  <button
                    type="button"
                    onClick={() => switchLocale("en")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
                  >
                    <Image src="/flags/us1.png" alt="English" width={18} height={18} className="rounded-sm" />
                    <span>English</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => switchLocale("es")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
                  >
                    <Image src="/flags/es.png" alt="Español" width={18} height={18} className="rounded-sm" />
                    <span>Español</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>



       {/* ✅ MOBILE (sm-): logo + búsqueda + acciones en una sola fila */}
<div className="sm:hidden">
  <div className="flex items-center gap-2">
    <Link href="/" className="group relative flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight">
      <span
        className={`absolute -inset-3 rounded-full bg-gradient-to-r ${glow} opacity-0 blur-xl transition group-hover:opacity-40 -z-10`}
      />
      <Image src="/nb-logo3.png" alt="NB" width={40} height={40} className="h-10 w-10 object-contain" priority />
    </Link>

    <div className="min-w-0 flex-1">
{isHome ? (
<div className="relative w-full group">
<Search
  size={17}
  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45 transition group-hover:text-gray-600 group-focus-within:text-gray-600"
/>
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
      className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2 pl-11 pr-5 text-sm text-white/90 placeholder:text-white/40 outline-none transition hover:bg-white hover:text-gray-900 hover:placeholder:text-gray-500 focus:bg-white focus:text-gray-900 focus:placeholder:text-gray-500 focus:ring-2 focus:ring-sky-500/30"
/>
  </div>
) : (
        <Link
          href="/"
          className="flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.57] transition relative"
        >
          {t("cards")}
        </Link>
      )}
    </div>

    <div className="flex shrink-0 items-center gap-2">
      {/* idioma */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setLangOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.07] transition"
        >
          <img
            src={activeLocale === "es" ? "/flags/es.png" : "/flags/us.png"}
            alt="flag"
            width={18}
            height={18}
            className="rounded-sm"
            draggable={false}
          />
          <span className="text-white/50">▾</span>
        </button>

        {langOpen && (
          <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-[#0f0f18]/95 shadow-2xl backdrop-blur">
            <button
              type="button"
              onClick={() => switchLocale("en")}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
            >
              <Image src="/flags/us.png" alt="English" width={18} height={18} className="rounded-sm" />
              <span>English</span>
            </button>

            <button
              type="button"
              onClick={() => switchLocale("es")}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
            >
              <Image src="/flags/es.png" alt="Español" width={18} height={18} className="rounded-sm" />
              <span>Español</span>
            </button>
          </div>
        )}
      </div>

      {/* ✅ HELP BUTTON (mobile top bar) */}
      <Link
        href="/help"
        aria-label={activeLocale === "es" ? "Ayuda" : "Help"}
        title={activeLocale === "es" ? "Ayuda" : "Help"}
        className="group relative rounded-full border border-white/10 bg-white/[0.04] p-2 hover:bg-white/[0.07] transition"
      >
        <span
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${glow} opacity-0 blur-lg transition group-hover:opacity-60 -z-10`}
        />
        <HelpCircle size={18} className="relative z-10 text-white/80" />
      </Link>

      {/* ✅ CART ICON BUTTON (mobile top bar) */}
      <Link
        href="/cart"
        aria-label={activeLocale === "es" ? "Carrito" : "Cart"}
        title={activeLocale === "es" ? "Carrito" : "Cart"}
        className="group relative rounded-full border border-white/10 bg-white/[0.04] p-2 hover:bg-white/[0.07] transition"
      >
        <span
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${glow} opacity-0 blur-lg transition group-hover:opacity-60 -z-10`}
        />
        <ShoppingCart size={18} className="relative z-10 text-white/80" />

        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-sky-500/80 text-white text-[11px] leading-[18px] font-bold text-center">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </Link>

      {/* menú */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="rounded-full border border-white/10 bg-white/[0.04] p-2 hover:bg-white/[0.07]"
        aria-label="Open menu"
      >
        <Menu size={18} className="text-white/80" />
      </button>
    </div>
  </div>
</div>

        {/* ✅ Drawer mobile */}
        {portalRoot &&
          mobileMenuOpen &&
          createPortal(
            <div className="fixed inset-0 z-[9999] sm:hidden">
              <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
              <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-[#0f0f18] border-l border-white/10 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
                  <div className="text-sm font-bold text-white/90">Menu</div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-full border border-white/10 bg-white/[0.04] p-2 hover:bg-white/[0.07]"
                    aria-label="Close menu"
                  >
                    <X size={18} className="text-white/80" />
                  </button>
                </div>

                <div className="space-y-2 px-4 py-4">
                  <Link
                    href="/blog"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/85 hover:bg-white/[0.07]"
                  >
                    <FileText size={16} className="text-white/70" />
                    {t("blog")}
                  </Link>
<Link
  href="/guide"
  onClick={() => setMobileMenuOpen(false)}
  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/85 hover:bg-white/[0.07]"
>
  <BookOpen size={16} className="text-white/70" />
  {t("guide")}
</Link>


                  {user ? (
                    <>
                      <Link
                        href="/favorites"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/85 hover:bg-white/[0.07]"
                      >
                        <span className="flex items-center gap-3">
                          <Heart size={16} className="text-white/70" />
                          {t("favorites")}
                        </span>
                      </Link>

                      <Link
                        href="/cart"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/85 hover:bg-white/[0.07]"
                      >
                        <span className="flex items-center gap-3">
                          <ShoppingCart size={16} className="text-white/70" />
                          {t("cart")}
                        </span>
                        {cartCount > 0 && (
                          <span className="rounded-full bg-white/[0.08] border border-white/10 px-2 py-0.5 text-xs font-bold text-white">
                            {cartCount}
                          </span>
                        )}
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/85 hover:bg-white/[0.07]"
                      >
                        <Receipt size={16} className="text-white/70" />
                        {t("orders")}
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                          router.push(`/${locale}/login`);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/85 hover:bg-white/[0.07]"
                      >
                        <LogOut size={16} className="text-white/70" />
                        {t("logout")}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/85 hover:bg-white/[0.07]"
                      >
                        {t("login")}
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-sky-500/80 to-blue-600/80 px-4 py-3 text-sm font-semibold text-white hover:from-sky-400 hover:to-blue-500 shadow-[0_18px_50px_rgba(56,189,248,0.18)]"
                      >
                        {t("register")}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>,
            portalRoot
          )}
      </div>
    </header>
  );
}
