import { getBookings, type BookingFilter } from "@/lib/actions/bookings";
import { BookingsAdmin } from "@/components/admin/bookings-admin";
import type { BookingStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function BookingsAdminPage({
  searchParams
}: {
  searchParams: { filter?: string; status?: string };
}) {
  const filter = (searchParams.filter as BookingFilter) ?? "upcoming";
  const status = searchParams.status as BookingStatus | undefined;
  const bookings = await getBookings(filter, status);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-charcoal">Citas</h1>
        <p className="text-charcoal-soft mt-1">
          Gestiona tu agenda. Cambia estado, edita notas o cancela citas.
        </p>
      </header>
      <BookingsAdmin initial={bookings} activeFilter={filter} activeStatus={status} />
    </div>
  );
}
