import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import MercadoPagoConfig, { Payment, MerchantOrder } from "mercadopago";

export const runtime = "nodejs";

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: Request) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ ok: false, error: "Missing MP_ACCESS_TOKEN" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));

    // MP suele mandar: { type: "payment", data: { id: "123" } }
    const type = String(body?.type ?? "");
    const dataId = body?.data?.id ?? body?.id;

    // Si no hay id, igual devolvemos OK para que MP no reintente infinito
    if (!dataId) return NextResponse.json({ ok: true });

    // 1) Si es payment => consulto pago real a MP
    if (type === "payment") {
      const paymentApi = new Payment(mp);
      const payment = await paymentApi.get({ id: String(dataId) });

      const paymentId = String(payment.id ?? "");
      const status = String(payment.status ?? "");
      const merchantOrderId = payment.order?.id ? String(payment.order.id) : null;

      // ✅ CLAVE: tu external_reference lo pusimos como order.id
      const orderId = payment.external_reference ? String(payment.external_reference) : null;

      if (!orderId) {
        return NextResponse.json({ ok: true });
      }

      // Aprobado => marco PAID
      if (status === "approved") {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            mpPaymentId: paymentId || null,
            mpMerchantOrderId: merchantOrderId || null,
          },
        });
      }

      // Rejected/cancelled => cancelo (opcional)
      if (status === "rejected" || status === "cancelled" || status === "refunded" || status === "charged_back") {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "CANCELLED",
            mpPaymentId: paymentId || null,
            mpMerchantOrderId: merchantOrderId || null,
          },
        });
      }

      return NextResponse.json({ ok: true });
    }

    // 2) A veces llega merchant_order => busco si alguna payment aprobó
    if (type === "merchant_order") {
      const moApi = new MerchantOrder(mp);
      const mo = await (moApi as any).get({ id: String(dataId) });


      // Busca si hay pagos aprobados
      const payments = Array.isArray(mo.payments) ? mo.payments : [];
      const approved = payments.find((p: any) => String(p.status) === "approved");

      // external_reference suele estar en merchant_order también
      const orderId = mo.external_reference ? String(mo.external_reference) : null;
      if (!orderId) return NextResponse.json({ ok: true });

      if (approved) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            mpMerchantOrderId: String(mo.id ?? ""),
            mpPaymentId: approved.id ? String(approved.id) : null,
          },
        });
      }

      return NextResponse.json({ ok: true });
    }

    // Otros tipos => OK
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("MP WEBHOOK ERROR:", e);
    // Igual devolvemos ok para evitar reintentos infinitos mientras probás
    return NextResponse.json({ ok: true });
  }
}
