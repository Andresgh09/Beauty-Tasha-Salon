import { NextRequest, NextResponse } from "next/server";
import { getPublicAvailableSlots } from "@/lib/queries/availability";
import { getServiceById } from "@/lib/queries/services";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const serviceId = searchParams.get("service");

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return NextResponse.json({ slots: [] });
    }

    const slots = await getPublicAvailableSlots(date, service.duration_minutes);
    return NextResponse.json({ slots });
  } catch (error) {
    console.error("[availability]", error);
    return NextResponse.json(
      { error: "Error consultando disponibilidad" },
      { status: 500 }
    );
  }
}
