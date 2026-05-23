import { addMinutes, format, parseISO, startOfDay, endOfDay } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { BusinessHours, BlockedSlot, Booking } from "@/lib/supabase/types";

export type PublicSlot = {
  time: string; // "09:00"
  iso: string;
  period: "mañana" | "tarde" | "noche";
  available: boolean;
};

function buildPeriodSlots(
  day: Date,
  open: string | null,
  close: string | null,
  period: PublicSlot["period"],
  slotMinutes: number
): Omit<PublicSlot, "available">[] {
  if (!open || !close) return [];
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const start = new Date(day);
  start.setHours(oh, om ?? 0, 0, 0);
  const end = new Date(day);
  end.setHours(ch, cm ?? 0, 0, 0);

  const slots: Omit<PublicSlot, "available">[] = [];
  let cursor = start;
  while (cursor < end) {
    slots.push({
      time: format(cursor, "HH:mm"),
      iso: cursor.toISOString(),
      period
    });
    cursor = addMinutes(cursor, slotMinutes);
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
  const dayOfWeek = date.getDay();

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

  // Bloqueos solapados con el día
  const dayStart = startOfDay(date).toISOString();
  const dayEnd = endOfDay(date).toISOString();
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
    return { ...slot, available: !inPast && !conflict };
  });
}
