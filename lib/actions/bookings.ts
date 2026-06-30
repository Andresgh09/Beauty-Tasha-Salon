"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  cancelBooking as cancelGoogleEvent,
  createBooking as createGoogleEvent
} from "@/lib/google-calendar";
import { SALON_TZ_OFFSET, salonDateKey } from "@/lib/utils";
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
  starts_at: z.string().datetime().optional(),
  payment_method: z
    .enum(["cash", "transfer", "sinpe", "card", "other"])
    .optional()
    .nullable(),
  paid_amount: z.number().int().min(0).optional().nullable(),
  paid_at: z.string().datetime().optional().nullable()
});

export async function updateBooking(
  id: string,
  patch: z.infer<typeof UpdateBookingSchema>
) {
  const parsed = UpdateBookingSchema.safeParse(patch);
  if (!parsed.success) return { error: "Datos inválidos" };
  const supabase = await requireAuth();

  // Si se cambia starts_at, revalidar que el slot esté libre + no en el
  // pasado + dentro de horario. Tasha podría tipear mal y double-bookear
  // el salón sin notarlo. (CN-006)
  if (parsed.data.starts_at) {
    const newStart = new Date(parsed.data.starts_at);
    if (newStart < new Date()) {
      return { error: "No se puede mover una cita al pasado." };
    }

    // Leer la duración + status actual para revalidar
    const { data: bk } = await supabase
      .from("bookings")
      .select("duration_minutes, status")
      .eq("id", id)
      .single();
    if (!bk) return { error: "Cita no encontrada" };

    // Solo revalidar conflictos si la cita queda activa
    const willBeActive =
      (parsed.data.status ?? bk.status) !== "cancelled" &&
      (parsed.data.status ?? bk.status) !== "no_show";

    if (willBeActive) {
      const newEnd = new Date(
        newStart.getTime() + bk.duration_minutes * 60_000
      );
      // Buscar overlaps con OTRAS citas activas (excluyendo esta misma).
      // Day window en zona CR — no UTC del server — para que una cita a
      // las 6pm CR no caiga en el día siguiente.
      const dayKey = salonDateKey(parsed.data.starts_at);
      const dayStart = new Date(`${dayKey}T00:00:00${SALON_TZ_OFFSET}`);
      const dayEnd = new Date(`${dayKey}T23:59:59.999${SALON_TZ_OFFSET}`);

      const { data: others } = await supabase
        .from("bookings")
        .select("id, starts_at, duration_minutes")
        .in("status", ["pending", "confirmed", "completed"])
        .neq("id", id)
        .gte("starts_at", dayStart.toISOString())
        .lte("starts_at", dayEnd.toISOString());

      const conflict = (others ?? []).some((o) => {
        const oStart = new Date(o.starts_at);
        const oEnd = new Date(oStart.getTime() + o.duration_minutes * 60_000);
        return newStart < oEnd && newEnd > oStart;
      });
      if (conflict) {
        return {
          error: "Ya hay otra cita en ese horario. Elegí otra hora."
        };
      }
    }
  }

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

  // Auto-set paid_at cuando status pasa a "completed" y no se pasó explícito
  const updatePayload: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "completed" && parsed.data.paid_at === undefined) {
    updatePayload.paid_at = new Date().toISOString();
  }

  const { error } = await supabase.from("bookings").update(updatePayload).eq("id", id);
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
  revalidatePath("/admin/finanzas");
  return { ok: true };
}

const AdminBookingSchema = z.object({
  // Cliente: existente (por id) o nuevo (con datos)
  customerId: z.string().uuid().optional(),
  newCustomer: z
    .object({
      name: z.string().min(2).max(80),
      phone: z.string().min(6).max(30),
      email: z.string().email()
    })
    .optional(),
  serviceIds: z.array(z.string().uuid()).min(1).max(5),
  startISO: z.string().datetime(),
  notes: z.string().max(500).optional().nullable(),
  sendInvitation: z.boolean().default(true) // mandar invite a Google Calendar
});

