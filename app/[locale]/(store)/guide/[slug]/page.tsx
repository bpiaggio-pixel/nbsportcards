import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  const decoded = decodeURIComponent(slug).trim();
  const loc = locale === "es" ? "es" : "en";

  const guide = await prisma.guide.findFirst({
    where: {
      published: true,
      slug: decoded,
      locale: loc,
    },
    select: {
      title: true,
      excerpt: true,
      coverImage: true,
    },
  });

  if (!guide) {
    return {
      title: "Guide not found",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: guide.title,
    description: guide.excerpt ?? "Collector guide",
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale?: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = locale === "es" ? "es" : "en";

  const decoded = decodeURIComponent(slug).trim();

  const guide = await prisma.guide.findFirst({
    where: {
      published: true,
      slug: decoded,
      locale: loc,
    },
  });

  if (!guide) return notFound();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <article className="mx-auto max-w-3xl px-6 py-12">
        <div className="text-sm text-gray-500">
          {guide.publishedAt
            ? new Date(guide.publishedAt).toLocaleDateString("en-US")
            : ""}
        </div>

        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
          {guide.title}
        </h1>

        {guide.excerpt && (
          <p className="mt-4 text-lg text-gray-600">{guide.excerpt}</p>
        )}

        {guide.coverImage && (
          <div className="mt-8 overflow-hidden rounded-3xl bg-gray-100">
            <img src={guide.coverImage} alt={guide.title} className="h-full w-full object-cover" />
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
          dangerouslySetInnerHTML={{ __html: guide.contentHtml ?? "" }}
        />
      </article>
    </div>
  );
}