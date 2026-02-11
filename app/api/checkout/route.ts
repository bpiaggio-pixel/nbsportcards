import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

import MercadoPagoConfig, { Preference } from "mercadopago";

export const runtime = "nodejs";

// ✅ normaliza ids ("Card-011" -> "11")
const normId = (v: any) => {
  const s = String(v ?? "").trim();
  const m = s.match(/\d+/);
  return m ? String(parseInt(m[0], 10)) : s;
};

function getSiteUrl() {
  // en local: http://localhost:3000
  // en prod: https://tudominio.com
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return url.replace(/\/$/, "");
}

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: Request) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Falta MP_ACCESS_TOKEN en .env" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const userId = String(body?.userId ?? "").trim();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1) Traigo carrito
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 2) Leo Excel
    const filePath = path.join(process.cwd(), "data", "cards.xlsx");
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });

    // Mapa id -> rowIndex, stock, title, price, image
    const byId = new Map<
      string,
      { idx: number; stock: number; title: string; price: number; image?: string }
    >();

    rows.forEach((r, idx) => {
      const id = normId(r.id);
      if (!id) return;

      const stock = Math.max(0, Math.floor(Number(r.stock ?? 0)));
      const title = String(r.title ?? id).trim() || id;
      const price = Number(r.price ?? 0);
      const image = String(r.image ?? "").trim() || undefined;

      byId.set(id, { idx, stock, title, price, image });
    });

    // 3) Validación de stock (antes de tocar nada)
    for (const it of cartItems) {
      const id = normId(it.cardId);
      const need = Math.max(1, Number(it.qty ?? 1));
      const found = byId.get(id);

      if (!found) {
        return NextResponse.json(
          { error: `La card ${id} no existe en el Excel` },
          { status: 400 }
        );
      }

      if (found.stock < need) {
        return NextResponse.json(
          {
            error: `Sin stock suficiente para "${found.title}" (stock ${found.stock}, pediste ${need})`,
          },
          { status: 400 }
        );
      }
    }

    // 4) Armo items con precio real + calculo total
    const orderItems = cartItems.map((it) => {
      const id = normId(it.cardId);
      const qty = Math.max(1, Number(it.qty ?? 1));
      const found = byId.get(id)!;

      const unitCents = Math.round(Number(found.price ?? 0) * 100);

      return {
        cardId: id,
        title: found.title,
        unitCents,
        qty,
      };
    });

    const totalCents = orderItems.reduce(
      (acc, it) => acc + it.unitCents * it.qty,
      0
    );

    // 5) Crear orden en DB
    const order = await prisma.order.create({
      data: {
        userId,
        totalCents,
        currency: "USD",
        status: "PENDING",
        items: { create: orderItems },
      },
      include: { items: true },
    });

    // 6) Descuento stock en Excel (RESERVA al iniciar checkout)
    // (si preferís descontar solo cuando se paga, te lo cambio luego)
    for (const it of cartItems) {
      const id = normId(it.cardId);
      const need = Math.max(1, Number(it.qty ?? 1));
      const found = byId.get(id)!;

      const nextStock = found.stock - need;
      found.stock = nextStock;

      rows[found.idx].stock = nextStock;
      rows[found.idx].id = id;
    }

    // Guardar Excel
    const newSheet = XLSX.utils.json_to_sheet(rows);
    workbook.Sheets[sheetName] = newSheet;
    const out = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    fs.writeFileSync(filePath, out);

    // 7) Crear preferencia en MercadoPago
    const siteUrl = getSiteUrl();

    const pref = new Preference(mp);
    const preference = await pref.create({
      body: {
        items: orderItems.map((it) => ({
          id: it.cardId,
          title: it.title,
          quantity: it.qty,
          unit_price: Number((it.unitCents / 100).toFixed(2)),
          currency_id: "USD",
        })),

        external_reference: order.id, // ✅ CLAVE: el webhook lo usa para marcar PAID
        notification_url: `${siteUrl}/api/mercadopago/webhook`,

        back_urls: {
          success: `${siteUrl}/orders?status=success`,
          pending: `${siteUrl}/orders?status=pending`,
          failure: `${siteUrl}/orders?status=failure`,
        },
        auto_return: "approved",
      },
    });

    const mpPreferenceId = String(preference.id ?? "");

    // 8) Guardar mpPreferenceId en la orden
    await prisma.order.update({
      where: { id: order.id },
      data: { mpPreferenceId },
    });

    // 9) Vaciar carrito (opcional, pero en tu flujo es mejor así)
    await prisma.cartItem.deleteMany({ where: { userId } });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      mp: {
        preferenceId: mpPreferenceId,
        initPoint: preference.init_point,
      },
    });
  } catch (e: any) {
    console.error("CHECKOUT ERROR:", e);
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
