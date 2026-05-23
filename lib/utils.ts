import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCRC(amount: number): string {
  return `₡${amount.toLocaleString("es-CR")}`;
}

/**
 * Zona horaria del salón. Costa Rica no observa DST → siempre UTC-6.
 * Anclamos todos los formateos a esta zona para evitar que el servidor (UTC en
 * Vercel) o el cliente (cualquier país) muestren horas erróneas.
 */
export const SALON_TZ = "America/Costa_Rica";
export const SALON_TZ_OFFSET = "-06:00";

/**
 * Construye un ISO 8601 que representa "hour:minute en Costa Rica" para una
 * fecha de calendario dada. Independiente de la zona horaria del runtime.
 *
 * @example
 *   buildSalonISO(new Date("2026-05-25T00:00:00Z"), 10, 0)
 *   → "2026-05-25T16:00:00.000Z"  (10am CR = 16:00 UTC)
 */
export function buildSalonISO(day: Date, hour: number, minute: number): string {
  const year = day.getUTCFullYear();
  const month = String(day.getUTCMonth() + 1).padStart(2, "0");
  const dayN = String(day.getUTCDate()).padStart(2, "0");
  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return new Date(`${year}-${month}-${dayN}T${h}:${m}:00${SALON_TZ_OFFSET}`).toISOString();
}

/**
 * Formatea un ISO mostrando la hora en la zona del salón.
 * @example formatSalonTime("2026-05-25T16:00:00Z") → "10:00 AM"
 */
export function formatSalonTime(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

/**
 * Formatea un ISO mostrando la fecha (día/mes/año) en la zona del salón.
 * @example formatSalonDateLong("2026-05-25T16:00:00Z") → "lunes 25 de mayo de 2026"
 */
export function formatSalonDateLong(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("es-CR", {
    timeZone: SALON_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

/**
 * Formatea: "lunes 25 de mayo" (sin año).
 */
export function formatSalonDateMedium(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("es-CR", {
    timeZone: SALON_TZ,
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(date);
}

/**
 * Formatea: "lunes 25 de mayo a las 10:00 AM"
 */
export function formatSalonDateTimeFull(iso: string | Date): string {
  return `${formatSalonDateMedium(iso)} a las ${formatSalonTime(iso)}`;
}

/**
 * Devuelve la clave de día YYYY-MM-DD según la zona del salón.
 * Útil para agrupar reservas por fecha sin sesgo por la TZ del navegador.
 */
export function salonDateKey(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SALON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}
