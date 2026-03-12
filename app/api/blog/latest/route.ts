import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = (searchParams.get("locale") ?? "en").trim();

    const post = await prisma.post.findFirst({
      where: {
        published: true,
        locale,
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
      },
    });

    return NextResponse.json({ post: post ?? null });
  } catch (e: any) {
    console.error("BLOG LATEST ERROR:", e);
    return NextResponse.json({ post: null }, { status: 200 });
  }
}