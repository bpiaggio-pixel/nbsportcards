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

  <div className="space-y-1 text-[13px] leading-5 text-gray-500">
    <p>{t("currencyNotice")}</p>
    <p>{t("shippingNotice")}</p>
  </div>

        {/* payment methods */}
        <div className="mt-7">
          <p className="text-sm font-semibold text-gray-900">{t("paymentMethods")}</p>

         <div className="mt-3 grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:items-center">
  <div className="flex h-[34px] w-[72px] items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm">
    <Image
      src="/payments/visa.svg"
      alt="Visa"
      width={42}
      height={18}
      className="h-[18px] w-[42px] object-contain"
    />
  </div>

  <div className="flex h-[34px] w-[72px] items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm">
    <Image
      src="/payments/mastercard.svg"
      alt="Mastercard"
      width={42}
      height={18}
      className="h-[18px] w-[42px] object-contain"
    />
  </div>

  <div className="flex h-[34px] w-[72px] items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm">
    <Image
      src="/payments/amex.svg"
      alt="Amex"
      width={42}
      height={18}
      className="h-[18px] w-[42px] object-contain"
    />
  </div>

  <div className="flex h-[34px] w-[72px] items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm">
    <Image
      src="/payments/paypal.svg"
      alt="PayPal"
      width={42}
      height={18}
      className="h-[18px] w-[42px] object-contain"
    />
  </div>

  <div className="col-span-2 flex h-[34px] w-full items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm sm:w-[88px]">
    <Image
      src="/payments/mercadopago.svg"
      alt="Mercado Pago"
      width={58}
      height={18}
      className="h-[18px] w-[58px] object-contain"
    />
  </div>
</div>
        </div>
      </div>

      {/* centro - navegación */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{t("explore")}</p>

        <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-4 text-sm sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-5">
          <Link href="/" className="text-gray-600 transition-all hover:text-sky-600 hover:font-semibold">
  Home
</Link>

<Link href="/blog" className="text-gray-600 transition-all hover:text-sky-600 hover:font-semibold">
  {t("blog")}
</Link>

<Link href="/guide" className="text-gray-600 transition-all hover:text-sky-600 hover:font-semibold">
  {t("guide")}
</Link>

<Link href="/favorites" className="text-gray-600 transition-all hover:text-sky-600 hover:font-semibold">
  {t("favorites")}
</Link>

<Link href="/orders" className="text-gray-600 transition-all hover:text-sky-600 hover:font-semibold">
  {t("orders")}
</Link>

<Link href="/cart" className="text-gray-600 transition-all hover:text-sky-600 hover:font-semibold">
  {t("cart")}
</Link>

        </div>

<div className="mt-5 flex flex-col gap-3 text-xs sm:mt-6 sm:flex-row sm:flex-wrap sm:gap-4">
 <Link href="/privacy"
    className="text-gray-500 transition-colors hover:text-sky-600 hover:font-semibold"
  >
    {t("privacy")}
</Link>

  <Link
    href="/terms"
    className="text-gray-500 transition-colors hover:text-sky-600 hover:font-semibold"
>
    {t("terms")}
  </Link>

  <Link
    href="/help"
    className="text-gray-500 transition-colors hover:text-sky-600 hover:font-semibold"
  >
    {t("support")}
  </Link>

  <Link href="/shipping"
    className="text-gray-500 transition-colors hover:text-sky-600 hover:font-semibold"
  >
    {t("shippingpol")}
  </Link>

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
