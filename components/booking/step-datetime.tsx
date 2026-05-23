"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Sun, CloudSun, Moon, Calendar as CalendarIcon, Clock } from "lucide-react";
import { addDays, format, isSameDay, startOfWeek, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn, formatCRC } from "@/lib/utils";
import type { Service } from "@/lib/supabase/types";

type Slot = {
  time: string;
  iso: string;
  period: "mañana" | "tarde" | "noche";
  available: boolean;
};

const PERIOD_META = {
  mañana: { label: "Mañana", icon: Sun },
  tarde: { label: "Tarde", icon: CloudSun },
  noche: { label: "Noche", icon: Moon }
} as const;

export function DateTimeStep({
  service,
  date,
  timeISO,
  onChange,
  onBack,
  onNext
}: {
  service: Service;
  date: Date | null;
  timeISO: string | null;
  onChange: (date: Date, timeISO: string | null) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  const days = useMemo(
    () => Array.from({ length: 12 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const selectedDate = date ?? new Date();

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    fetch(
      `/api/availability?date=${date.toISOString()}&service=${service.id}`
    )
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [date, service.id]);

  const grouped = {
    mañana: slots.filter((s) => s.period === "mañana"),
    tarde: slots.filter((s) => s.period === "tarde"),
    noche: slots.filter((s) => s.period === "noche")
  };

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8">
      <div>
        <h3 className="font-serif text-2xl font-semibold text-charcoal mb-2">
          Selecciona fecha y hora
        </h3>
        <p className="text-charcoal-soft mb-6">
          Elige el día y la hora que mejor te convenga.
        </p>

        <div className="flex items-center justify-between mb-4">
          <h4 className="font-serif font-semibold text-charcoal capitalize">
            {format(weekStart, "MMMM yyyy", { locale: es })}
          </h4>
          <div className="flex gap-2">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="w-9 h-9 rounded-full border border-mauve-200 flex items-center justify-center hover:bg-mauve-50 cursor-pointer"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="w-9 h-9 rounded-full border border-mauve-200 flex items-center justify-center hover:bg-mauve-50 cursor-pointer"
              aria-label="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-6 md:grid-cols-12 gap-2 mb-8">
          {days.map((d) => {
            const isSelected = date && isSameDay(d, date);
            const isPast = d < new Date(new Date().setHours(0, 0, 0, 0));
            const isSun = d.getDay() === 0;
            const disabled = isPast || isSun;
            return (
              <button
                key={d.toISOString()}
                disabled={disabled}
                onClick={() => onChange(d, null)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 rounded-2xl transition-all cursor-pointer",
                  disabled && "opacity-30 cursor-not-allowed",
                  isSelected
                    ? "bg-gradient-brand text-white shadow-soft"
                    : "hover:bg-mauve-50 text-charcoal"
                )}
              >
                <span className="text-[10px] uppercase font-medium opacity-70">
                  {format(d, "EEE", { locale: es }).slice(0, 3)}
                </span>
                <span
                  className={cn(
                    "text-lg font-semibold",
                    isToday(d) && !isSelected && "text-mauve-700"
                  )}
                >
                  {format(d, "d")}
                </span>
              </button>
            );
          })}
        </div>

        {!date ? (
          <div className="text-center py-10 text-charcoal-muted">
            <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Selecciona una fecha para ver los horarios disponibles.</p>
          </div>
        ) : loading ? (
          <div className="text-center py-10 text-charcoal-muted">
            <div className="w-8 h-8 border-2 border-mauve-300 border-t-mauve-700 rounded-full animate-spin mx-auto mb-3" />
            Cargando horarios...
          </div>
        ) : (
          <div className="space-y-6">
            {(["mañana", "tarde", "noche"] as const).map((period) => {
              const periodSlots = grouped[period];
              if (periodSlots.length === 0) return null;
              const meta = PERIOD_META[period];
              const Icon = meta.icon;
              return (
                <div key={period}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-mauve-700" />
                    <h5 className="font-medium text-charcoal">{meta.label}</h5>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {periodSlots.map((slot) => {
                      const isSelected = timeISO === slot.iso;
                      return (
                        <button
                          key={slot.iso}
                          disabled={!slot.available}
                          onClick={() => onChange(selectedDate, slot.iso)}
                          className={cn(
                            "px-3 py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer",
                            !slot.available &&
                              "opacity-30 cursor-not-allowed line-through",
                            isSelected
                              ? "bg-gradient-brand text-white border-transparent shadow-soft"
                              : slot.available
                              ? "bg-white border-mauve-200 text-charcoal hover:border-mauve-500 hover:bg-mauve-50"
                              : "bg-mauve-50 border-mauve-100 text-charcoal-muted"
                          )}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 self-start">
        <div className="bg-mauve-50 border border-mauve-100 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-mauve-700 font-medium mb-3">
            Tu servicio
          </p>
          <h5 className="font-serif font-semibold text-charcoal text-lg mb-3">
            {service.name}
          </h5>
          <div className="space-y-2 text-sm text-charcoal-soft border-t border-mauve-200 pt-3">
            <div className="flex items-center gap-2">
              <span className="font-accent text-mauve-700 font-semibold">
                {formatCRC(service.price)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>{service.duration_minutes} min</span>
            </div>
            {date && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span className="capitalize">
                  {format(date, "EEEE d 'de' MMMM", { locale: es })}
                </span>
              </div>
            )}
            {timeISO && (
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>{format(new Date(timeISO), "h:mm a")}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="ghost" onClick={onBack} className="flex-1">
            Atrás
          </Button>
          <Button onClick={onNext} disabled={!timeISO} className="flex-1">
            Continuar
          </Button>
        </div>
      </aside>
    </div>
  );
}
