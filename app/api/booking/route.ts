import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createBooking as createGoogleEvent } from "@/lib/google-calendar";
import { sendNewBookingNotification } from "@/lib/email";
import { getServiceById } from "@/lib/queries/services";
import { getPublicAvailableSlots } from "@/lib/queries/availability";
import { createAdminClient } from "@/lib/supabase/server";
import { SALON_TZ_OFFSET, salonDateKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

const BookingSchema = z
  .object({
    // Multi-servicio: aceptamos array de IDs (preferido)
    // Backwards-compat: si llega serviceId solo, lo normalizamos a array
    serviceIds: z.array(z.string().min(1)).min(1).max(5).optional(),
    serviceId: z.string().min(1).optional(),
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
  })
  .refine((d) => d.serviceIds || d.serviceId, {
    message: "Debe enviar al menos un servicio",
    path: ["serviceIds"]
  });

// Rate limit en memoria con ceiling global (defensa en profundidad mientras
// no haya Upstash Redis configurado — ver CN-003 en cyber-neo report).
// El Map vive por lambda; en Vercel hay múltiples instancias, por lo que el
// límite efectivo es N×RATE_LIMIT. Para tráfico real bajo (salón pequeño)
// es aceptable; para uso intensivo migrar a @upstash/ratelimit.
const rateLimitMap = new Map<string, { count: number; reset: number }>();
let globalCount = 0;
let globalReset = Date.now() + 60_000;
const RATE_LIMIT_PER_IP = 5;
const RATE_LIMIT_GLOBAL = 100; // ceiling absoluto por lambda por minuto
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Ceiling global — protege contra IP spoofing masivo
  if (now > globalReset) {
    globalCount = 0;
    globalReset = now + RATE_WINDOW;
  }
  if (globalCount >= RATE_LIMIT_GLOBAL) return false;

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + RATE_WINDOW });
    globalCount++;
    return true;
  }
  if (entry.count >= RATE_LIMIT_PER_IP) return false;
  entry.count++;
  globalCount++;
  return true;
}

