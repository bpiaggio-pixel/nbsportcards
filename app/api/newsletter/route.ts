import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const NEWSLETTER_TO = "newsletter@nbcards.com";
const SUPPORT_TO = "support@nbcards.com";
const FROM = "NBCards Newsletter <newsletter@nbcards.com>";

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatSubscriberId() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SUB-${y}${m}${day}-${rand}`;
}

async function saveNewsletterFallback(payload: any) {
  console.log("[NEWSLETTER:SAVED]", payload);
}

function supportEmailHtml(args: {
  subscriberId: string;
  email: string;
  locale: "es" | "en";
}) {
  const { subscriberId, email, locale } = args;

  return `
  <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5; color:#111827;">
    <div style="max-width: 640px; margin: 0 auto; padding: 20px;">
      <h2 style="margin:0 0 10px;">
        ${locale === "es" ? "Nueva suscripción al newsletter" : "New newsletter subscription"}
      </h2>

      <div style="padding:12px 14px; border:1px solid #e5e7eb; border-radius:12px; background:#f9fafb;">
        <div><strong>ID:</strong> ${escapeHtml(subscriberId)}</div>
        <div><strong>Email:</strong> ${escapeHtml(email)}</div>
        <div><strong>Idioma:</strong> ${locale}</div>
      </div>
    </div>
  </div>`;
}

function userEmailHtml(args: {
  subscriberId: string;
  email: string;
  locale: "es" | "en";
}) {
  const { subscriberId, email, locale } = args;
  const isEs = locale === "es";

  return `
  <div style="margin:0; padding:0; background:#f3f4f6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px; max-width:640px;">
            <tr>
              <td style="padding:0 16px 12px;">
                <div style="padding:14px 16px; background:#0b1220; border-radius:16px; color:#fff; font-family: ui-sans-serif, system-ui;">
                  <div style="font-weight:800; font-size:18px;">NBCards</div>
                  <div style="color:#cbd5e1; font-size:12px; margin-top:4px;">nbcards.com</div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 16px;">
                <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:18px; padding:22px;">
                  <h1 style="margin:0; font-family: ui-sans-serif, system-ui; font-size:22px; line-height:1.25; color:#111827;">
                    ${isEs ? "¡Gracias por suscribirte!" : "Thanks for subscribing!"}
                  </h1>

                  <p style="margin:10px 0 0; font-family: ui-sans-serif, system-ui; font-size:14px; line-height:1.6; color:#6b7280;">
                    ${
                      isEs
                        ? "Te agregamos a nuestro newsletter para recibir novedades, lanzamientos y ofertas."
                        : "You have been added to our newsletter to receive updates, new arrivals, and special offers."
                    }
                  </p>

                  <div style="margin-top:16px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:14px; padding:12px 14px;">
                    <div style="font-family: ui-sans-serif, system-ui; font-size:13px; color:#111827;">
                      <strong>${isEs ? "ID de suscripción" : "Subscription ID"}:</strong> ${escapeHtml(subscriberId)}
                    </div>
                    <div style="margin-top:6px; font-family: ui-sans-serif, system-ui; font-size:13px; color:#111827;">
                      <strong>Email:</strong> ${escapeHtml(email)}
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 16px 0;">
                <div style="font-family: ui-sans-serif, system-ui; font-size:11px; color:#6b7280; text-align:center; line-height:1.6;">
                  © ${new Date().getFullYear()} NBCards. ${isEs ? "Todos los derechos reservados." : "All rights reserved."}
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

    const email = String(body?.email ?? "").trim().toLowerCase();
    const locale = (String(body?.locale ?? "es") === "en" ? "en" : "es") as "es" | "en";

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const subscriberId = formatSubscriberId();
    const createdAt = new Date().toISOString();

await saveNewsletterFallback({ subscriberId, createdAt, email, locale });

await resend.emails.send({
  from: FROM,
  to: NEWSLETTER_TO,
  subject: locale === "es" ? `📩 Nueva suscripción (${subscriberId})` : `📩 New subscription (${subscriberId})`,
  replyTo: email,
  html: supportEmailHtml({ subscriberId, email, locale }),
});

await resend.emails.send({
  from: FROM,
  to: email,
  subject: locale === "es" ? "Suscripción confirmada" : "Subscription confirmed",
  replyTo: SUPPORT_TO,
  html: userEmailHtml({ subscriberId, email, locale }),
});

return NextResponse.json({ ok: true, subscriberId });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}