import { NextResponse } from "next/server";
import { Resend } from "resend";

// ✅ Config
const resend = new Resend(process.env.RESEND_API_KEY);

const SUPPORT_TO = "scrups84@hotmail.com";
const FROM = "NBCards Support <contact@nbcards.com>"; // ✅ tu dominio verificado

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTicketId() {
  // NB-YYYYMMDD-XXXXX
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `NB-${y}${m}${day}-${rand}`;
}

/**
 * ✅ Opción DB (sin setup extra): guardar en un archivo JSON en /tmp (serverless-friendly pero NO persistente).
 * Recomendado SOLO si no te importa perderlos (en serverless puede resetearse).
 *
 * Mejor: Prisma/DB real (abajo te dejo cómo).
 */
async function saveContactFallback(payload: any) {
  // No rompe si no querés DB todavía. Solo log.
  console.log("[CONTACT:SAVED]", payload);
}

/**
 * ✅ Plantilla para vos (soporte)
 */
function supportEmailHtml(args: {
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  orderId?: string;
}) {
  const { ticketId, name, email, subject, message, orderId } = args;

  const msg = escapeHtml(message).replace(/\n/g, "<br/>");
  return `
  <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5; color:#111827;">
    <div style="max-width: 640px; margin: 0 auto; padding: 20px;">
      <h2 style="margin:0 0 10px;">Nuevo mensaje de soporte</h2>

      <div style="padding:12px 14px; border:1px solid #e5e7eb; border-radius:12px; background:#f9fafb;">
        <div><strong>Ticket:</strong> ${escapeHtml(ticketId)}</div>
        <div><strong>Nombre:</strong> ${escapeHtml(name)}</div>
        <div><strong>Email:</strong> ${escapeHtml(email)}</div>
        ${orderId ? `<div><strong>Pedido:</strong> ${escapeHtml(orderId)}</div>` : ""}
        <div><strong>Asunto:</strong> ${escapeHtml(subject)}</div>
      </div>

      <h3 style="margin:18px 0 8px;">Mensaje</h3>
      <div style="padding:14px; border:1px solid #e5e7eb; border-radius:12px;">
        ${msg}
      </div>

      <p style="margin:18px 0 0; color:#6b7280; font-size:12px;">
        Responder a este email le responde directo al cliente (reply-to).
      </p>
    </div>
  </div>`;
}

/**
 * ✅ Plantilla para el usuario (confirmación)
 */
