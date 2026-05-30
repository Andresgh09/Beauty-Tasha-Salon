import { createClient } from "@/lib/supabase/server";
import type {
  Booking,
  PaymentMethod,
  Expense,
  ExpenseCategory
} from "@/lib/supabase/types";

export type FinanceRange = "today" | "week" | "month" | "year" | "all";

export type TimeseriesPoint = {
  date: string; // YYYY-MM-DD (Costa Rica TZ)
  revenue: number;
  expenses: number;
  net: number;
  bookings: number;
};

export type TopService = {
  serviceId: string | null;
  serviceName: string;
  total: number;
  count: number;
};

export type FinanceStats = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  bookingsCount: number;
  averageTicket: number;
  byMethod: Record<PaymentMethod, { total: number; count: number }>;
  byExpenseCategory: Record<ExpenseCategory, { total: number; count: number }>;
  bookings: Booking[];
  expenses: Expense[];
  timeseries: TimeseriesPoint[];
  topServices: TopService[];
};

const EMPTY_METHODS: Record<PaymentMethod, { total: number; count: number }> = {
  cash: { total: 0, count: 0 },
  sinpe: { total: 0, count: 0 },
  transfer: { total: 0, count: 0 },
  card: { total: 0, count: 0 },
  other: { total: 0, count: 0 }
};

const EMPTY_CATEGORIES: Record<
  ExpenseCategory,
  { total: number; count: number }
> = {
  materials: { total: 0, count: 0 },
  rent: { total: 0, count: 0 },
  utilities: { total: 0, count: 0 },
  marketing: { total: 0, count: 0 },
  salary: { total: 0, count: 0 },
  equipment: { total: 0, count: 0 },
  maintenance: { total: 0, count: 0 },
  transport: { total: 0, count: 0 },
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

/** YYYY-MM-DD en zona Costa Rica */
function crDateKey(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(iso));
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const d = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${d}`;
}

/**
 * Obtiene estadísticas de finanzas para un rango.
 * Combina cobros (bookings completed con paid_at) + gastos (expenses)
 * + serie temporal por día + top servicios.
 */
export async function getFinanceStats(
  range: FinanceRange = "month"
): Promise<FinanceStats> {
  const supabase = createClient();
  const bounds = getRangeBounds(range);

  let bookingsQuery = supabase
    .from("bookings")
    .select("*")
    .eq("status", "completed")
    .not("paid_at", "is", null)
    .order("paid_at", { ascending: false });

  if (bounds) {
    bookingsQuery = bookingsQuery
      .gte("paid_at", bounds.from.toISOString())
      .lte("paid_at", bounds.to.toISOString());
  }

  let expensesQuery = supabase
    .from("expenses")
    .select("*")
    .order("spent_at", { ascending: false });

  if (bounds) {
    expensesQuery = expensesQuery
      .gte("spent_at", bounds.from.toISOString())
      .lte("spent_at", bounds.to.toISOString());
  }

  const [bookingsRes, expensesRes] = await Promise.all([
    bookingsQuery,
    expensesQuery
  ]);

  if (bookingsRes.error)
    console.error("[getFinanceStats:bookings]", bookingsRes.error);
  if (expensesRes.error)
    console.error("[getFinanceStats:expenses]", expensesRes.error);

  const bookings = (bookingsRes.data ?? []) as Booking[];
  const expenses = (expensesRes.data ?? []) as Expense[];

  let totalRevenue = 0;
  const byMethod = JSON.parse(JSON.stringify(EMPTY_METHODS)) as typeof EMPTY_METHODS;
  const topMap = new Map<string, TopService>();
  const seriesMap = new Map<string, TimeseriesPoint>();

  for (const b of bookings) {
    const amount = b.paid_amount ?? b.final_price ?? 0;
    totalRevenue += amount;
    if (b.payment_method) {
      byMethod[b.payment_method].total += amount;
      byMethod[b.payment_method].count += 1;
    }
    const sid = b.service_id ?? `name:${b.service_name}`;
    const cur = topMap.get(sid) ?? {
      serviceId: b.service_id,
      serviceName: b.service_name,
      total: 0,
      count: 0
    };
    cur.total += amount;
    cur.count += 1;
    topMap.set(sid, cur);

    if (b.paid_at) {
      const key = crDateKey(b.paid_at);
      const cur2 = seriesMap.get(key) ?? {
        date: key,
        revenue: 0,
        expenses: 0,
        net: 0,
        bookings: 0
      };
      cur2.revenue += amount;
      cur2.bookings += 1;
      seriesMap.set(key, cur2);
    }
  }

  let totalExpenses = 0;
  const byExpenseCategory = JSON.parse(
    JSON.stringify(EMPTY_CATEGORIES)
  ) as typeof EMPTY_CATEGORIES;

  for (const e of expenses) {
    totalExpenses += e.amount;
    byExpenseCategory[e.category].total += e.amount;
    byExpenseCategory[e.category].count += 1;

    const key = crDateKey(e.spent_at);
    const cur = seriesMap.get(key) ?? {
      date: key,
      revenue: 0,
      expenses: 0,
      net: 0,
      bookings: 0
    };
    cur.expenses += e.amount;
    seriesMap.set(key, cur);
  }

  const timeseries: TimeseriesPoint[] = Array.from(seriesMap.values())
    .map((p) => ({ ...p, net: p.revenue - p.expenses }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topServices: TopService[] = Array.from(topMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    bookingsCount: bookings.length,
    averageTicket:
      bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0,
    byMethod,
    byExpenseCategory,
    bookings,
    expenses,
    timeseries,
    topServices
  };
}
