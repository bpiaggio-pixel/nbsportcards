import Header from "@/components/header";
import Image from "next/image";
import { Link } from "@/navigation";
import { createTranslator } from "next-intl";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/nb-logo.png"
                alt="NB SportCards"
                width={42}
                height={42}
                className="h-10 w-10 object-contain"
              />

              <div>
                <p className="text-sm font-semibold">SportCards</p>
                <p className="mt-1 text-sm text-gray-500">{t("tagline")}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>

              <Link href="/blog" className="text-gray-600 hover:text-gray-900">
                Blog
              </Link>

              <Link href="/favorites" className="text-gray-600 hover:text-gray-900">
                {t("favorites")}
              </Link>

              <Link href="/orders" className="text-gray-600 hover:text-gray-900">
                {t("orders")}
              </Link>

              <Link href="/cart" className="text-gray-600 hover:text-gray-900">
                {t("cart")}
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} NB SportCards. {t("rights")}
            </p>

            <div className="flex gap-4 text-xs">
              <a href="#" className="text-gray-500 hover:text-gray-800">
                {t("privacy")}
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-800">
                {t("terms")}
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-800">
                {t("support")}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
