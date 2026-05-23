import { createClient } from "@/lib/supabase/server";
import type { Booking, PaymentMethod } from "@/lib/supabase/types";

export type FinanceRange = "today" | "week" | "month" | "year" | "all";

export type FinanceStats = {
  totalRevenue: number;
  bookingsCount: number;
  averageTicket: number;
  byMethod: Record<PaymentMethod, { total: number; count: number }>;
  bookings: Booking[];
};

const EMPTY_METHODS: Record<PaymentMethod, { total: number; count: number }> = {
  cash: { total: 0, count: 0 },
  sinpe: { total: 0, count: 0 },
  transfer: { total: 0, count: 0 },
  card: { total: 0, count: 0 },
  other: { total: 0, count: 0 }
};

function getRangeBounds(range: FinanceRange): { from: Date; to: Date } | null {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  if (range === "today") {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }

  if (range === "week") {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    return { from, to };
  }

  if (range === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { from, to };
  }

  if (range === "year") {
    const from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    return { from, to };
  }

  return null; // "all"
}

/**
 * Obtiene estadísticas de finanzas para un rango.
 * Solo cuenta bookings completados con paid_at (cobros reales).
 */
export async function getFinanceStats(
  range: FinanceRange = "month"
): Promise<FinanceStats> {
  const supabase = createClient();
  let query = supabase
    .from("bookings")
    .select("*")
    .eq("status", "completed")
    .not("paid_at", "is", null)
    .order("paid_at", { ascending: false });

  const bounds = getRangeBounds(range);
  if (bounds) {
    query = query
      .gte("paid_at", bounds.from.toISOString())
      .lte("paid_at", bounds.to.toISOString());
  }

  const { data, error } = await query;
  if (error) {
    console.error("[getFinanceStats]", error);
    return {
      totalRevenue: 0,
      bookingsCount: 0,
      averageTicket: 0,
      byMethod: { ...EMPTY_METHODS },
      bookings: []
    };
  }

  const bookings = (data ?? []) as Booking[];
  let totalRevenue = 0;
  const byMethod: Record<PaymentMethod, { total: number; count: number }> = {
    cash: { total: 0, count: 0 },
    sinpe: { total: 0, count: 0 },
    transfer: { total: 0, count: 0 },
    card: { total: 0, count: 0 },
    other: { total: 0, count: 0 }
  };

  for (const b of bookings) {
    const amount = b.paid_amount ?? b.final_price ?? 0;
    totalRevenue += amount;
    if (b.payment_method) {
      byMethod[b.payment_method].total += amount;
      byMethod[b.payment_method].count += 1;
    }
  }

  return {
    totalRevenue,
    bookingsCount: bookings.length,
    averageTicket: bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0,
    byMethod,
    bookings
  };
}
