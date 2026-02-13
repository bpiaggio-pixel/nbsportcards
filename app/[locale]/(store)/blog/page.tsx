import type { Metadata } from "next";
import { Link } from "@/navigation";
import { prisma } from "@/lib/prisma";

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

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      id: true,
      slug: true,
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
        <h1 className="text-3xl font-extrabold tracking-tight">Blog</h1>
        <p className="mt-2 text-gray-600">News, guides, and highlights.</p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {posts.map((p) => {
            const rawSlug = String(p.slug ?? "").trim();
            const slug = encodeURIComponent(rawSlug);

            return (
              <Link
                key={p.id}
                href={`/blog/${slug}`}
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
      </div>
    </div>
  );
}
