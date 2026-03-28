import type { Metadata } from "next";
import { Link } from "@/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import CategoryTabs from "@/components/blog/CategoryTabs";
import BlogPagination from "@/components/blog/BlogPagination";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "News, guides, and highlights from NB Cards.",
  alternates: {
    canonical: "https://nbcards.com/blog",
    languages: {
      en: "https://nbcards.com/en/blog",
      es: "https://nbcards.com/es/blog",
    },
  },
  openGraph: {
    type: "website",
    title: "Blog | NB Cards",
    description: "News, guides, and highlights from NB Cards.",
    url: "https://nbcards.com/blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | NB Cards",
    description: "News, guides, and highlights from NB Cards.",
  },
};

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { q, page } = await searchParams;
const query = String(q ?? "").trim();
const currentPage = Math.max(1, Number(page ?? "1") || 1);
const pageSize = 12;
const skip = (currentPage - 1) * pageSize;
const t = await getTranslations({ locale, namespace: "BlogPage" });
const where = {
  published: true,
  locale,
  ...(query
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { excerpt: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {}),
};
const totalPosts = await prisma.post.count({ where });
const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));

  const posts = await prisma.post.findMany({
    where,
orderBy: { publishedAt: "desc" },
skip,
take: pageSize,
select: {
  id: true,
  slug: true,
  category: true,
  title: true,
  excerpt: true,
  coverImage: true,
  publishedAt: true,
  tags: { select: { tag: { select: { name: true, slug: true } } } },
},
  });

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">{t("title")}</h1>
<p className="mt-2 text-gray-600">{t("description")}</p>
<form method="GET" className="mt-6">

<input
  type="text"
  name="q"
  defaultValue={query}
  placeholder={t("searchPlaceholder")}
  className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
/>
</form>
<CategoryTabs locale={locale} />
{query ? (
  <p className="mt-4 text-sm text-gray-500">
    {t("resultsFor")} <span className="font-semibold text-gray-900">{query}</span>
  </p>
) : null}

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {posts.map((p) => {
            const rawSlug = String(p.slug ?? "").trim();
            const slug = encodeURIComponent(rawSlug);

            return (
<Link
  key={p.id}
  href={`/blog/${p.category}/${slug}`}
  locale={locale}
  className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
>
                {p.coverImage && (
                  <div className="mb-4 h-44 overflow-hidden rounded-2xl bg-gray-100">
                    <img src={p.coverImage} alt={p.title} className="h-full w-full object-cover" />
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-US") : ""}
                </div>
<div className="mt-2 text-xs font-semibold uppercase tracking-wide text-sky-500">
  {p.category}
</div>

                <div className="mt-1 text-lg font-semibold group-hover:underline">{p.title}</div>

                {p.excerpt && <p className="mt-2 text-sm text-gray-600 line-clamp-3">{p.excerpt}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <span
                      key={t.tag.slug}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                    >
                      {t.tag.name}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
<BlogPagination
  locale={locale}
  basePath="/blog"
  currentPage={currentPage}
  totalPages={totalPages}
  query={query}
/>
      </div>
    </div>
  );
}