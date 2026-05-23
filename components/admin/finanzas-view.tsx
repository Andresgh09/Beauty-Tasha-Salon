"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Wallet,
  TrendingUp,
  Receipt,
  Calendar as CalendarIcon
} from "lucide-react";
import { PAYMENT_METHOD_META } from "./bookings-admin";
import {
  cn,
  formatCRC,
  formatSalonDateMedium,
  formatSalonTime
} from "@/lib/utils";
import type { FinanceStats, FinanceRange } from "@/lib/queries/finanzas";
import type { PaymentMethod } from "@/lib/supabase/types";

const RANGES: { value: FinanceRange; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Últimos 7 días" },
  { value: "month", label: "Este mes" },
  { value: "year", label: "Este año" },
  { value: "all", label: "Todo" }
];

export function FinanzasView({
  stats,
  activeRange
}: {
  stats: FinanceStats;
  activeRange: FinanceRange;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const changeRange = (range: FinanceRange) => {
    const params = new URLSearchParams(searchParams);
    params.set("range", range);
    router.push(`/admin/finanzas?${params.toString()}`);
    router.refresh();
  };

  const methods = Object.keys(stats.byMethod) as PaymentMethod[];
  const methodsWithRevenue = methods.filter((m) => stats.byMethod[m].count > 0);
  const totalForBars = stats.totalRevenue || 1; // evita div/0 al calcular %

  return (
    <div className="space-y-6">
      {/* Filtros de rango */}
      <div className="bg-white rounded-2xl border border-mauve-100 p-4 shadow-card">
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => changeRange(r.value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                activeRange === r.value
                  ? "bg-gradient-brand text-white border-transparent shadow-soft"
                  : "bg-white border-mauve-200 text-charcoal hover:bg-mauve-50"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards principales */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Wallet}
          label="Ingresos totales"
          value={formatCRC(stats.totalRevenue)}
          accent="text-mauve-700"
        />
        <StatCard
          icon={Receipt}
          label="Cobros realizados"
          value={String(stats.bookingsCount)}
          accent="text-charcoal"
        />
        <StatCard
          icon={TrendingUp}
          label="Ticket promedio"
          value={formatCRC(stats.averageTicket)}
          accent="text-green-700"
        />
      </div>

      {/* Breakdown por método de pago */}
      <section className="bg-white rounded-3xl border border-mauve-100 p-6 shadow-card">
        <h2 className="font-serif text-xl font-semibold text-charcoal mb-4">
          Por método de pago
        </h2>
        {stats.totalRevenue === 0 ? (
          <p className="text-charcoal-muted text-sm py-6 text-center">
            No hay cobros registrados en este período.
          </p>
        ) : (
          <div className="space-y-3">
            {methodsWithRevenue.map((m) => {
              const meta = PAYMENT_METHOD_META[m];
              const bucket = stats.byMethod[m];
              const Icon = meta.icon;
              const pct = (bucket.total / totalForBars) * 100;
              return (
                <div key={m}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          meta.class
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-charcoal">{meta.label}</span>
                      <span className="text-xs text-charcoal-muted">
                        · {bucket.count} {bucket.count === 1 ? "cobro" : "cobros"}
                      </span>
                    </div>
                    <span className="font-accent text-mauve-700 font-semibold">
                      {formatCRC(bucket.total)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-mauve-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-brand rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-charcoal-muted mt-1">
                    {pct.toFixed(1)}% del total
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Lista detallada de cobros */}
      <section className="bg-white rounded-3xl border border-mauve-100 p-6 shadow-card">
        <h2 className="font-serif text-xl font-semibold text-charcoal mb-4">
          Detalle de cobros
        </h2>
        {stats.bookings.length === 0 ? (
          <p className="text-charcoal-muted text-sm py-6 text-center">
            No hay cobros registrados en este período.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-charcoal-muted border-b border-mauve-100">
                  <th className="px-6 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Clienta</th>
                  <th className="px-3 py-2 font-medium">Servicio</th>
                  <th className="px-3 py-2 font-medium">Método</th>
                  <th className="px-6 py-2 font-medium text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mauve-100">
                {stats.bookings.map((b) => {
                  const meta = b.payment_method
                    ? PAYMENT_METHOD_META[b.payment_method]
                    : null;
                  const Icon = meta?.icon;
                  return (
                    <tr key={b.id} className="hover:bg-mauve-50/50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="text-charcoal capitalize">
                          {formatSalonDateMedium(b.paid_at ?? b.starts_at)}
                        </div>
                        <div className="text-xs text-charcoal-muted">
                          {formatSalonTime(b.paid_at ?? b.starts_at)}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium text-charcoal">
                        {b.customer_name}
                      </td>
                      <td className="px-3 py-3 text-charcoal-soft">
                        {b.service_name}
                      </td>
                      <td className="px-3 py-3">
                        {meta && Icon ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                              meta.class
                            )}
                          >
                            <Icon className="w-3 h-3" />
                            {meta.label}
                          </span>
                        ) : (
                          <span className="text-xs text-charcoal-muted">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right font-accent text-mauve-700 font-semibold whitespace-nowrap">
                        {formatCRC(b.paid_amount ?? b.final_price)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-mauve-200 font-semibold">
                  <td colSpan={4} className="px-6 py-3 text-charcoal text-right">
                    Total
                  </td>
                  <td className="px-6 py-3 text-right font-accent text-mauve-800 text-base">
                    {formatCRC(stats.totalRevenue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-mauve-100 p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-charcoal-muted font-medium">
          {label}
        </span>
        <div className="w-9 h-9 rounded-full bg-mauve-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-mauve-700" />
        </div>
      </div>
      <p className={cn("font-serif text-2xl font-semibold", accent ?? "text-charcoal")}>
        {value}
      </p>
    </div>
  );
}
