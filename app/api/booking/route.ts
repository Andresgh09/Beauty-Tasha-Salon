import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createBooking as createGoogleEvent } from "@/lib/google-calendar";
import { getServiceById } from "@/lib/queries/services";
import { getPublicAvailableSlots } from "@/lib/queries/availability";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BookingSchema = z.object({
  serviceId: z.string().min(1),
  startISO: z.string().datetime(),
  customer: z.object({
    name: z.string().min(2, "Nombre demasiado corto").max(80),
    phone: z
      .string()
      .min(8, "Teléfono inválido")
      .max(20)
      .regex(/^[+\d\s\-()]+$/, "Solo números y símbolos de teléfono"),
    email: z.string().email("Email inválido"),
    notes: z.string().max(500).optional()
  })
});

// Naive in-memory rate limit (reemplazar con Upstash en prod si necesario).
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Lista blanca de orígenes permitidos para CSRF protection
const ALLOWED_ORIGINS = new Set([
  "https://beautytashasalon.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]);

export async function POST(req: NextRequest) {
  try {
    // CSRF protection: validar Origin
    const origin = req.headers.get("origin");
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return NextResponse.json(
        { error: "Origen no permitido" },
        { status: 403 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta en un minuto." },
        { status: 429 }
      );
    }

    const json = await req.json();
    const parsed = BookingSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { serviceId, startISO, customer } = parsed.data;
    const service = await getServiceById(serviceId);

    if (!service) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    if (new Date(startISO) < new Date()) {
      return NextResponse.json(
        { error: "La fecha debe ser futura" },
        { status: 400 }
      );
    }

    // 🛡️ VALIDACIÓN DE SLOT SERVER-SIDE
    // Re-verificamos que el horario solicitado esté realmente disponible:
    // - Dentro de business_hours del día
    // - No solapado con blocked_slots
    // - No solapado con bookings existentes
    // - Alineado a la grilla de slots configurada
    const dateOnly = new Date(startISO);
    dateOnly.setHours(0, 0, 0, 0);
    const availableSlots = await getPublicAvailableSlots(
      dateOnly,
      service.duration_minutes
    );
    const matchingSlot = availableSlots.find((s) => s.iso === startISO);
    if (!matchingSlot) {
      return NextResponse.json(
        { error: "Ese horario no existe en la grilla de horarios." },
        { status: 409 }
      );
    }
    if (!matchingSlot.available) {
      return NextResponse.json(
        { error: "Ese horario ya no está disponible. Elige otro." },
        { status: 409 }
      );
    }

    const supabase = createAdminClient();

    // 1) Upsert customer (por email)
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .ilike("email", customer.email)
      .maybeSingle();

    let customerId: string;
    if (existingCustomer) {
      customerId = existingCustomer.id;
      await supabase
        .from("customers")
        .update({
          name: customer.name,
          phone: customer.phone
        })
        .eq("id", customerId);
    } else {
      const { data: newCustomer, error: custError } = await supabase
        .from("customers")
        .insert({
          name: customer.name,
          phone: customer.phone,
          email: customer.email
        })
        .select("id")
        .single();

      if (custError || !newCustomer) {
        console.error("[booking:customer]", custError);
        return NextResponse.json(
          { error: "Error guardando cliente" },
          { status: 500 }
        );
      }
      customerId = newCustomer.id;
    }

    // 2) Crear evento en Google Calendar (opcional)
    let googleEventId: string | null = null;
    try {
      const result = await createGoogleEvent({
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        durationMinutes: service.duration_minutes,
        startISO,
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          notes: customer.notes
        }
      });
      googleEventId = result.eventId ?? null;
    } catch (gErr) {
      // Si Google Calendar no está configurado, continuar sin error fatal
      console.warn("[booking:gcal] No se pudo crear evento:", gErr);
    }

    // 3) Crear booking en Supabase
    const { data: booking, error: bookError } = await supabase
      .from("bookings")
      .insert({
        customer_id: customerId,
        service_id: service.id,
        service_name: service.name,
        service_price: service.price,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email,
        notes: customer.notes ?? null,
        starts_at: startISO,
        duration_minutes: service.duration_minutes,
        status: "confirmed",
        google_event_id: googleEventId,
        final_price: service.price
      })
      .select("id")
      .single();

    if (bookError) {
      console.error("[booking:insert]", bookError);
      return NextResponse.json(
        { error: "Error guardando la reserva" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      bookingId: booking?.id,
      message: "Cita confirmada. Te enviamos un correo con los detalles."
    });
  } catch (error) {
    console.error("[booking]", error);
    return NextResponse.json(
      { error: "Error procesando la reserva. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