function userEmailHtml(args: {
  ticketId: string;
  name: string;
  subject: string;
  message: string;
  locale: "es" | "en";
}) {
  const { ticketId, name, subject, message, locale } = args;
  const isEs = locale === "es";
  const msg = escapeHtml(message).replace(/\n/g, "<br/>");

    return `
  <div style="margin:0; padding:0; background:#f3f4f6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px; max-width:640px;">

            <!-- Header -->
            <tr>
              <td style="padding:0 16px 12px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:14px 16px; background:#0b1220; border-radius:16px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="vertical-align:middle;">
                            <img
                              src="https://nbcards.com/email-logo.png"
                              alt="NBCards"
                              width="44"
                              height="44"
                              style="display:block; border-radius:12px; background:#ffffff;"
                            />
                          </td>

                          <td style="vertical-align:middle; padding-left:12px;">
                            <div style="font-family: ui-sans-serif, system-ui; color:#ffffff; font-weight:800; font-size:18px; line-height:1;">
                              NBCards
                            </div>
                            <div style="font-family: ui-sans-serif, system-ui; color:#cbd5e1; font-size:12px; margin-top:4px;">
                              nbcards.com
                            </div>
                          </td>

                          <td align="right" style="vertical-align:middle;">
                            <div style="font-family: ui-sans-serif, system-ui; color:#93c5fd; font-size:12px; font-weight:700;">
                              ${isEs ? "Ticket" : "Ticket"}: ${escapeHtml(ticketId)}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:0 16px;">
                <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:18px; padding:22px;">
                  <h1 style="margin:0; font-family: ui-sans-serif, system-ui; font-size:22px; line-height:1.25; color:#111827;">
                    ${isEs ? "Recibimos tu mensaje" : "We received your message"}
                  </h1>

                  <p style="margin:8px 0 0; font-family: ui-sans-serif, system-ui; font-size:14px; line-height:1.6; color:#6b7280;">
                    ${isEs
                      ? "Gracias por escribirnos. Te responderemos lo antes posible."
                      : "Thanks for reaching out. We’ll get back to you as soon as possible."}
                  </p>

                  <!-- Ticket + Subject -->
                  <div style="margin-top:14px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:14px; padding:12px 14px;">
                    <div style="font-family: ui-sans-serif, system-ui; font-size:13px; color:#111827;">
                      <strong>${isEs ? "Ticket" : "Ticket"}:</strong> ${escapeHtml(ticketId)}
                    </div>
                    <div style="margin-top:6px; font-family: ui-sans-serif, system-ui; font-size:13px; color:#111827;">
                      <strong>${isEs ? "Asunto" : "Subject"}:</strong> ${escapeHtml(subject)}
                    </div>
                  </div>

                  <!-- Message -->
                  <h2 style="margin:18px 0 8px; font-family: ui-sans-serif, system-ui; font-size:16px; color:#111827;">
                    ${isEs ? "Tu mensaje" : "Your message"}
                  </h2>

                  <div style="border:1px solid #e5e7eb; border-radius:14px; padding:14px; font-family: ui-sans-serif, system-ui; font-size:14px; line-height:1.6; color:#111827;">
                    ${msg}
                  </div>

                  <!-- Hint -->
                  <p style="margin:16px 0 0; font-family: ui-sans-serif, system-ui; font-size:12px; line-height:1.6; color:#6b7280;">
                    ${isEs
                      ? `Si necesitás agregar información, respondé a este email e incluí tu ticket: <strong>${escapeHtml(ticketId)}</strong>.`
                      : `If you need to add details, reply to this email and include your ticket: <strong>${escapeHtml(ticketId)}</strong>.`}
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:14px 16px 0;">
                <div style="font-family: ui-sans-serif, system-ui; font-size:11px; color:#6b7280; text-align:center; line-height:1.6;">
                  © ${new Date().getFullYear()} NBCards. ${isEs ? "Todos los derechos reservados." : "All rights reserved."}<br/>
                  ${isEs ? "Este email fue enviado automáticamente." : "This email was sent automatically."}
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const subject = String(body?.subject ?? "").trim();
    const message = String(body?.message ?? "").trim();
    const orderId = String(body?.orderId ?? "").trim() || undefined; // opcional
    const locale = (String(body?.locale ?? "es") === "en" ? "en" : "es") as "es" | "en";

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const ticketId = formatTicketId();
    const createdAt = new Date().toISOString();

    // ✅ Guardado (por ahora log; abajo te explico Prisma)
    await saveContactFallback({ ticketId, createdAt, name, email, subject, message, orderId, locale });

    // ✅ 1) Email a soporte (vos)
    await resend.emails.send({
      from: FROM,
      to: SUPPORT_TO,
      subject: `🆘 [${ticketId}] ${subject}`,
      replyTo: email, // clave: al responder, le respondés al cliente
      html: supportEmailHtml({ ticketId, name, email, subject, message, orderId }),
    });

    // ✅ 2) Email al usuario (confirmación)
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: locale === "es" ? `Recibimos tu mensaje (${ticketId})` : `We received your message (${ticketId})`,
      replyTo: SUPPORT_TO, // si el cliente responde, te llega a vos
      html: userEmailHtml({ ticketId, name, subject, message, locale }),
    });

    return NextResponse.json({ ok: true, ticketId });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}