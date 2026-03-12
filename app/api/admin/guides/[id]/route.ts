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
    const guideId = String(id ?? "").trim();
    if (!guideId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const guide = await prisma.guide.findUnique({
      where: { id: guideId },
      select: {
        id: true,
        slug: true,
        locale: true,
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

    if (!guide) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ guide });
  } catch (e: any) {
    console.error("ADMIN GUIDE GET(id) ERROR:", e);
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
    const guideId = String(id ?? "").trim();
    if (!guideId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const data: any = {};

    if (body.title !== undefined) data.title = String(body.title ?? "").trim();
    if (body.slug !== undefined) data.slug = String(body.slug ?? "").trim();

    if (body.locale !== undefined) {
      const locale = String(body.locale ?? "").trim().toLowerCase();
      if (!["en", "es"].includes(locale)) {
        return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
      }
      data.locale = locale;
    }

    if (body.excerpt !== undefined) data.excerpt = String(body.excerpt ?? "").trim() || null;
    if (body.coverImage !== undefined) data.coverImage = String(body.coverImage ?? "").trim() || null;
    if (body.contentHtml !== undefined) data.contentHtml = String(body.contentHtml ?? "").trim();

    if (body.published !== undefined) {
      const next = !!body.published;
      data.published = next;
      data.publishedAt = next ? new Date() : null;
    }

    const updated = await prisma.guide.update({
      where: { id: guideId },
      data,
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: updated.id });
  } catch (e: any) {
    console.error("ADMIN GUIDE PATCH ERROR:", e);
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
    const guideId = String(id ?? "").trim();
    if (!guideId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.guide.delete({
      where: { id: guideId },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("ADMIN GUIDE DELETE ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}