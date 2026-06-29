import Link from "next/link";
import {
  Scissors,
  Image as ImageIcon,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle2
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  formatCRC,
  formatSalonTime,
  SALON_TZ,
  SALON_TZ_OFFSET,
  salonDateKey
} from "@/lib/utils";
import { startOfMonth, endOfMonth, addDays } from "date-fns";

export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = createClient();
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  // "Hoy" en zona Costa Rica (no UTC del server), para evitar
  // que después de las 6pm CR aparezcan las citas de mañana como "hoy"
  const todayKey = salonDateKey(now); // YYYY-MM-DD en CR
  const todayStart = new Date(`${todayKey}T00:00:00${SALON_TZ_OFFSET}`).toISOString();
  const todayEnd = new Date(`${todayKey}T23:59:59.999${SALON_TZ_OFFSET}`).toISOString();
  const next7Days = addDays(now, 7).toISOString();

  const [
    monthBookings,
    todayBookings,
    upcomingBookings,
    servicesCount,
    customersCount
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("final_price, status")
      .gte("starts_at", monthStart)
      .lte("starts_at", monthEnd),
    supabase
      .from("bookings")
      .select("id, customer_name, service_name, starts_at")
      .gte("starts_at", todayStart)
      .lte("starts_at", todayEnd)
      .order("starts_at", { ascending: true }),
    supabase
      .from("bookings")
      .select("id, customer_name, service_name, starts_at, status")
      .gte("starts_at", new Date().toISOString())
      .lte("starts_at", next7Days)
      .order("starts_at", { ascending: true })
      .limit(5),
    supabase.from("services").select("id", { count: "exact", head: true }),
    supabase.from("customers").select("id", { count: "exact", head: true })
  ]);

  type BookingRow = { status: string; final_price: number | null };
  type BookingSummary = { id: string; customer_name: string; service_name: string; starts_at: string; status?: string };
  const completed = ((monthBookings.data ?? []) as BookingRow[]).filter((b) => b.status === "completed");
  const monthRevenue = completed.reduce((sum, b) => sum + (b.final_price ?? 0), 0);

  return {
    monthRevenue,
    monthBookingsCount: monthBookings.data?.length ?? 0,
    completedCount: completed.length,
    todayBookings: (todayBookings.data ?? []) as BookingSummary[],
    upcomingBookings: (upcomingBookings.data ?? []) as BookingSummary[],
    servicesCount: servicesCount.count ?? 0,
    customersCount: customersCount.count ?? 0
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-charcoal">
          Hola Tasha 💜
        </h1>
        <p className="text-charcoal-soft mt-1">
          Aquí está el resumen de tu salón hoy.
        </p>
      </header>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Ingresos del mes"
          value={formatCRC(stats.monthRevenue)}
          accent="from-mauve-500 to-mauve-700"
        />
        <StatCard
          icon={Calendar}
          label="Citas del mes"
          value={stats.monthBookingsCount.toString()}
          accent="from-mauve-400 to-mauve-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Citas completadas"
          value={stats.completedCount.toString()}
          accent="from-mauve-300 to-mauve-500"
        />
        <StatCard
          icon={Users}
          label="Total clientas"
          value={stats.customersCount.toString()}
          accent="from-mauve-200 to-mauve-400"
        />
      </div>

      {/* Today's bookings */}
      <section className="bg-white rounded-3xl border border-mauve-100 p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-xl font-semibold text-charcoal">
              Citas de hoy
            </h2>
            <p className="text-sm text-charcoal-muted capitalize">
              {new Intl.DateTimeFormat("es-CR", {
                timeZone: SALON_TZ,
                weekday: "long",
                day: "numeric",
                month: "long"
              }).format(new Date())}
            </p>
          </div>
          <Link
            href="/admin/citas"
            className="text-sm font-medium text-mauve-700 hover:text-mauve-800 flex items-center gap-1"
          >
            Ver todas <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.todayBookings.length === 0 ? (
          <p className="text-center py-8 text-charcoal-muted text-sm">
            No hay citas para hoy. Disfruta tu día libre 💆‍♀️
          </p>
        ) : (
          <ul className="divide-y divide-mauve-100">
            {stats.todayBookings.map((b) => (
              <li key={b.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-charcoal">{b.customer_name}</p>
                  <p className="text-xs text-charcoal-muted">{b.service_name}</p>
                </div>
                <span className="font-accent text-mauve-700 font-semibold">
                  {formatSalonTime(b.starts_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="font-serif text-xl font-semibold text-charcoal mb-4">
          Acciones rápidas
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            href="/admin/servicios"
            icon={Scissors}
            label="Servicios"
            description={`${stats.servicesCount} servicios`}
          />
          <QuickAction
            href="/admin/galeria"
            icon={ImageIcon}
            label="Galería"
            description="Subir fotos"
          />
          <QuickAction
            href="/admin/citas"
            icon={Calendar}
            label="Agenda"
            description="Ver citas"
          />
          <QuickAction
            href="/admin/horarios"
            icon={Clock}
            label="Horarios"
            description="Editar disponibilidad"
          />
        </div>
      </section>

      {/* Upcoming bookings */}
      <section className="bg-white rounded-3xl border border-mauve-100 p-6 shadow-card">
        <h2 className="font-serif text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-mauve-700" />
          Próximas citas
        </h2>
        {stats.upcomingBookings.length === 0 ? (
          <p className="text-center py-8 text-charcoal-muted text-sm">
            Aún no hay citas próximas.
          </p>
        ) : (
          <ul className="space-y-2">
            {stats.upcomingBookings.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-mauve-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-mauve-100 flex items-center justify-center text-mauve-700 font-semibold">
                    {b.customer_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-charcoal">{b.customer_name}</p>
                    <p className="text-xs text-charcoal-muted">{b.service_name}</p>
                  </div>
                </div>
                <span className="text-sm text-charcoal capitalize">
                  {new Intl.DateTimeFormat("es-CR", {
                    timeZone: SALON_TZ,
                    weekday: "short",
                    day: "numeric"
                  }).format(new Date(b.starts_at))}{" · "}
                  {formatSalonTime(b.starts_at)}
                </span>
              </li>
            ))}
          </ul>
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
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-mauve-100 p-5 shadow-card">
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${accent} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-xs text-charcoal-muted mb-1">{label}</p>
      <p className="font-serif text-2xl font-semibold text-charcoal">{value}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  description
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-mauve-100 p-5 shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all"
    >
      <div className="w-10 h-10 rounded-full bg-mauve-100 group-hover:bg-gradient-brand flex items-center justify-center mb-3 transition-all">
        <Icon className="w-5 h-5 text-mauve-700 group-hover:text-white" />
      </div>
      <p className="font-serif font-semibold text-charcoal">{label}</p>
      <p className="text-xs text-charcoal-muted">{description}</p>
    </Link>
  );
}
