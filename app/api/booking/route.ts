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

// Lista blanca de orígenes permitidos para CSRF protection.
// Vercel inyecta automáticamente VERCEL_URL (deploy actual) y
// VERCEL_PROJECT_PRODUCTION_URL (dominio de producción) en runtime.
// Esto permite que preview deployments funcionen sin hardcodear cada URL.
function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>([
    "https://beautytashasalon.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ]);

  // URL única de este deploy (ej: beauty-tasha-salon-abc-andresgh09.vercel.app)
  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }

  // URL del branch (ej: beauty-tasha-salon-git-dev-andresgh09.vercel.app)
  if (process.env.VERCEL_BRANCH_URL) {
    origins.add(`https://${process.env.VERCEL_BRANCH_URL}`);
  }

  // URL de producción del proyecto (igual que la hardcodeada arriba pero por si cambia)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }

  return origins;
}

const ALLOWED_ORIGINS = buildAllowedOrigins();

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

    // Modo debug: si está activo, devolvemos el detalle del error de Supabase
    // al cliente para diagnosticar en navegador. Apagar tras debug.
    const DEBUG = process.env.BOOKING_DEBUG === "1";
    const supabaseErr = (
      err: unknown
    ): { code?: string; message?: string; details?: string; hint?: string } => {
      const e = err as { code?: string; message?: string; details?: string; hint?: string };
      return {
        code: e?.code,
        message: e?.message,
        details: e?.details,
        hint: e?.hint
      };
    };

    // 1) Upsert customer (estrategia INSERT-first)
    // Normalizamos email para coincidir con índice único lower(email)
    const normalizedEmail = customer.email.trim().toLowerCase();
    let customerId: string | null = null;

    // Intento de INSERT directo. Si choca con unique violation (23505),
    // significa que el cliente ya existe → lo buscamos.
    const { data: newCustomer, error: insertError } = await supabase
      .from("customers")
      .insert({
        name: customer.name,
        phone: customer.phone,
        email: normalizedEmail
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        // Cliente ya existe — buscarlo y actualizar
        const { data: existing, error: lookupError } = await supabase
          .from("customers")
          .select("id")
          .ilike("email", normalizedEmail)
          .limit(1);

        if (lookupError) {
          const errInfo = supabaseErr(lookupError);
          console.error("[booking:customer:lookup]", errInfo);
          return NextResponse.json(
            {
              error: DEBUG
                ? `Lookup falló: ${errInfo.message ?? "desconocido"}`
                : "Error consultando cliente. Intenta de nuevo."
            },
            { status: 500 }
          );
        }

        if (!existing || existing.length === 0) {
          console.error("[booking:customer:lookup-empty]", { normalizedEmail });
          return NextResponse.json(
            {
              error: DEBUG
                ? "Lookup vacío tras 23505 — inconsistencia"
                : "Error guardando cliente. Intenta de nuevo."
            },
            { status: 500 }
          );
        }

        customerId = existing[0].id;

        // Actualizar nombre/teléfono pero NO bloquear si falla
        const { error: updateError } = await supabase
          .from("customers")
          .update({ name: customer.name, phone: customer.phone })
          .eq("id", customerId);
        if (updateError) {
          console.warn("[booking:customer:update]", supabaseErr(updateError));
        }
      } else {
        const errInfo = supabaseErr(insertError);
        console.error("[booking:customer:insert]", errInfo);
        return NextResponse.json(
          {
            error: DEBUG
              ? `Insert falló (${errInfo.code}): ${errInfo.message ?? "desconocido"}`
              : "Error guardando cliente. Intenta de nuevo."
          },
          { status: 500 }
        );
      }
    } else if (!newCustomer) {
      console.error("[booking:customer]", "Insert sin data ni error");
      return NextResponse.json(
        { error: "Error guardando cliente" },
        { status: 500 }
      );
    } else {
      customerId = newCustomer.id;
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "Error procesando cliente" },
        { status: 500 }
      );
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
        customer_email: normalizedEmail,
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
