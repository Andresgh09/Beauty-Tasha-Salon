import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFinanceStats, type FinanceRange } from "@/lib/queries/finanzas";

const VALID_RANGES: FinanceRange[] = ["today", "week", "month", "year", "all"];
const VALID_KINDS = ["cobros", "gastos"] as const;
type ExportKind = (typeof VALID_KINDS)[number];

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatCRDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-CR", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

export async function GET(req: NextRequest) {
  // Auth: solo admin (authenticated)
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const rangeParam = (url.searchParams.get("range") ?? "month") as FinanceRange;
  const kindParam = (url.searchParams.get("kind") ?? "cobros") as ExportKind;

  const range = VALID_RANGES.includes(rangeParam) ? rangeParam : "month";
  const kind = VALID_KINDS.includes(kindParam) ? kindParam : "cobros";

  const stats = await getFinanceStats(range);

  let csv = "";
  let filename = "";

  if (kind === "cobros") {
    const headers = [
      "Fecha de cobro",
      "Cliente",
      "Teléfono",
      "Servicio",
      "Precio servicio (CRC)",
      "Descuento (CRC)",
      "Precio final (CRC)",
      "Monto cobrado (CRC)",
      "Método de pago",
      "Fecha de cita",
      "Notas"
    ];
    const rows = stats.bookings.map((b) => [
      formatCRDate(b.paid_at),
      b.customer_name,
      b.customer_phone,
      b.service_name,
      b.service_price,
      b.discount_amount,
      b.final_price,
      b.paid_amount ?? "",
      b.payment_method ?? "",
      formatCRDate(b.starts_at),
      b.notes ?? ""
    ]);

    csv =
      headers.map(escapeCSV).join(",") +
      "\n" +
      rows.map((r) => r.map(escapeCSV).join(",")).join("\n");
    filename = `cobros-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
  } else {
    const headers = [
      "Fecha",
      "Categoría",
      "Descripción",
      "Monto (CRC)",
      "Notas"
    ];
    const rows = stats.expenses.map((e) => [
      formatCRDate(e.spent_at),
      e.category,
      e.description,
      e.amount,
      e.notes ?? ""
    ]);

    csv =
      headers.map(escapeCSV).join(",") +
      "\n" +
      rows.map((r) => r.map(escapeCSV).join(",")).join("\n");
    filename = `gastos-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
  }

  // BOM para que Excel detecte UTF-8 con tildes
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
