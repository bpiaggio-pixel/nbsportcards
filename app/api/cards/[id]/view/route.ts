import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // ✅ params ahora es Promise
) {
  const { id } = await ctx.params;          // ✅ unwrap
  const decodedId = decodeURIComponent(id);

  // ✅ updateMany no tira P2025; podés devolver 404 si no existe
  const result = await prisma.card.updateMany({
    where: { id: decodedId },
    data: { views: { increment: 1 } },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}