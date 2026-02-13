import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthorized(req: Request) {
  const secret = req.headers.get("x-admin-secret") || "";
  return secret && secret === process.env.ADMIN_SECRET;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Missing ADMIN_SECRET in env" }, { status: 500 });
    }

    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const postId = String(id ?? "").trim();
    if (!postId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        contentHtml: true,
        published: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ post });
  } catch (e: any) {
    console.error("ADMIN POSTS GET(id) ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Missing ADMIN_SECRET in env" }, { status: 500 });
    }

    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const postId = String(id ?? "").trim();
    if (!postId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));

    // Campos editables (todos opcionales)
    const data: any = {};

    if (body.title !== undefined) data.title = String(body.title ?? "").trim();
    if (body.slug !== undefined) data.slug = String(body.slug ?? "").trim();
    if (body.excerpt !== undefined) data.excerpt = String(body.excerpt ?? "").trim() || null;
    if (body.coverImage !== undefined) data.coverImage = String(body.coverImage ?? "").trim() || null;
    if (body.contentHtml !== undefined) data.contentHtml = String(body.contentHtml ?? "").trim();

    // publish toggle
    if (body.published !== undefined) {
      const next = !!body.published;
      data.published = next;
      data.publishedAt = next ? new Date() : null;
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data,
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: updated.id });
  } catch (e: any) {
    console.error("ADMIN POSTS PATCH ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Missing ADMIN_SECRET in env" }, { status: 500 });
    }

    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const postId = String(id ?? "").trim();
    if (!postId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.post.delete({ where: { id: postId } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("ADMIN POSTS DELETE ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