/**
 * Crea una cita manualmente desde el panel admin.
 * - Permite usar un cliente existente o crear uno nuevo
 * - Skip CSRF/rate-limit (admin autenticada)
 * - Skip email a Tasha (ella la creó, ya lo sabe)
 * - Opcional: invitación a Google Calendar al cliente
 */
export async function createAdminBooking(
  input: z.infer<typeof AdminBookingSchema>
) {
  const parsed = AdminBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos: " + parsed.error.issues[0]?.message };
  }
  const data = parsed.data;
  const supabase = await requireAuth();

  // 1) Resolver cliente
  let customer: { id: string; name: string; phone: string; email: string };

  if (data.customerId) {
    const { data: c, error: cErr } = await supabase
      .from("customers")
      .select("id, name, phone, email")
      .eq("id", data.customerId)
      .single();
    if (cErr || !c) return { error: "Cliente no encontrado" };
    customer = c as typeof customer;
  } else if (data.newCustomer) {
    const normEmail = data.newCustomer.email.trim().toLowerCase();
    // INSERT-first con fallback a lookup si hay unique violation
    const { data: created, error: insErr } = await supabase
      .from("customers")
      .insert({
        name: data.newCustomer.name.trim(),
        phone: data.newCustomer.phone.trim(),
        email: normEmail
      })
      .select("id, name, phone, email")
      .single();
    if (insErr) {
      // Quizás ya existe — buscar por email
      const { data: existing } = await supabase
        .from("customers")
        .select("id, name, phone, email")
        .ilike("email", normEmail)
        .limit(1);
      if (!existing || existing.length === 0) {
        return { error: "No se pudo crear el cliente: " + insErr.message };
      }
      customer = existing[0] as typeof customer;
    } else {
      customer = created as typeof customer;
    }
  } else {
    return { error: "Especificá cliente existente o nuevo" };
  }

  // 2) Cargar servicios
  const { data: services, error: sErr } = await supabase
    .from("services")
    .select("id, name, price, duration_minutes")
    .in("id", data.serviceIds);
  if (sErr || !services || services.length !== data.serviceIds.length) {
    return { error: "Uno o más servicios no existen" };
  }

  const totalDuration = services.reduce((s, x) => s + x.duration_minutes, 0);
  const totalPrice = services.reduce((s, x) => s + x.price, 0);
  const combinedName =
    services.length === 1
      ? services[0].name
      : services.map((s) => s.name).join(" + ");
  const primary = services[0];

  // 3) Google Calendar event (opcional)
  let googleEventId: string | null = null;
  if (data.sendInvitation) {
    try {
      const gcal = await createGoogleEvent({
        serviceId: primary.id,
        serviceName: combinedName,
        price: totalPrice,
        durationMinutes: totalDuration,
        startISO: data.startISO,
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          notes: data.notes ?? undefined
        }
      });
      googleEventId = gcal.eventId ?? null;
    } catch (gErr) {
      console.warn("[createAdminBooking:gcal]", gErr);
    }
  }

  // 4) Insert booking
  const { data: booking, error: bErr } = await supabase
    .from("bookings")
    .insert({
      customer_id: customer.id,
      service_id: primary.id,
      service_name: combinedName,
      service_price: totalPrice,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email,
      notes: data.notes ?? null,
      starts_at: data.startISO,
      duration_minutes: totalDuration,
      status: "confirmed",
      google_event_id: googleEventId,
      final_price: totalPrice
    })
    .select("id")
    .single();

  if (bErr || !booking) {
    return { error: "Error guardando la cita: " + (bErr?.message ?? "?") };
  }

  // 5) booking_items
  const items = services.map((s, idx) => ({
    booking_id: booking.id,
    service_id: s.id,
    service_name: s.name,
    service_price: s.price,
    duration_minutes: s.duration_minutes,
    position: idx
  }));
  await supabase.from("booking_items").insert(items);

  revalidatePath("/admin/citas");
  revalidatePath("/admin");
  return { ok: true, bookingId: booking.id };
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
