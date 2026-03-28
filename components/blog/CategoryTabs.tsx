"use client";

import { Link } from "@/navigation";
import { usePathname } from "next/navigation";

export default function CategoryTabs({ locale }: { locale: string }) {
  const pathname = usePathname();
  const safePathname = pathname ?? "";

  const categories = [
    { name: "All", href: "/blog" },
    { name: "Pokemon", href: "/blog/pokemon" },
    { name: "Soccer", href: "/blog/soccer" },
    { name: "Basketball", href: "/blog/basketball" },
    { name: "NFL", href: "/blog/nfl" },
  ];

  return (
    <div className="mt-6 mb-6 flex flex-wrap gap-3">
      {categories.map((cat) => {
        const isActive =
          safePathname === `/${locale}${cat.href}` ||
          (cat.href !== "/blog" &&
            safePathname.startsWith(`/${locale}${cat.href}`));

        return (
          <Link
            key={cat.name}
            href={cat.href}
            locale={locale}
            className={`rounded-full px-4 py-2 text-sm font-medium transition border ${
              isActive
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 hover:bg-blue-100 hover:border-blue-400"
            }`}
          >
            {cat.name}
          </Link>
        );
      })}
    </div>
  );
}