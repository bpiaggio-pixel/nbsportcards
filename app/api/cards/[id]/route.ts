import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { id: string };
type Ctx = { params: Params | Promise<Params> };

export async function GET(_: Request, ctx: Ctx) {
  const { id } = await ctx.params; // ✅ unwrap params promise
  const decodedId = decodeURIComponent(id);

  const card = await prisma.card.findUnique({
    where: { id: decodedId },
  });

  return NextResponse.json({ card });
}