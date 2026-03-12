import type { Metadata } from "next";
import { Link } from "@/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guide",
  description: "Collector guides and tutorials.",
};

export default async function GuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
const t = await getTranslations({ locale, namespace: "GuidePage" });

  const query = String(q ?? "").trim();

  const guides = await prisma.guide.findMany({
    where: {
      published: true,
      locale,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { excerpt: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">
  {t("title")}
</h1>

<p className="mt-2 text-gray-600">
  {t("description")}
</p>

        <form method="GET" className="mt-6">
          <input
  type="text"
  name="q"
  defaultValue={query}
  placeholder={t("searchPlaceholder")}
  className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
/>
        </form>

        {query ? (
  <p className="mt-4 text-sm text-gray-500">
    {t("resultsFor")} <span className="font-semibold text-gray-900">{query}</span>
  </p>
) : null}

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {guides.map((g) => {
            const slug = encodeURIComponent(g.slug);

            return (
              <Link
                key={g.id}
                href={`/guide/${slug}`}
                locale={locale}
                className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
              >
                {g.coverImage && (
                  <div className="mb-4 h-44 overflow-hidden rounded-2xl bg-gray-100">
                    <img src={g.coverImage} alt={g.title} className="h-full w-full object-cover" />
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  {g.publishedAt ? new Date(g.publishedAt).toLocaleDateString("en-US") : ""}
                </div>

                <div className="mt-1 text-lg font-semibold group-hover:underline">
                  {g.title}
                </div>

                {g.excerpt && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                    {g.excerpt}
                  </p>
                )}
              </Link>
            );
          })}
        </div>

{guides.length === 0 ? (
  <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
    {t("empty")}
  </div>
) : null}
      </div>
    </div>
  );
}