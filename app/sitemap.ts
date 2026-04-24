import { prisma } from "@/lib/prisma";

export default async function sitemap() {
  const baseUrl = "https://nbcards.com";

  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true, publishedAt: true },
    take: 5000,
  });

  const cards = await prisma.card.findMany({
    select: { id: true, updatedAt: true },
    take: 5000,
  });

  const locales = ["en", "es"] as const;

const sports = ["pokemon", "soccer", "basketball", "nfl", "other"] as const;

const categoryUrls = locales.flatMap((l) =>
  sports.map((s) => ({
    url: `${baseUrl}/${l}/${s}`,
    lastModified: new Date(),
  }))
);

  const staticUrls = locales.flatMap((l) => [
    { url: `${baseUrl}/${l}`, lastModified: new Date() },
    { url: `${baseUrl}/${l}/blog`, lastModified: new Date() },
  ]);

  const postUrls = locales.flatMap((l) =>
    posts.map((p) => ({
      url: `${baseUrl}/${l}/blog/${encodeURIComponent(p.slug)}`,
      lastModified: p.publishedAt ?? new Date(),
    }))
  );

  const cardUrls = locales.flatMap((l) =>
    cards.map((c) => ({
      url: `${baseUrl}/${l}/cards/${encodeURIComponent(c.id)}`,
      lastModified: c.updatedAt ?? new Date(),
    }))
  );

  return [...staticUrls, ...categoryUrls, ...postUrls, ...cardUrls];
}