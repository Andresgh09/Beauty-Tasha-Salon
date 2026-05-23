"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CalendarCheck,
  MoreVertical,
  Trash2,
  Pencil,
  MessageCircle
} from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCRC } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/lib/supabase/types";
import {
  updateBooking,
  deleteBooking,
  type BookingFilter
} from "@/lib/actions/bookings";

const FILTERS: { value: BookingFilter; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "upcoming", label: "Próximas" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "past", label: "Pasadas" },
  { value: "all", label: "Todas" }
];

const STATUS_META: Record<
  BookingStatus,
  { label: string; class: string }
> = {
  pending: { label: "Pendiente", class: "bg-amber-100 text-amber-800 border-amber-200" },
  confirmed: { label: "Confirmada", class: "bg-mauve-100 text-mauve-800 border-mauve-200" },
  completed: { label: "Completada", class: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "Cancelada", class: "bg-red-50 text-red-700 border-red-200" },
  no_show: { label: "No-show", class: "bg-orange-100 text-orange-800 border-orange-200" }
};

export function BookingsAdmin({
  initial,
  activeFilter,
  activeStatus
}: {
  initial: Booking[];
  activeFilter: BookingFilter;
  activeStatus?: BookingStatus;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState(initial);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [, startTransition] = useTransition();

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/citas?${params.toString()}`);
    router.refresh();
  };

  const handleStatusChange = (booking: Booking, status: BookingStatus) => {
    startTransition(async () => {
      const res = await updateBooking(booking.id, { status });
      if (res.error) return alert(res.error);
      setBookings((b) =>
        b.map((bk) => (bk.id === booking.id ? { ...bk, status } : bk))
      );
    });
  };

  const handleDelete = (booking: Booking) => {
    if (!confirm(`¿Eliminar la cita de ${booking.customer_name}?`)) return;
    startTransition(async () => {
      const res = await deleteBooking(booking.id);
      if (res.error) return alert(res.error);
      setBookings((b) => b.filter((bk) => bk.id !== booking.id));
    });
  };

  // Agrupar por día
  const grouped = bookings.reduce<Record<string, Booking[]>>((acc, b) => {
    const key = format(parseISO(b.starts_at), "yyyy-MM-dd");
    (acc[key] ??= []).push(b);
    return acc;
  }, {});

  return (
    <>
      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-mauve-100 p-4 shadow-card space-y-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => updateFilter("filter", f.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                activeFilter === f.value
                  ? "bg-gradient-brand text-white border-transparent shadow-soft"
                  : "bg-white border-mauve-200 text-charcoal hover:bg-mauve-50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-mauve-100">
          <button
            onClick={() => updateFilter("status", undefined)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border",
              !activeStatus
                ? "bg-charcoal text-white border-charcoal"
                : "bg-white border-mauve-200 text-charcoal-soft hover:bg-mauve-50"
            )}
          >
            Todos los estados
          </button>
          {(Object.keys(STATUS_META) as BookingStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => updateFilter("status", s)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border",
                activeStatus === s
                  ? STATUS_META[s].class.replace("bg-", "bg-").replace("text-", "text-")
                  : "bg-white border-mauve-200 text-charcoal-soft hover:bg-mauve-50"
              )}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-mauve-100 p-12 text-center shadow-card">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-mauve-300" />
          <p className="text-charcoal-muted">
            No hay citas para este filtro.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, list]) => (
            <section key={day}>
              <h2 className="font-serif text-base font-semibold text-charcoal-soft mb-3 capitalize px-1">
                {format(parseISO(day), "EEEE d 'de' MMMM", { locale: es })}
                {isSameDay(parseISO(day), new Date()) && (
                  <span className="ml-2 text-xs font-medium text-mauve-700">· Hoy</span>
                )}
              </h2>
              <ul className="space-y-2">
                {list.map((b) => (
                  <li
                    key={b.id}
                    className="bg-white rounded-2xl border border-mauve-100 p-4 shadow-card flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-soft flex flex-col items-center justify-center text-mauve-700 flex-shrink-0">
                      <span className="text-[10px] uppercase font-semibold opacity-70">
                        {format(parseISO(b.starts_at), "HH")}
                      </span>
                      <span className="text-sm font-semibold leading-none">
                        {format(parseISO(b.starts_at), ":mm")}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-serif font-semibold text-charcoal truncate">
                          {b.customer_name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={STATUS_META[b.status].class}
                        >
                          {STATUS_META[b.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-charcoal-soft truncate">
                        {b.service_name} · {formatCRC(b.final_price)} · {b.duration_minutes}m
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-charcoal-muted">
                        <a
                          href={`tel:${b.customer_phone}`}
                          className="flex items-center gap-1 hover:text-mauve-700"
                        >
                          <Phone className="w-3 h-3" />
                          {b.customer_phone}
                        </a>
                        <a
                          href={`https://wa.me/${b.customer_phone.replace(/\D/g, "")}?text=Hola%20${encodeURIComponent(b.customer_name)}%2C%20te%20escribo%20de%20Beauty%20Tasha%20Sal%C3%B3n%20sobre%20tu%20cita%20de%20${encodeURIComponent(b.service_name)}%20el%20${encodeURIComponent(format(parseISO(b.starts_at), "EEEE d 'a las' h:mm a", { locale: es }))}.`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 hover:text-green-600"
                        >
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                        </a>
                        <a
                          href={`mailto:${b.customer_email}`}
                          className="flex items-center gap-1 hover:text-mauve-700"
                        >
                          <Mail className="w-3 h-3" />
                          {b.customer_email}
                        </a>
                      </div>
                      {b.notes && (
                        <p className="text-xs italic text-charcoal-soft mt-2 p-2 bg-mauve-50 rounded-lg">
                          📝 {b.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {b.status !== "completed" && (
                        <button
                          onClick={() => handleStatusChange(b, "completed")}
                          title="Marcar completada"
                          className="w-9 h-9 rounded-lg hover:bg-green-50 text-charcoal-muted hover:text-green-600 flex items-center justify-center cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {b.status !== "no_show" && b.status !== "completed" && (
                        <button
                          onClick={() => handleStatusChange(b, "no_show")}
                          title="Marcar no-show"
                          className="w-9 h-9 rounded-lg hover:bg-orange-50 text-charcoal-muted hover:text-orange-600 flex items-center justify-center cursor-pointer"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}
                      {b.status !== "cancelled" && (
                        <button
                          onClick={() => handleStatusChange(b, "cancelled")}
                          title="Cancelar"
                          className="w-9 h-9 rounded-lg hover:bg-red-50 text-charcoal-muted hover:text-red-600 flex items-center justify-center cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditing(b)}
                        title="Editar notas"
                        className="w-9 h-9 rounded-lg hover:bg-mauve-50 text-charcoal-muted hover:text-mauve-700 flex items-center justify-center cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(b)}
                        title="Eliminar"
                        className="w-9 h-9 rounded-lg hover:bg-red-50 text-charcoal-muted hover:text-red-700 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {editing && (
        <BookingNotesEditor
          booking={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setBookings((b) => b.map((bk) => (bk.id === updated.id ? updated : bk)));
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function BookingNotesEditor({
  booking,
  onClose,
  onSaved
}: {
  booking: Booking;
  onClose: () => void;
  onSaved: (b: Booking) => void;
}) {
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [pending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateBooking(booking.id, { notes });
      if (res.error) return alert(res.error);
      onSaved({ ...booking, notes });
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-elevated w-full max-w-md p-6 space-y-4">
        <h3 className="font-serif text-xl font-semibold text-charcoal">
          Notas de la cita
        </h3>
        <p className="text-sm text-charcoal-muted">
          {booking.customer_name} · {booking.service_name}
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          maxLength={500}
          placeholder="Notas privadas sobre esta cita..."
          className="w-full rounded-md border border-mauve-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve-500 resize-none"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={pending}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
