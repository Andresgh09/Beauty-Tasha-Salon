"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { cancelBooking as cancelGoogleEvent } from "@/lib/google-calendar";
import type { Booking, BookingStatus } from "@/lib/supabase/types";

async function requireAuth() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

export type BookingFilter = "today" | "upcoming" | "week" | "month" | "past" | "all";

export async function getBookings(
  filter: BookingFilter = "upcoming",
  status?: BookingStatus
): Promise<Booking[]> {
  const supabase = await requireAuth();
  let query = supabase
    .from("bookings")
    .select("*")
    .order("starts_at", { ascending: filter === "past" ? false : true });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  if (filter === "today") {
    query = query
      .gte("starts_at", todayStart.toISOString())
      .lt("starts_at", todayEnd.toISOString());
  } else if (filter === "upcoming") {
    query = query.gte("starts_at", now.toISOString()).limit(50);
  } else if (filter === "week") {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    query = query
      .gte("starts_at", now.toISOString())
      .lte("starts_at", weekEnd.toISOString());
  } else if (filter === "month") {
    const monthEnd = new Date(now);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    query = query
      .gte("starts_at", now.toISOString())
      .lte("starts_at", monthEnd.toISOString());
  } else if (filter === "past") {
    query = query.lt("starts_at", now.toISOString()).limit(50);
  }

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    console.error("[getBookings]", error);
    return [];
  }
  return (data ?? []) as Booking[];
}

const UpdateBookingSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]).optional(),
  notes: z.string().max(500).optional().nullable(),
  starts_at: z.string().datetime().optional()
});

export async function updateBooking(
  id: string,
  patch: z.infer<typeof UpdateBookingSchema>
) {
  const parsed = UpdateBookingSchema.safeParse(patch);
  if (!parsed.success) return { error: "Datos inválidos" };
  const supabase = await requireAuth();

  // Si estamos cancelando, leemos el google_event_id ANTES del update
  // para poder cancelar el evento en Google Calendar después.
  let googleEventIdToCancel: string | null = null;
  if (parsed.data.status === "cancelled") {
    const { data: current } = await supabase
      .from("bookings")
      .select("google_event_id, status")
      .eq("id", id)
      .single();
    // Solo cancelar GCal si no estaba ya cancelada (evitar dobles cancelaciones)
    if (current && current.status !== "cancelled") {
      googleEventIdToCancel = current.google_event_id;
    }
  }

  const { error } = await supabase.from("bookings").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  // Cancelar evento en Google Calendar (no bloquear si falla)
  if (googleEventIdToCancel) {
    try {
      await cancelGoogleEvent(googleEventIdToCancel);
    } catch (gErr) {
      console.warn("[updateBooking:gcal-cancel] No se pudo cancelar evento:", gErr);
    }
  }

  revalidatePath("/admin/citas");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteBooking(id: string) {
  const supabase = await requireAuth();

  // Leemos el google_event_id ANTES de borrar para limpiar GCal
  const { data: current } = await supabase
    .from("bookings")
    .select("google_event_id")
    .eq("id", id)
    .single();
  const googleEventIdToCancel = current?.google_event_id ?? null;

  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) return { error: error.message };

  // Cancelar evento en Google Calendar (no bloquear si falla)
  if (googleEventIdToCancel) {
    try {
      await cancelGoogleEvent(googleEventIdToCancel);
    } catch (gErr) {
      console.warn("[deleteBooking:gcal-cancel] No se pudo cancelar evento:", gErr);
    }
  }

  revalidatePath("/admin/citas");
  revalidatePath("/admin");
  return { ok: true };
}
