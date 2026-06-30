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

/**
 * Devuelve el día de la semana (0=domingo … 6=sábado) en zona del salón.
 * No usar `date.getDay()` directo: en runtimes UTC (Vercel) puede dar
 * el día equivocado para timestamps cerca de medianoche CR.
 */
export function salonDayOfWeek(iso?: string | Date): number {
  const date = iso
    ? typeof iso === "string" ? new Date(iso) : iso
    : new Date();
  // Intl devuelve nombres en inglés; mapeamos a 0-6
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TZ,
    weekday: "short"
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
  };
  return map[name] ?? 0;
}

/**
 * Devuelve los bounds ISO UTC de un día CR (start = 00:00 CR, end = 23:59:59.999 CR).
 * Útil para queries de DB filtradas por "el día de hoy en el salón".
 */
export function salonDayBounds(iso?: string | Date): { start: string; end: string } {
  const dayKey = salonDateKey(iso ?? new Date());
  return {
    start: new Date(`${dayKey}T00:00:00${SALON_TZ_OFFSET}`).toISOString(),
    end: new Date(`${dayKey}T23:59:59.999${SALON_TZ_OFFSET}`).toISOString()
  };
}

/**
 * Devuelve los bounds ISO UTC del rango: today/week/month/year en zona CR.
 * El "to" siempre es ahora (no fin del día) para no incluir futuro reciente
 * que aún no pasó. Usado en queries de finanzas.
 */
export function salonRangeBounds(
  range: "today" | "week" | "month" | "year"
): { from: string; to: string } {
  const now = new Date();
  const todayKey = salonDateKey(now);
  // mediodía CR del día actual — base segura
  const today = new Date(`${todayKey}T12:00:00${SALON_TZ_OFFSET}`);

  const to = now.toISOString();

  if (range === "today") {
    return {
      from: new Date(`${todayKey}T00:00:00${SALON_TZ_OFFSET}`).toISOString(),
      to
    };
  }
  if (range === "week") {
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const k = salonDateKey(sevenDaysAgo);
    return {
      from: new Date(`${k}T00:00:00${SALON_TZ_OFFSET}`).toISOString(),
      to
    };
  }
  if (range === "month") {
    // Primer día del mes CR actual
    const [y, m] = todayKey.split("-");
    return {
      from: new Date(`${y}-${m}-01T00:00:00${SALON_TZ_OFFSET}`).toISOString(),
      to
    };
  }
  // year
  const [y] = todayKey.split("-");
  return {
    from: new Date(`${y}-01-01T00:00:00${SALON_TZ_OFFSET}`).toISOString(),
    to
  };
}
