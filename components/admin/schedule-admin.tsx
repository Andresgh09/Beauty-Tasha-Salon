"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus,
  Trash2,
  CalendarOff,
  Loader2,
  Save,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { BusinessHours, BlockedSlot } from "@/lib/supabase/types";
import {
  updateBusinessHours,
  createBlockedSlot,
  deleteBlockedSlot
} from "@/lib/actions/schedule";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function ScheduleAdmin({
  initialHours,
  initialBlocks
}: {
  initialHours: BusinessHours[];
  initialBlocks: BlockedSlot[];
}) {
  const [hours, setHours] = useState(initialHours);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [showAddBlock, setShowAddBlock] = useState(false);

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl border border-mauve-100 p-6 shadow-card">
        <h2 className="font-serif text-xl font-semibold text-charcoal mb-4">
          Horarios de atención
        </h2>

        <div className="space-y-3">
          {hours
            .sort((a, b) => {
              // Lunes primero, domingo al final
              const aOrder = a.day_of_week === 0 ? 7 : a.day_of_week;
              const bOrder = b.day_of_week === 0 ? 7 : b.day_of_week;
              return aOrder - bOrder;
            })
            .map((h) => (
              <DayRow
                key={h.id}
                hours={h}
                onSaved={(updated) =>
                  setHours((arr) => arr.map((x) => (x.id === updated.id ? updated : x)))
                }
              />
            ))}
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-mauve-100 p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-xl font-semibold text-charcoal">
              Bloqueos (vacaciones, descansos)
            </h2>
            <p className="text-sm text-charcoal-muted mt-1">
              Bloquea fechas u horarios específicos para que no se pueda reservar.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAddBlock(true)}>
            <Plus className="w-4 h-4" />
            Bloquear
          </Button>
        </div>

        {blocks.length === 0 ? (
          <div className="text-center py-10 text-charcoal-muted">
            <CalendarOff className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay bloqueos activos.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {blocks.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between p-3 rounded-xl bg-mauve-50/40 border border-mauve-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <CalendarOff className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal capitalize">
                      {format(parseISO(b.starts_at), "EEE d 'de' MMM, h:mm a", { locale: es })}
                      {" → "}
                      {format(parseISO(b.ends_at), "EEE d 'de' MMM, h:mm a", { locale: es })}
                    </p>
                    {b.reason && (
                      <p className="text-xs text-charcoal-muted">{b.reason}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm("¿Eliminar este bloqueo?")) return;
                    const res = await deleteBlockedSlot(b.id);
                    if (res.error) return alert(res.error);
                    setBlocks((arr) => arr.filter((x) => x.id !== b.id));
                  }}
                  className="w-9 h-9 rounded-lg hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-charcoal-muted cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showAddBlock && (
        <AddBlockModal
          onClose={() => setShowAddBlock(false)}
          onSaved={(b) => {
            setBlocks((arr) => [...arr, b].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
            setShowAddBlock(false);
          }}
        />
      )}
    </div>
  );
}

function DayRow({
  hours,
  onSaved
}: {
  hours: BusinessHours;
  onSaved: (h: BusinessHours) => void;
}) {
  const [form, setForm] = useState(hours);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const [savedTick, setSavedTick] = useState(false);

  const update = (patch: Partial<BusinessHours>) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateBusinessHours(form.day_of_week, {
        day_of_week: form.day_of_week,
        is_open: form.is_open,
        morning_open: form.morning_open,
        morning_close: form.morning_close,
        afternoon_open: form.afternoon_open,
        afternoon_close: form.afternoon_close,
        evening_open: form.evening_open,
        evening_close: form.evening_close,
        slot_duration_minutes: form.slot_duration_minutes
      });
      if (res.error) return alert(res.error);
      onSaved(form);
      setDirty(false);
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 1500);
    });
  };

  return (
    <div
      className={cn(
        "p-4 rounded-2xl border transition-colors",
        form.is_open ? "bg-white border-mauve-100" : "bg-mauve-50/40 border-mauve-100 opacity-70"
      )}
    >
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_open}
              onChange={(e) => update({ is_open: e.target.checked })}
              className="w-4 h-4 rounded text-mauve-700"
            />
            <span className="font-serif font-semibold text-charcoal w-24">
              {DAY_NAMES[form.day_of_week]}
            </span>
          </label>
          {!form.is_open && (
            <span className="text-xs text-charcoal-muted">Cerrado</span>
          )}
        </div>
        {dirty && (
          <Button onClick={handleSave} size="sm" disabled={pending}>
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : savedTick ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            Guardar
          </Button>
        )}
        {!dirty && savedTick && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="w-3 h-3" /> Guardado
          </span>
        )}
      </div>

      {form.is_open && (
        <div className="grid sm:grid-cols-3 gap-3">
          <PeriodRow
            label="Mañana"
            open={form.morning_open}
            close={form.morning_close}
            onChange={(open, close) => update({ morning_open: open, morning_close: close })}
          />
          <PeriodRow
            label="Tarde"
            open={form.afternoon_open}
            close={form.afternoon_close}
            onChange={(open, close) => update({ afternoon_open: open, afternoon_close: close })}
          />
          <PeriodRow
            label="Noche"
            open={form.evening_open}
            close={form.evening_close}
            onChange={(open, close) => update({ evening_open: open, evening_close: close })}
          />
        </div>
      )}
    </div>
  );
}

function PeriodRow({
  label,
  open,
  close,
  onChange
}: {
  label: string;
  open: string | null;
  close: string | null;
  onChange: (open: string | null, close: string | null) => void;
}) {
  const enabled = !!open && !!close;
  return (
    <div className="p-3 rounded-xl bg-mauve-50/50 border border-mauve-100">
      <label className="flex items-center gap-2 mb-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            if (e.target.checked) onChange("09:00", "12:00");
            else onChange(null, null);
          }}
          className="w-3.5 h-3.5 rounded text-mauve-700"
        />
        <span className="text-xs font-medium text-charcoal">{label}</span>
      </label>
      {enabled && (
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={open?.slice(0, 5) ?? ""}
            onChange={(e) => onChange(e.target.value, close)}
            className="flex-1 px-2 py-1.5 rounded-md border border-mauve-200 bg-white text-xs"
          />
          <span className="text-xs text-charcoal-muted">a</span>
          <input
            type="time"
            value={close?.slice(0, 5) ?? ""}
            onChange={(e) => onChange(open, e.target.value)}
            className="flex-1 px-2 py-1.5 rounded-md border border-mauve-200 bg-white text-xs"
          />
        </div>
      )}
    </div>
  );
}

function AddBlockModal({
  onClose,
  onSaved
}: {
  onClose: () => void;
  onSaved: (b: BlockedSlot) => void;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState(today);
  const [endTime, setEndTime] = useState("19:30");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const starts_at = new Date(`${startDate}T${startTime}:00`).toISOString();
      const ends_at = new Date(`${endDate}T${endTime}:00`).toISOString();
      const res = await createBlockedSlot({
        starts_at,
        ends_at,
        reason: reason || null
      });
      if (res.error) return setError(res.error);
      if (res.slot) onSaved(res.slot);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-elevated w-full max-w-md p-6 space-y-4">
        <h3 className="font-serif text-xl font-semibold text-charcoal">
          Bloquear horario
        </h3>

        <div className="space-y-3">
          <div>
            <Label>Desde</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Hasta</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Vacaciones, médico, descanso..."
              maxLength={200}
              className="mt-1.5"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            Bloquear
          </Button>
        </div>
      </div>
    </div>
  );
}
