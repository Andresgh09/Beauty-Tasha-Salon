import { getBusinessHours, getBlockedSlots } from "@/lib/actions/schedule";
import { ScheduleAdmin } from "@/components/admin/schedule-admin";

export const dynamic = "force-dynamic";

export default async function HorariosPage() {
  const [hours, blocks] = await Promise.all([getBusinessHours(), getBlockedSlots()]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-charcoal">Horarios</h1>
        <p className="text-charcoal-soft mt-1">
          Configura tus horarios de atención y bloquea días para vacaciones o descansos.
        </p>
      </header>
      <ScheduleAdmin initialHours={hours} initialBlocks={blocks} />
    </div>
  );
}
