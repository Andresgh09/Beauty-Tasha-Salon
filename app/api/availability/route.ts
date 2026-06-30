import { NextRequest, NextResponse } from "next/server";
import { getPublicAvailableSlots } from "@/lib/queries/availability";
import { getServiceById } from "@/lib/queries/services";
import { salonDayBounds } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const serviceId = searchParams.get("service");
    // Multi-servicio: el cliente pasa la suma de duraciones para validar
    // disponibilidad de un bloque continuo del tamaño correcto
    const durationOverrideStr = searchParams.get("durationOverride");

    if (!dateStr || !serviceId) {
      return NextResponse.json(
        { error: "Parámetros requeridos: date, service" },
        { status: 400 }
      );
    }

    const service = await getServiceById(serviceId);
    if (!service) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    }

    // "Hoy" en zona CR — sin esto, después de las 6pm CR el server
    // (UTC) considera mañana como hoy y rechazaba reservas válidas.
    const todayStartCR = new Date(salonDayBounds(new Date()).start);
    if (date < todayStartCR) {
      return NextResponse.json({ slots: [] });
    }

    // Si recibimos durationOverride, lo usamos (caso multi-servicio).
    // Mínimo defendido: si es inválido o menor a service.duration_minutes,
    // caemos al default del servicio.
    let duration = service.duration_minutes;
    if (durationOverrideStr) {
      const parsed = parseInt(durationOverrideStr, 10);
      if (!isNaN(parsed) && parsed >= service.duration_minutes && parsed <= 600) {
        duration = parsed;
      }
    }

    const slots = await getPublicAvailableSlots(date, duration);
    return NextResponse.json({ slots });
  } catch (error) {
    console.error("[availability]", error);
    return NextResponse.json(
      { error: "Error consultando disponibilidad" },
      { status: 500 }
    );
  }
}