/** Extrae el Origin del request, con fallback a Referer. */
function deriveOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }
  return null;
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
    // CSRF protection: validar Origin (con fallback a Referer).
    // Rechazar también cuando no hay Origin ni Referer — un POST que cambia
    // estado siempre debería venir desde una página identificable.
    const origin = deriveOrigin(req);
    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      return NextResponse.json(
        { error: "Origen no permitido" },
        { status: 403 }
      );
    }

    // En Vercel, x-vercel-forwarded-for es de confianza (lo inyecta el edge,
    // ignora cualquier x-forwarded-for que mande el cliente). En local cae a
    // x-forwarded-for. Si no hay nada, usar "unknown" y dejar que el ceiling
    // global haga su trabajo.
    const ip =
      req.headers.get("x-vercel-forwarded-for") ??
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

    const { startISO, customer } = parsed.data;

    // Normalizamos: si llega serviceId (legacy), lo convertimos a array
    const serviceIds = parsed.data.serviceIds ?? [parsed.data.serviceId!];

    // Validamos que TODOS los servicios existan y son visibles
    const services = await Promise.all(serviceIds.map((id) => getServiceById(id)));
    if (services.some((s) => !s)) {
      return NextResponse.json(
        { error: "Uno o más servicios no existen" },
        { status: 404 }
      );
    }
    // TS: descartamos null tras la verificación
    const validServices = services as NonNullable<(typeof services)[number]>[];

    // Duración total y precio total
    const totalDuration = validServices.reduce(
      (sum, s) => sum + s.duration_minutes,
      0
    );
    const totalPrice = validServices.reduce((sum, s) => sum + s.price, 0);

    // Servicio "primario" (primero) — para snapshot en columnas existentes
    const primaryService = validServices[0];

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
    // Construir el día en zona CR (no UTC del server) para que getDay()
    // y buildSalonISO devuelvan el día correcto. Sin esto, una reserva
    // a las 6pm CR (= 00:00 UTC del día siguiente) busca slots del día
    // siguiente y falla con "no existe en la grilla de horarios".
    const dayKey = salonDateKey(startISO); // "YYYY-MM-DD" en CR
    const dateOnly = new Date(`${dayKey}T12:00:00${SALON_TZ_OFFSET}`);
    const availableSlots = await getPublicAvailableSlots(
      dateOnly,
      totalDuration
    );
    const matchingSlot = availableSlots.find((s) => s.iso === startISO);
    if (!matchingSlot) {
      // Diagnóstico: cuál fue el ISO recibido, qué día CR resolvimos,
      // y cuántos slots se generaron. Aparece en Vercel logs.
      console.warn("[booking:no-grid-match]", {
        startISO,
        dayKey,
        totalDuration,
        slotsGenerated: availableSlots.length,
        firstSlot: availableSlots[0]?.iso,
        lastSlot: availableSlots[availableSlots.length - 1]?.iso
      });
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

    // Helper para loggear errores de Supabase con todos los campos relevantes
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

    // Helper para scrubbing de PII en logs (Ley 8968 CR).
    // Convierte "andrea@gmail.com" → "a***@gmail.com" para diagnóstico
    // sin exponer dato completo en logs de Vercel.
    const maskEmail = (e: string): string => {
      const [user, domain] = e.split("@");
      if (!domain) return "***";
      return `${user[0] ?? ""}***@${domain}`;
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
          console.error("[booking:customer:lookup]", supabaseErr(lookupError));
          return NextResponse.json(
            { error: "Error consultando cliente. Intenta de nuevo." },
            { status: 500 }
          );
        }

        if (!existing || existing.length === 0) {
          console.error("[booking:customer:lookup-empty]", { email: maskEmail(normalizedEmail) });
          return NextResponse.json(
            { error: "Error guardando cliente. Intenta de nuevo." },
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
        console.error("[booking:customer:insert]", supabaseErr(insertError));
        return NextResponse.json(
          { error: "Error guardando cliente. Intenta de nuevo." },
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
    // Si hay múltiples servicios, el título es "Servicio 1 + Servicio 2"
    const combinedServiceName =
      validServices.length === 1
        ? primaryService.name
        : validServices.map((s) => s.name).join(" + ");

    let googleEventId: string | null = null;
    try {
      const result = await createGoogleEvent({
        serviceId: primaryService.id,
        serviceName: combinedServiceName,
        price: totalPrice,
        durationMinutes: totalDuration,
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
      console.warn("[booking:gcal] No se pudo crear evento:", gErr);
    }

    // 3) Crear booking en Supabase con snapshot del servicio primario
    const { data: booking, error: bookError } = await supabase
      .from("bookings")
      .insert({
        customer_id: customerId,
        service_id: primaryService.id,
        service_name: combinedServiceName,
        service_price: totalPrice,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: normalizedEmail,
        notes: customer.notes ?? null,
        starts_at: startISO,
        duration_minutes: totalDuration,
        status: "confirmed",
        google_event_id: googleEventId,
        final_price: totalPrice
      })
      .select("id")
      .single();

    if (bookError || !booking) {
      console.error("[booking:insert]", supabaseErr(bookError));
      return NextResponse.json(
        { error: "Error guardando la reserva" },
        { status: 500 }
      );
    }

    // 4) Crear booking_items (uno por servicio)
    const items = validServices.map((s, idx) => ({
      booking_id: booking.id,
      service_id: s.id,
      service_name: s.name,
      service_price: s.price,
      duration_minutes: s.duration_minutes,
      position: idx
    }));
    const { error: itemsError } = await supabase.from("booking_items").insert(items);
    if (itemsError) {
      // No bloquear la reserva — los items son secundarios, el booking ya tiene
      // snapshot del servicio combinado en las columnas existentes
      console.warn("[booking:items]", supabaseErr(itemsError));
    }

    // 5) Notificar a Tasha por email (independiente de Google Calendar).
    // No bloquea — si falla, queda warn en logs.
    try {
      await sendNewBookingNotification({
        bookingId: booking.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: normalizedEmail,
        serviceName: combinedServiceName,
        totalPrice,
        durationMinutes: totalDuration,
        startISO,
        notes: customer.notes ?? null,
        hasGoogleEvent: googleEventId !== null
      });
    } catch (mailErr) {
      console.warn("[booking:email] No se pudo notificar a Tasha:", mailErr);
    }

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
      message: "Cita confirmada. Te enviamos un correo con los detalles."
    });
  } catch (error) {
    // Extraer solo message — el error original puede contener el payload
    // que el cliente envió (incluido email y phone).
    const msg = error instanceof Error ? error.message : "unknown";
    console.error("[booking]", { message: msg });
    return NextResponse.json(
      { error: "Error procesando la reserva. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
