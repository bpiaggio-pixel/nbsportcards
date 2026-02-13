import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const orderId = String(body?.orderId ?? "").trim();
    const trackingCarrier = String(body?.trackingCarrier ?? "").trim();
    const trackingCode = String(body?.trackingCode ?? "").trim();
    const trackingUrl = String(body?.trackingUrl ?? "").trim();

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    if (!trackingCode) {
      return NextResponse.json({ error: "Missing trackingCode" }, { status: 400 });
    }

    // (opcional) podrías exigir carrier también
    // if (!trackingCarrier) ...

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingCarrier: trackingCarrier || null,
        trackingCode,
        trackingUrl: trackingUrl || null,
        shippedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, order: updated });
  } catch (e: any) {
    console.error("SHIP ORDER ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

