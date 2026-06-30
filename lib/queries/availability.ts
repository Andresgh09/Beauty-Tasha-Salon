import { addMinutes, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { buildSalonISO, salonDayOfWeek, salonDayBounds } from "@/lib/utils";
import type { BusinessHours, BlockedSlot, Booking } from "@/lib/supabase/types";

export type PublicSlot = {
  time: string; // "09:00" (hora del salón, no del servidor)
  iso: string; // ISO UTC correctamente convertido desde la zona del salón
  period: "mañana" | "tarde" | "noche";
  available: boolean;
};

type CandidateSlot = Omit<PublicSlot, "available"> & { periodCloseISO: string };

function buildPeriodSlots(
  day: Date,
  open: string | null,
  close: string | null,
  period: PublicSlot["period"],
  slotMinutes: number
): CandidateSlot[] {
  if (!open || !close) return [];
  const [oh, om = 0] = open.split(":").map(Number);
  const [ch, cm = 0] = close.split(":").map(Number);

  const periodCloseISO = buildSalonISO(day, ch, cm);

  const slots: CandidateSlot[] = [];
  let h = oh;
  let m = om;
  while (h < ch || (h === ch && m < cm)) {
    slots.push({
      time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      iso: buildSalonISO(day, h, m),
      period,
      periodCloseISO
    });
    m += slotMinutes;
    while (m >= 60) {
      h += 1;
      m -= 60;
    }
  }
  return slots;
}

/**
 * Calcula los slots disponibles para una fecha y servicio
 * combinando: business_hours + blocked_slots + bookings.
 */
export async function getPublicAvailableSlots(
  date: Date,
  durationMinutes: number
): Promise<PublicSlot[]> {
  const supabase = createClient();
  // Día de la semana en zona CR — no usar date.getDay() (server-TZ).
  const dayOfWeek = salonDayOfWeek(date);

  // Business hours del día
  const { data: hours } = await supabase
    .from("business_hours")
    .select("*")
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  if (!hours || !hours.is_open) {
    return [];
  }

  const h = hours as BusinessHours;
  const slotMin = h.slot_duration_minutes ?? 30;

  const candidates = [
    ...buildPeriodSlots(date, h.morning_open, h.morning_close, "mañana", slotMin),
    ...buildPeriodSlots(date, h.afternoon_open, h.afternoon_close, "tarde", slotMin),
    ...buildPeriodSlots(date, h.evening_open, h.evening_close, "noche", slotMin)
  ];

  if (candidates.length === 0) return [];

  // Bloqueos solapados con el día CR (no UTC del server).
  const { start: dayStart, end: dayEnd } = salonDayBounds(date);
  const [{ data: blocks }, { data: bookings }] = await Promise.all([
    supabase
      .from("blocked_slots")
      .select("*")
      .lte("starts_at", dayEnd)
      .gte("ends_at", dayStart),
    supabase
      .from("bookings")
      .select("*")
      .in("status", ["pending", "confirmed", "completed"])
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd)
  ]);

  const busy: { start: Date; end: Date }[] = [];

  (blocks ?? []).forEach((b: BlockedSlot) => {
    busy.push({ start: parseISO(b.starts_at), end: parseISO(b.ends_at) });
  });

  (bookings ?? []).forEach((b: Booking) => {
    const start = parseISO(b.starts_at);
    busy.push({ start, end: addMinutes(start, b.duration_minutes) });
  });

  // No permitir slots en el pasado
  const now = new Date();

  return candidates.map((slot) => {
    const slotStart = parseISO(slot.iso);
    const slotEnd = addMinutes(slotStart, durationMinutes);
    const inPast = slotStart < now;
    const conflict = busy.some((b) => slotStart < b.end && slotEnd > b.start);
    // El servicio debe terminar antes o justo cuando cierra el período
    // (mañana/tarde/noche). Sin esto, un servicio de 2h a las 18:00 podría
    // agendarse aunque el salón cierre 19:00.
    const overflowsClose = slotEnd > parseISO(slot.periodCloseISO);
    const { periodCloseISO: _omit, ...publicSlot } = slot;
    return {
      ...publicSlot,
      available: !inPast && !conflict && !overflowsClose
    };
  });
}
