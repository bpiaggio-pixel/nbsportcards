import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthorized(req: Request) {
  const secret = req.headers.get("x-admin-secret") || "";
  return secret && secret === process.env.ADMIN_SECRET;
}

export async function GET(req: Request) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Missing ADMIN_SECRET in env" }, { status: 500 });
    }

    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        published: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ posts });
  } catch (e: any) {
    console.error("ADMIN POSTS GET ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Missing ADMIN_SECRET in env" }, { status: 500 });
    }

    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = String(body?.title ?? "").trim();
    const slug = String(body?.slug ?? "").trim();
    const excerpt = String(body?.excerpt ?? "").trim() || null;
    const coverImage = String(body?.coverImage ?? "").trim() || null;
    const contentHtml = String(body?.contentHtml ?? "").trim();

    if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 });
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    if (!contentHtml) return NextResponse.json({ error: "Missing contentHtml" }, { status: 400 });

    const created = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt,
        coverImage,
        contentHtml,
        published: false,
        publishedAt: null,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: created.id });
  } catch (e: any) {
    console.error("ADMIN POSTS POST ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
