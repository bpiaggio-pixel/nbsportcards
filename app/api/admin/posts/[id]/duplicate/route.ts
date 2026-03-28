import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthorized(req: Request) {
  const secret = req.headers.get("x-admin-secret") || "";
  return secret && secret === process.env.ADMIN_SECRET;
}

function makeCopySlug(slug: string) {
  return `${slug}-copy`;
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Missing ADMIN_SECRET in env" }, { status: 500 });
    }

    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const postId = String(id ?? "").trim();
    if (!postId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const original = await prisma.post.findUnique({
      where: { id: postId },
      select: {
  title: true,
  slug: true,
  locale: true,
  category: true,
  excerpt: true,
  coverImage: true,
  contentHtml: true,
  tags: {
          select: {
            tagId: true,
          },
        },
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let nextSlug = makeCopySlug(original.slug);
    let counter = 2;

    while (
      await prisma.post.findFirst({
        where: {
  slug: nextSlug,
  locale: original.locale,
  category: original.category,
},
        select: { id: true },
      })
    ) {
      nextSlug = `${makeCopySlug(original.slug)}-${counter}`;
      counter += 1;
    }

    const created = await prisma.post.create({
      data: {
  title: `${original.title} (Copy)`,
  slug: nextSlug,
  locale: original.locale,
  category: original.category,
  excerpt: original.excerpt,
  coverImage: original.coverImage,
  contentHtml: original.contentHtml,
        published: false,
        publishedAt: null,
        tags: {
          create: original.tags.map((t) => ({
            tag: { connect: { id: t.tagId } },
          })),
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ id: created.id });
  } catch (e: any) {
    console.error("ADMIN POSTS DUPLICATE ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}