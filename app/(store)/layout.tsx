import Header from "@/components/Header";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-50 border-b border-gray-600 bg-gray-50/90 backdrop-blur">
      {/* TOP */}
      <Header />

      {/* MAIN */}
      <main className="flex-1">{children}</main>

      {/* FOOTER */}
<footer className="border-t border-gray-200 bg-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* Brand */}
            <div>
              <p className="text-sm font-semibold">🃏 NB SportCards</p>
              <p className="mt-1 text-sm text-gray-500">
                Buy, collect and discover the best sports cards.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </a>
              <a href="/favorites" className="text-gray-600 hover:text-gray-900">
                Favorites
              </a>
              <a href="/cart" className="text-gray-600 hover:text-gray-900">
                Cart
              </a>
              <a href="/orders" className="text-gray-600 hover:text-gray-900">
                Orders
              </a>
            </div>
          </div>

          {/* Bottom line */}
          <div className="mt-8 border-t border-gray-200 pt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} NB SportCards. All rights reserved.
            </p>

            <div className="flex gap-4 text-xs">
              <a href="#" className="text-gray-500 hover:text-gray-800">
                Privacy
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-800">
                Terms
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-800">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

