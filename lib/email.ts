import { Resend } from "resend";
import { formatSalonDateTimeFull, formatCRC } from "@/lib/utils";

/**
 * Envío de notificaciones por correo a Tasha cuando hay nueva reserva.
 *
 * Estado actual: Sin dominio propio, Resend solo permite enviar al email
 * del titular de la cuenta (anti-spam). Por eso por ahora solo notificamos
 * a Tasha. Cuando registremos beautytashasalon.com (tarea #23), agregamos
 * confirmaciones al cliente con branding BT.
 *
 * Env vars:
 *  - RESEND_API_KEY
 *  - OWNER_NOTIFICATION_EMAIL (destinatario, ej. beautytashasalon@gmail.com)
 */

const PUBLIC_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://beautytashasalon.vercel.app";

function hasEmailConfig(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.OWNER_NOTIFICATION_EMAIL);
}

export type NewBookingEmailPayload = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceName: string;
  totalPrice: number;
  durationMinutes: number;
  startISO: string;
  notes?: string | null;
  hasGoogleEvent: boolean;
};

/**
 * Notifica a Tasha que hay una nueva reserva.
 * No bloquea si falla — loguea y sigue.
 */
export async function sendNewBookingNotification(
  payload: NewBookingEmailPayload
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!hasEmailConfig()) {
    console.warn("[email:newBooking] RESEND_API_KEY u OWNER_NOTIFICATION_EMAIL no configurados");
    return { ok: false, error: "missing-config" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.OWNER_NOTIFICATION_EMAIL as string;

  const dateLabel = formatSalonDateTimeFull(payload.startISO);
  const subject = `🗓️ Nueva cita — ${payload.customerName} — ${dateLabel}`;

  const calendarWarning = payload.hasGoogleEvent
    ? ""
    : `<div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:12px;padding:14px 18px;margin:18px 0;color:#92400E;font-size:14px;">
         ⚠️ <strong>Atención:</strong> No se pudo crear el evento en Google Calendar.
         La cita está guardada en el sistema pero el cliente NO recibió invitación.
         Revisalo manualmente.
       </div>`;

  const notesBlock = payload.notes
    ? `<tr><td style="padding:6px 0;color:#6B7280;font-size:13px;">Notas del cliente</td><td style="padding:6px 0;color:#1F2937;font-size:14px;">${escapeHtml(payload.notes)}</td></tr>`
    : "";

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#F5F3FF;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3FF;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(168,107,255,0.12);">
        <tr>
          <td style="background:linear-gradient(135deg,#C89EFF 0%,#8B5CF6 100%);padding:28px 32px;color:#FFFFFF;">
            <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:0.85;">Beauty Tasha Salón</p>
            <h1 style="margin:6px 0 0;font-family:Georgia,serif;font-size:26px;font-weight:600;">Nueva reserva confirmada</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            ${calendarWarning}
            <h2 style="margin:0 0 8px;font-family:Georgia,serif;color:#1F2937;font-size:20px;">${escapeHtml(payload.customerName)}</h2>
            <p style="margin:0 0 20px;color:#6B7280;font-size:14px;">${escapeHtml(payload.serviceName)}</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #F3E8FF;border-bottom:1px solid #F3E8FF;margin:16px 0 24px;">
              <tr>
                <td style="padding:14px 0;color:#6B7280;font-size:13px;width:40%;">Fecha y hora</td>
                <td style="padding:14px 0;color:#1F2937;font-size:14px;font-weight:600;text-transform:capitalize;">${dateLabel}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6B7280;font-size:13px;">Duración</td>
                <td style="padding:6px 0;color:#1F2937;font-size:14px;">${payload.durationMinutes} minutos</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6B7280;font-size:13px;">Monto</td>
                <td style="padding:6px 0;color:#7C3AED;font-size:16px;font-weight:600;">${formatCRC(payload.totalPrice)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6B7280;font-size:13px;">Teléfono</td>
                <td style="padding:6px 0;color:#1F2937;font-size:14px;">
                  <a href="tel:${escapeHtml(payload.customerPhone)}" style="color:#7C3AED;text-decoration:none;">${escapeHtml(payload.customerPhone)}</a>
                  &nbsp;·&nbsp;
                  <a href="https://wa.me/${payload.customerPhone.replace(/\D/g, "")}" style="color:#22C55E;text-decoration:none;">WhatsApp</a>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6B7280;font-size:13px;">Email</td>
                <td style="padding:6px 0;color:#1F2937;font-size:14px;">
                  <a href="mailto:${escapeHtml(payload.customerEmail)}" style="color:#7C3AED;text-decoration:none;">${escapeHtml(payload.customerEmail)}</a>
                </td>
              </tr>
              ${notesBlock}
            </table>

            <a href="${PUBLIC_URL}/admin/citas" style="display:inline-block;background:linear-gradient(135deg,#C89EFF 0%,#8B5CF6 100%);color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">Ver en panel admin →</a>

            <p style="margin:28px 0 0;color:#9CA3AF;font-size:11px;line-height:1.6;">
              Este correo se envía automáticamente cuando alguien reserva en beautytashasalon.vercel.app.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `Nueva reserva — ${payload.customerName}`,
    payload.hasGoogleEvent ? "" : "⚠️ ATENCIÓN: no se creó evento en Google Calendar, revisá manualmente.",
    ``,
    `Servicio: ${payload.serviceName}`,
    `Fecha: ${dateLabel}`,
    `Duración: ${payload.durationMinutes} min`,
    `Monto: ${formatCRC(payload.totalPrice)}`,
    ``,
    `Cliente: ${payload.customerName}`,
    `Tel: ${payload.customerPhone}`,
    `Email: ${payload.customerEmail}`,
    payload.notes ? `Notas: ${payload.notes}` : "",
    ``,
    `Ver en admin: ${PUBLIC_URL}/admin/citas`
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await resend.emails.send({
      from: "Beauty Tasha Salón <onboarding@resend.dev>",
      to,
      subject,
      html,
      text
    });
    if (res.error) {
      console.error("[email:newBooking]", res.error);
      return { ok: false, error: res.error.message };
    }
    return { ok: true, id: res.data?.id };
  } catch (err) {
    console.error("[email:newBooking:exception]", err);
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
