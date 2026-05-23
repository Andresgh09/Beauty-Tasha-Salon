import { getFinanceStats, type FinanceRange } from "@/lib/queries/finanzas";
import { FinanzasView } from "@/components/admin/finanzas-view";

export const dynamic = "force-dynamic";

const VALID_RANGES: FinanceRange[] = ["today", "week", "month", "year", "all"];

export default async function FinanzasPage({
  searchParams
}: {
  searchParams: { range?: string };
}) {
  const range = (
    VALID_RANGES.includes(searchParams.range as FinanceRange)
      ? (searchParams.range as FinanceRange)
      : "month"
  ) as FinanceRange;

  const stats = await getFinanceStats(range);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-charcoal">
          Finanzas
        </h1>
        <p className="text-charcoal-soft mt-1">
          Ingresos por cobros completados. Filtrá por período y método de pago.
        </p>
      </header>

      <FinanzasView stats={stats} activeRange={range} />
    </div>
  );
}
