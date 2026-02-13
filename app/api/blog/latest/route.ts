import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    // ⚠️ Ajustá el nombre del modelo/campos si tu schema usa otros
    const post = await prisma.post.findFirst({
  where: { published: true },
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
