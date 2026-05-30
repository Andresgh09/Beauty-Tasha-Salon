"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import type {
  TimeseriesPoint,
  TopService,
  FinanceStats
} from "@/lib/queries/finanzas";
import type { PaymentMethod, ExpenseCategory } from "@/lib/supabase/types";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  sinpe: "SINPE",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro"
};

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  materials: "Materiales",
  rent: "Alquiler",
  utilities: "Servicios",
  marketing: "Marketing",
  salary: "Salarios",
  equipment: "Equipo",
  maintenance: "Mantenimiento",
  transport: "Transporte",
  other: "Otros"
};

// Paleta mauve consistente con la marca
const PIE_COLORS = ["#A86BFF", "#C89EFF", "#8B5CF6", "#D8B4FE", "#6D28D9"];

function formatCRC(v: number): string {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0
  }).format(v);
}

function shortDate(d: string): string {
  // d = "YYYY-MM-DD" → "DD/MM"
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

export function RevenueExpensesChart({ data }: { data: TimeseriesPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-charcoal-soft">
        No hay datos en este rango
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#A86BFF" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#A86BFF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F87171" stopOpacity={0.7} />
            <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3E8FF" />
        <XAxis dataKey="date" tickFormatter={shortDate} fontSize={11} stroke="#6B7280" />
        <YAxis
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
          fontSize={11}
          stroke="#6B7280"
        />
        <Tooltip
          formatter={(v: number) => formatCRC(v)}
          labelFormatter={(d) => `Fecha: ${d}`}
          contentStyle={{
            background: "white",
            border: "1px solid #E9D5FF",
            borderRadius: 12,
            fontSize: 12
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Ingresos"
          stroke="#A86BFF"
          fillOpacity={1}
          fill="url(#rev)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          name="Gastos"
          stroke="#F87171"
          fillOpacity={1}
          fill="url(#exp)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PaymentMethodPie({
  byMethod
}: {
  byMethod: FinanceStats["byMethod"];
}) {
  const data = (Object.keys(byMethod) as PaymentMethod[])
    .filter((k) => byMethod[k].total > 0)
    .map((k) => ({
      name: PAYMENT_LABELS[k],
      value: byMethod[k].total
    }));

  if (data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-charcoal-soft">
        Sin cobros en el rango
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={45}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) => formatCRC(v)}
          contentStyle={{
            background: "white",
            border: "1px solid #E9D5FF",
            borderRadius: 12,
            fontSize: 12
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ExpenseCategoryPie({
  byCategory
}: {
  byCategory: FinanceStats["byExpenseCategory"];
}) {
  const data = (Object.keys(byCategory) as ExpenseCategory[])
    .filter((k) => byCategory[k].total > 0)
    .map((k) => ({
      name: CATEGORY_LABELS[k],
      value: byCategory[k].total
    }));

  if (data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-charcoal-soft">
        Sin gastos en el rango
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={45}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) => formatCRC(v)}
          contentStyle={{
            background: "white",
            border: "1px solid #E9D5FF",
            borderRadius: 12,
            fontSize: 12
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TopServicesBar({ data }: { data: TopService[] }) {
  if (data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-charcoal-soft">
        Sin datos en el rango
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#F3E8FF" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
          fontSize={11}
          stroke="#6B7280"
        />
        <YAxis
          type="category"
          dataKey="serviceName"
          width={120}
          fontSize={11}
          stroke="#374151"
        />
        <Tooltip
          formatter={(v: number) => formatCRC(v)}
          contentStyle={{
            background: "white",
            border: "1px solid #E9D5FF",
            borderRadius: 12,
            fontSize: 12
          }}
        />
        <Bar dataKey="total" fill="#A86BFF" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
