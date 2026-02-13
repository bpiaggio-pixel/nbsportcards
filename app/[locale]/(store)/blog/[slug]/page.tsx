import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const incoming = String(slug ?? "");
  const decoded = decodeURIComponent(incoming).trim();

  if (!decoded) return notFound();

  const post = await prisma.post.findFirst({
    where: {
      published: true,
      slug: decoded,
    },
    select: {
      title: true,
      coverImage: true,
      excerpt: true,
      contentHtml: true,
      published: true,
      publishedAt: true,
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  });

  if (!post) return notFound();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <article className="mx-auto max-w-3xl px-6 py-12">
        <div className="text-sm text-gray-500">
          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US") : ""}
        </div>

        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">{post.title}</h1>
        {post.excerpt && <p className="mt-4 text-lg text-gray-600">{post.excerpt}</p>}

        {post.coverImage && (
          <div className="mt-8 overflow-hidden rounded-3xl bg-gray-100">
            <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span
              key={t.tag.slug}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
            >
              {t.tag.name}
            </span>
          ))}
        </div>

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
    </div>
  );
}
