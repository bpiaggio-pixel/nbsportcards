import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthorized(req: Request) {
  const secret = req.headers.get("x-admin-secret") || "";
  return secret && secret === process.env.ADMIN_SECRET;
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
    const orderId = String(body?.orderId ?? "").trim();
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "No podés entregar una orden CANCELLED" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED" },
    });

    return NextResponse.json({ ok: true, order: updated });
  } catch (e: any) {
    console.error("ADMIN DELIVER ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
