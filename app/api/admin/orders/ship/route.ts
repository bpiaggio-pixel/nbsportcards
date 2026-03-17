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
    const shipmentId = String(body?.shipmentId ?? "").trim();
    const trackingCarrier = String(body?.trackingCarrier ?? "").trim();
    const trackingCode = String(body?.trackingCode ?? "").trim();
    const trackingUrl = String(body?.trackingUrl ?? "").trim();

    if (!shipmentId) {
      return NextResponse.json({ error: "Missing shipmentId" }, { status: 400 });
    }

    if (!trackingCode) {
      return NextResponse.json({ error: "Missing trackingCode" }, { status: 400 });
    }

    const shipment = await prisma.orderShipment.findUnique({
      where: { id: shipmentId },
      select: {
        id: true,
        orderId: true,
        status: true,
        order: { select: { status: true } },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    if (shipment.order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "No podés enviar un shipment de una orden CANCELLED" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedShipment = await tx.orderShipment.update({
        where: { id: shipmentId },
        data: {
          trackingCarrier: trackingCarrier || null,
          trackingCode,
          trackingUrl: trackingUrl || null,
          shippedAt: new Date(),
          status: "SHIPPED",
        },
      });

      await tx.order.update({
        where: { id: shipment.orderId },
        data: {
          status: "SHIPPED",
        },
      });

      return updatedShipment;
    });

    return NextResponse.json({ ok: true, shipment: result });
  } catch (e: any) {
    console.error("ADMIN SHIP ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}