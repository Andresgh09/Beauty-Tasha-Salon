import { google } from "googleapis";
import { addMinutes, parseISO } from "date-fns";

/**
 * Integración con Google Calendar API vía OAuth 2.0.
 *
 * Auth flow:
 *  - Una vez se obtuvo el refresh_token vía scripts/google-auth.js
 *  - Lo guardamos en env vars
 *  - El SDK auto-renueva el access_token usando el refresh_token
 *
 * Env vars requeridas:
 *  - GOOGLE_OAUTH_CLIENT_ID
 *  - GOOGLE_OAUTH_CLIENT_SECRET
 *  - GOOGLE_OAUTH_REFRESH_TOKEN
 *  - GOOGLE_CALENDAR_ID (default: "primary")
 *  - SALON_TIMEZONE (default: "America/Costa_Rica")
 */

const TIMEZONE = process.env.SALON_TIMEZONE ?? "America/Costa_Rica";
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? "primary";

function hasCredentials() {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
      process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  );
}

function getCalendar() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export type BookingPayload = {
  serviceName: string;
  serviceId: string;
  price: number;
  durationMinutes: number;
  startISO: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    notes?: string;
  };
};

/**
 * Crea un evento en el calendario de Tasha.
 * Si las credenciales no están configuradas, no hace nada (no throwear).
 */
export async function createBooking(
  payload: BookingPayload
): Promise<{ eventId: string | null; htmlLink: string | null }> {
  if (!hasCredentials()) {
    return { eventId: null, htmlLink: null };
  }

  const calendar = getCalendar();
  const start = parseISO(payload.startISO);
  const end = addMinutes(start, payload.durationMinutes);

  const event = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary: `${payload.serviceName} — ${payload.customer.name}`,
      description: [
        `Servicio: ${payload.serviceName}`,
        `Precio: ₡${payload.price.toLocaleString("es-CR")}`,
        `Duración: ${payload.durationMinutes} min`,
        ``,
        `Cliente: ${payload.customer.name}`,
        `Teléfono: ${payload.customer.phone}`,
        `Email: ${payload.customer.email}`,
        payload.customer.notes ? `\nNotas:\n${payload.customer.notes}` : ""
      ].join("\n"),
      start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
      end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
      attendees: [
        { email: payload.customer.email, displayName: payload.customer.name }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 60 }
        ]
      }
    },
    sendUpdates: "all"
  });

  return {
    eventId: event.data.id ?? null,
    htmlLink: event.data.htmlLink ?? null
  };
}

/**
 * Cancela (borra) un evento del calendario por su ID.
 * Útil cuando se cancela una cita desde el admin.
 */
export async function cancelBooking(eventId: string): Promise<boolean> {
  if (!hasCredentials()) return false;
  try {
    const calendar = getCalendar();
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId,
      sendUpdates: "all"
    });
    return true;
  } catch (e) {
    console.error("[gcal:cancel]", e);
    return false;
  }
}
