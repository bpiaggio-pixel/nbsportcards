import Header from "@/components/header";
import Image from "next/image";
import { Link } from "@/navigation";
import { createTranslator } from "next-intl";
import NewsletterForm from "@/components/newsletter-form";

export default async function StoreLayout({
  children,
  modal,
  params,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  const t = createTranslator({
    locale,
    messages,
    namespace: "Footer",
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>



<footer className="border-t border-gray-200 bg-gray-100">
  <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
    <div className="flex flex-col gap-10 lg:min-h-[200px] lg:flex-row lg:items-start lg:justify-between lg:gap-16">
      
      {/* izquierda */}
      <div className="max-w-md">
        <div className="flex items-center gap-3">
          <Image
      src="/nb-logo.png"
      alt="NB SportCards"
      width={42}
      height={42}
      className="h-10 w-10 object-contain"
    />

    <div>
      <p className="text-sm font-semibold">Cards & Collectibles</p>
      <p className="mt-1 text-sm text-gray-500">{t("tagline")}</p>
    </div>
  </div>

  <div className="mt-6 space-y-1 text-[13px] leading-5 text-gray-500">
    <p>{t("currencyNotice")}</p>
    <p>{t("shippingNotice")}</p>
  </div>

{/* payment methods */}
<div className="mt-8">
  <p className="text-sm font-semibold text-gray-900">{t("paymentMethods")}</p>

  <div className="mt-4 flex flex-wrap items-center gap-2.5">
    <PaymentBadge label="PayPal">
      <svg viewBox="0 0 64 20" className="h-[20px] w-[60px]" aria-hidden="true">
        <text
          x="32"
          y="15"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fontFamily="Arial, Helvetica, sans-serif"
        >
          <tspan fill="#003087">Pay</tspan>
          <tspan fill="#00AEEF">Pal</tspan>
        </text>
      </svg>
    </PaymentBadge>

    <PaymentBadge label="Visa">
      <svg viewBox="0 0 54 20" className="h-[20px] w-[52px]" aria-hidden="true">
        <text
          x="27"
          y="15"
          textAnchor="middle"
          fontSize="14"
          fontWeight="800"
          fill="#1A1F71"
          fontFamily="Arial, Helvetica, sans-serif"
        >
          VISA
        </text>
      </svg>
    </PaymentBadge>

    <PaymentBadge label="Mastercard">
      <svg viewBox="0 0 34 20" className="h-[20px] w-[34px]" aria-hidden="true">
        <circle cx="13" cy="10" r="5.5" fill="#EB001B" />
        <circle cx="21" cy="10" r="5.5" fill="#F79E1B" fillOpacity="0.95" />
      </svg>
    </PaymentBadge>

    <PaymentBadge label="American Express">
      <Image
        src="/payments/amex-real3.png"
        alt="Amex"
        width={48}
        height={22}
        className="h-[22px] w-auto object-contain"
      />
    </PaymentBadge>

    <PaymentBadge label="Mercado Pago">
      <Image
        src="/payments/mercadopago-real.png"
        alt="Mercado Pago"
        width={62}
        height={24}
        className="h-[24px] w-auto object-contain"
      />
    </PaymentBadge>
  </div>
</div>     
</div>

      {/* centro - navegación */}
<div className="flex-1 lg:max-w-[360px]">
  <p className="text-sm font-semibold text-gray-900">{t("explore")}</p>

  <div className="mt-4 grid grid-cols-3 gap-x-10 gap-y-6">
    <div className="space-y-3 text-sm">
      <Link href="/" className="block text-gray-600 hover:text-sky-600 hover:font-semibold">
        Home
      </Link>

      <Link href="/blog" className="block text-gray-600 hover:text-sky-600 hover:font-semibold">
        {t("blog")}
      </Link>

      <Link href="/guide" className="block text-gray-600 hover:text-sky-600 hover:font-semibold">
        {t("guide")}
      </Link>

      <Link href="/favorites" className="block text-gray-600 hover:text-sky-600 hover:font-semibold">
        {t("favorites")}
      </Link>

      <Link href="/orders" className="block text-gray-600 hover:text-sky-600 hover:font-semibold">
        {t("orders")}
      </Link>

      <Link href="/cart" className="block text-gray-600 hover:text-sky-600 hover:font-semibold">
        {t("cart")}
      </Link>
    </div>
<div className="space-y-3 text-sm">
  <p className="font-semibold text-gray-900">Categorías</p>

  <Link href={`/${locale}/pokemon`} className="block text-gray-600 hover:text-sky-600 hover:font-semibold">
    Pokemon
  </Link>

  <Link href={`/${locale}/soccer`} className="block text-gray-600 hover:text-sky-600 hover:font-semibold">
    Soccer
  </Link>

  <Link href={`/${locale}/basketball`} className="block text-gray-600 hover:text-sky-600 hover:font-semibold">
    Basketball
  </Link>

  <Link href={`/${locale}/nfl`} className="block text-gray-600 hover:text-sky-600 hover:font-semibold">
    NFL
  </Link>
</div>
    <div className="space-y-3 text-sm">
      <Link href="/privacy" className="block text-gray-500 hover:text-sky-600 hover:font-semibold">
        {t("privacy")}
      </Link>

      <Link href="/terms" className="block text-gray-500 hover:text-sky-600 hover:font-semibold">
        {t("terms")}
      </Link>

      <Link href="/help" className="block text-gray-500 hover:text-sky-600 hover:font-semibold">
        {t("support")}
      </Link>

      <Link href="/shipping" className="block text-gray-500 hover:text-sky-600 hover:font-semibold">
        {t("shippingpol")}
      </Link>
    </div>
  </div>
</div>

     {/* derecha - newsletter */}
<div className="w-full max-w-sm min-h-0">
  <p className="text-sm font-semibold text-gray-900">{t("stayUpdated")}</p>
  <p className="mt-1 text-sm text-gray-500">{t("newsletterText")}</p>

  <NewsletterForm locale={locale === "es" ? "es" : "en"} />
</div>

    </div>

    <div className="mt-6 border-t border-gray-200 pt-5 sm:mt-8 sm:pt-7">
      <p className="text-center text-xs text-gray-500 sm:text-left">
        © {new Date().getFullYear()} NB Cards & Collectibles. {t("rights")}
      </p>
    </div>
  </div>
</footer>
      {/* ✅ Slot para el modal interceptado */}
      {modal}
    </div>
  );
}

function PaymentBadge({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div
      aria-label={label}
      className="flex h-[32px] w-[78px] items-center justify-center rounded-[2px] border border-gray-300 bg-white px-[4px]"
    >
      {children}
    </div>
  );
}
