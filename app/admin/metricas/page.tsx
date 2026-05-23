import {
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  Star
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { formatCRC, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ServiceStat = { name: string; count: number; revenue: number };

type BookingRow = {
  status: string;
  final_price: number | null;
  service_name?: string;
  starts_at?: string;
};
type CustomerRow = {
  id: string;
  total_bookings: number | null;
  total_spent: number | null;
};
type ServiceRow = { id: string; name: string; visible: boolean };

async function getMetrics() {
  const supabase = createClient();
  const now = new Date();
  const thisMonthStart = startOfMonth(now).toISOString();
  const thisMonthEnd = endOfMonth(now).toISOString();
  const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
  const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();

  const [
    thisMonth,
    lastMonth,
    allBookings,
    customers,
    services
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("status, final_price, service_name")
      .gte("starts_at", thisMonthStart)
      .lte("starts_at", thisMonthEnd),
    supabase
      .from("bookings")
      .select("status, final_price")
      .gte("starts_at", lastMonthStart)
      .lte("starts_at", lastMonthEnd),
    supabase
      .from("bookings")
      .select("status, final_price, service_name, starts_at")
      .order("starts_at", { ascending: false }),
    supabase.from("customers").select("id, total_bookings, total_spent"),
    supabase.from("services").select("id, name, visible")
  ]);

  const tm = (thisMonth.data ?? []) as BookingRow[];
  const lm = (lastMonth.data ?? []) as BookingRow[];

  const revenue = tm
    .filter((b) => b.status === "completed")
    .reduce((s, b) => s + (b.final_price ?? 0), 0);

  const lastRevenue = lm
    .filter((b) => b.status === "completed")
    .reduce((s, b) => s + (b.final_price ?? 0), 0);

  const revenueChange = lastRevenue > 0
    ? Math.round(((revenue - lastRevenue) / lastRevenue) * 100)
    : 0;

  const completed = tm.filter((b) => b.status === "completed").length;
  const cancelled = tm.filter((b) => b.status === "cancelled").length;
  const noShows = tm.filter((b) => b.status === "no_show").length;
  const total = tm.length;

  // Top servicios (ranking por # de citas)
  const serviceMap = new Map<string, ServiceStat>();
  ((allBookings.data ?? []) as BookingRow[])
    .filter((b) => b.status === "completed")
    .forEach((b) => {
      const name = b.service_name ?? "Sin nombre";
      const existing = serviceMap.get(name) ?? {
        name,
        count: 0,
        revenue: 0
      };
      existing.count++;
      existing.revenue += b.final_price ?? 0;
      serviceMap.set(name, existing);
    });
  const topServices = Array.from(serviceMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top clientas
  const topCustomers = ((customers.data ?? []) as CustomerRow[])
    .sort((a, b) => (b.total_spent ?? 0) - (a.total_spent ?? 0))
    .slice(0, 5);

  return {
    revenue,
    revenueChange,
    completed,
    cancelled,
    noShows,
    total,
    topServices,
    topCustomers,
    visibleServices: ((services.data ?? []) as ServiceRow[]).filter((s) => s.visible).length,
    totalServices: services.data?.length ?? 0,
    totalCustomers: customers.data?.length ?? 0
  };
}

export default async function MetricsPage() {
  const m = await getMetrics();
  const monthName = format(new Date(), "MMMM yyyy", { locale: es });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-charcoal">Métricas</h1>
        <p className="text-charcoal-soft mt-1 capitalize">
          Resumen de {monthName} y datos históricos.
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          icon={DollarSign}
          label="Ingresos del mes"
          value={formatCRC(m.revenue)}
          change={m.revenueChange}
          accent="from-mauve-500 to-mauve-700"
        />
        <Kpi
          icon={CheckCircle2}
          label="Citas completadas"
          value={m.completed.toString()}
          accent="from-green-400 to-green-600"
        />
        <Kpi
          icon={AlertTriangle}
          label="No-shows"
          value={m.noShows.toString()}
          accent="from-orange-400 to-orange-600"
        />
        <Kpi
          icon={XCircle}
          label="Canceladas"
          value={m.cancelled.toString()}
          accent="from-red-400 to-red-600"
        />
      </div>

      {/* Second row */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Kpi
          icon={Calendar}
          label="Total citas mes"
          value={m.total.toString()}
          accent="from-mauve-300 to-mauve-500"
          compact
        />
        <Kpi
          icon={Users}
          label="Clientas registradas"
          value={m.totalCustomers.toString()}
          accent="from-mauve-300 to-mauve-500"
          compact
        />
        <Kpi
          icon={Star}
          label="Servicios activos"
          value={`${m.visibleServices} / ${m.totalServices}`}
          accent="from-mauve-300 to-mauve-500"
          compact
        />
      </div>

      {/* Top services */}
      <section className="bg-white rounded-3xl border border-mauve-100 p-6 shadow-card">
        <h2 className="font-serif text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-mauve-700" />
          Top servicios (histórico)
        </h2>
        {m.topServices.length === 0 ? (
          <p className="text-center py-6 text-charcoal-muted text-sm">
            Aún no hay datos suficientes.
          </p>
        ) : (
          <ul className="space-y-3">
            {m.topServices.map((s, i) => {
              const max = m.topServices[0].count;
              const width = (s.count / max) * 100;
              return (
                <li key={s.name}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="flex items-center gap-2 font-medium text-charcoal">
                      <span className="w-5 h-5 rounded-full bg-mauve-100 text-mauve-700 text-xs flex items-center justify-center font-semibold">
                        {i + 1}
                      </span>
                      {s.name}
                    </span>
                    <span className="text-charcoal-muted text-xs">
                      {s.count} citas · {formatCRC(s.revenue)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-mauve-50 overflow-hidden">
                    <div
                      className="h-full bg-gradient-brand rounded-full transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Top customers */}
      <section className="bg-white rounded-3xl border border-mauve-100 p-6 shadow-card">
        <h2 className="font-serif text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-mauve-700" />
          Clientas VIP (por gasto total)
        </h2>
        {m.topCustomers.length === 0 ? (
          <p className="text-center py-6 text-charcoal-muted text-sm">
            Aún no hay clientas con compras completadas.
          </p>
        ) : (
          <ul className="divide-y divide-mauve-100">
            {m.topCustomers.map((c, i) => (
              <li key={c.id} className="py-2 flex items-center justify-between">
                <span className="text-sm text-charcoal">#{i + 1}</span>
                <span className="flex-1 ml-3 text-sm">{c.total_bookings} visitas</span>
                <span className="font-accent text-mauve-700 font-semibold text-sm">
                  {formatCRC(c.total_spent ?? 0)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  change,
  accent,
  compact = false
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  change?: number;
  accent: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("bg-white rounded-2xl border border-mauve-100 shadow-card", compact ? "p-4" : "p-5")}>
      <div className={cn(`rounded-full bg-gradient-to-br ${accent} flex items-center justify-center mb-3`, compact ? "w-8 h-8" : "w-10 h-10")}>
        <Icon className={cn("text-white", compact ? "w-4 h-4" : "w-5 h-5")} />
      </div>
      <p className="text-xs text-charcoal-muted mb-1">{label}</p>
      <p className={cn("font-serif font-semibold text-charcoal", compact ? "text-lg" : "text-2xl")}>
        {value}
      </p>
      {change !== undefined && (
        <p className={cn("text-xs mt-1 font-medium", change >= 0 ? "text-green-600" : "text-red-600")}>
          {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% vs mes pasado
        </p>
      )}
    </div>
  );
}
