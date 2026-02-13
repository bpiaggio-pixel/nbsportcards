import { prisma } from "@/lib/prisma";

export default async function sitemap() {
  const baseUrl = "https://nbcards.com";

  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true, publishedAt: true },
    take: 5000,
  });

  const locales = ["en", "es"] as const;

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

  return [...staticUrls, ...postUrls];
}
