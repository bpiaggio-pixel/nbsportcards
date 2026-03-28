import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/navigation";
import { prisma } from "@/lib/prisma";
import BackToTopButton from "@/components/blog/BackToTopButton";

const ALLOWED_CATEGORIES = ["pokemon", "soccer", "basketball", "nfl"] as const;

function isValidCategory(value: string) {
  return ALLOWED_CATEGORIES.includes(value as (typeof ALLOWED_CATEGORIES)[number]);
}

function categoryTitle(category: string) {
  switch (category) {
    case "pokemon":
      return "Pokemon";
    case "soccer":
      return "Soccer";
    case "basketball":
      return "Basketball";
    case "nfl":
      return "NFL";
    default:
      return category;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, category, slug } = await params;

  if (!["en", "es"].includes(locale) || !isValidCategory(category)) {
    return {};
  }

  const post = await prisma.post.findFirst({
    where: { published: true, slug, locale, category },
    select: { title: true, excerpt: true, coverImage: true },
  });

  if (!post) return {};

  const path = `/${locale}/blog/${category}/${slug}`;

  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: "article",
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
      url: `https://nbcards.com${path}`,
    },
    alternates: {
      canonical: `https://nbcards.com${path}`,
      languages: {
        en: `https://nbcards.com/en/blog/${category}/${slug}`,
        es: `https://nbcards.com/es/blog/${category}/${slug}`,
      },
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}) {
  const { locale, category, slug } = await params;

  if (!["en", "es"].includes(locale) || !isValidCategory(category)) {
    notFound();
  }

  const post = await prisma.post.findFirst({
    where: { published: true, slug, locale, category },
    select: {
      title: true,
      excerpt: true,
      coverImage: true,
      contentHtml: true,
      publishedAt: true,
      createdAt: true,
      category: true,
    },
  });

  if (!post) notFound();

  const date = post.publishedAt ?? post.createdAt;
  const fmt = new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

return (
  <div className="min-h-screen bg-white text-gray-900">
    <article className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6">
        <Link
          href={`/blog/${category}`}
          locale={locale}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-sky-400 hover:bg-sky-100"
        >
          ← {locale === "es" ? "Volver" : "Back"}
        </Link>
      </div>

      <div className="mb-6 text-sm text-gray-500">
        <Link href="/blog" locale={locale} className="hover:underline">
          Blog
        </Link>{" "}
        /{" "}
        <Link href={`/blog/${category}`} locale={locale} className="hover:underline">
          {categoryTitle(category)}
        </Link>
      </div>

      <header className="mb-8">
        <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-sky-500/90">
          {categoryTitle(post.category)}
        </div>
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{post.title}</h1>
        {post.excerpt ? <p className="mt-4 text-lg text-gray-600">{post.excerpt}</p> : null}
        <div className="mt-4 text-sm text-gray-500">{fmt.format(date)}</div>
      </header>

{post.coverImage && (
  <div className="mt-8 overflow-hidden rounded-3xl bg-gray-100">
    <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
  </div>
)}

<div
  className="
    mt-12
    text-[15px] leading-7 text-gray-900
    [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-3
    [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-2
    [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:my-4
    [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:my-4
    [&>p]:my-3
    [&_a]:text-blue-600 [&_a]:underline
    [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-4
  "
  dangerouslySetInnerHTML={{ __html: post.contentHtml ?? "" }}
/>
    </article>

    <BackToTopButton />
  </div>
);
}