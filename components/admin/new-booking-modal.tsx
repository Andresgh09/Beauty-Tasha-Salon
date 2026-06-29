"use client";

import { useState, useEffect, useMemo, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, UserPlus, Search, Calendar as CalendarIcon, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCRC, buildSalonISO, SALON_TZ } from "@/lib/utils";
import type { Customer, Service } from "@/lib/supabase/types";
import { createAdminBooking } from "@/lib/actions/bookings";

type Slot = {
  time: string;
  iso: string;
  period: "mañana" | "tarde" | "noche";
  available: boolean;
};

/**
 * Modal de creación manual de cita para admin.
 * - Cliente: dropdown con búsqueda de existentes + opción "Nueva clienta"
 * - Servicios: multi-select
 * - Fecha + hora: respeta business hours y bookings existentes
 */
export function NewBookingModal({
  customers,
  services,
  onClose,
  onCreated
}: {
  customers: Customer[];
  services: Service[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Cliente
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const customerWrapRef = useRef<HTMLDivElement | null>(null);

  // Cerrar dropdown al click afuera
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        customerWrapRef.current &&
        !customerWrapRef.current.contains(e.target as Node)
      ) {
        setCustomerOpen(false);
      }
    }
    if (customerOpen) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [customerOpen]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // Servicios
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Fecha
  const [date, setDate] = useState<string>(""); // YYYY-MM-DD
  const [timeISO, setTimeISO] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [notes, setNotes] = useState("");
  const [sendInvitation, setSendInvitation] = useState(true);

  const totalDuration = useMemo(
    () =>
      selectedServices.reduce((sum, id) => {
        const s = services.find((x) => x.id === id);
        return sum + (s?.duration_minutes ?? 0);
      }, 0),
    [selectedServices, services]
  );
  const totalPrice = useMemo(
    () =>
      selectedServices.reduce((sum, id) => {
        const s = services.find((x) => x.id === id);
        return sum + (s?.price ?? 0);
      }, 0),
    [selectedServices, services]
  );

  // Fetch slots cuando hay fecha + servicios
  useEffect(() => {
    if (!date || selectedServices.length === 0) {
      setSlots([]);
      setTimeISO(null);
      return;
    }
    const primaryId = selectedServices[0];
    setSlotsLoading(true);
    const dateObj = new Date(`${date}T12:00:00-06:00`); // mediodía CR para evitar TZ flips
    fetch(
      `/api/availability?date=${dateObj.toISOString()}&service=${primaryId}&durationOverride=${totalDuration}`
    )
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [date, selectedServices, totalDuration]);

  // Filtrado de clientes por búsqueda
  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    const sorted = q
      ? customers.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q)
        )
      : customers;
    return sorted.slice(0, 50);
  }, [customers, customerQuery]);

  function toggleService(id: string) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    // Validaciones
    if (customerMode === "existing" && !customerId) {
      setError("Seleccioná una clienta o agregá una nueva.");
      return;
    }
    if (customerMode === "new") {
      if (!newName.trim() || !newPhone.trim() || !newEmail.trim()) {
        setError("Completá nombre, teléfono y email de la nueva clienta.");
        return;
      }
    }
    if (selectedServices.length === 0) {
      setError("Seleccioná al menos un servicio.");
      return;
    }
    if (!timeISO) {
      setError("Seleccioná un horario disponible.");
      return;
    }

    startTransition(async () => {
      const payload =
        customerMode === "existing"
          ? {
              customerId: customerId!,
              serviceIds: selectedServices,
              startISO: timeISO,
              notes: notes.trim() || null,
              sendInvitation
            }
          : {
              newCustomer: {
                name: newName.trim(),
                phone: newPhone.trim(),
                email: newEmail.trim().toLowerCase()
              },
              serviceIds: selectedServices,
              startISO: timeISO,
              notes: notes.trim() || null,
              sendInvitation
            };

      const res = await createAdminBooking(payload);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
      onCreated();
    });
  }

  const grouped = useMemo(
    () => ({
      mañana: slots.filter((s) => s.period === "mañana"),
      tarde: slots.filter((s) => s.period === "tarde"),
      noche: slots.filter((s) => s.period === "noche")
    }),
    [slots]
  );
  const noSlotsAvailable =
    !slotsLoading && slots.length > 0 && slots.every((s) => !s.available);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-elevated w-full max-w-2xl p-6 my-8 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-mauve-50 text-charcoal-soft"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-serif text-2xl font-semibold text-charcoal mb-1">
          Nueva cita
        </h3>
        <p className="text-sm text-charcoal-muted mb-5">
          Agregá manualmente una reserva (walk-in, llamada, WhatsApp).
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* CLIENTA */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <Label>Clienta *</Label>
              <div className="flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerMode("existing")}
                  className={cn(
                    "px-3 py-1 rounded-full font-medium",
                    customerMode === "existing"
                      ? "bg-mauve-100 text-mauve-700"
                      : "text-charcoal-muted hover:bg-mauve-50"
                  )}
                >
                  Existente
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode("new")}
                  className={cn(
                    "px-3 py-1 rounded-full font-medium inline-flex items-center gap-1",
                    customerMode === "new"
                      ? "bg-mauve-100 text-mauve-700"
                      : "text-charcoal-muted hover:bg-mauve-50"
                  )}
                >
                  <UserPlus className="w-3 h-3" />
                  Nueva
                </button>
              </div>
            </div>

            {customerMode === "existing" ? (
              <div ref={customerWrapRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted pointer-events-none" />
                  <Input
                    value={customerQuery}
                    onChange={(e) => {
                      setCustomerQuery(e.target.value);
                      setCustomerId(null);
                      setCustomerOpen(true);
                    }}
                    onFocus={() => setCustomerOpen(true)}
                    placeholder={
                      customers.length === 0
                        ? "No hay clientas todavía"
                        : `Buscar entre ${customers.length} clientas...`
                    }
                    className="pl-9 pr-9"
                    autoComplete="off"
                  />
                  <ChevronDown
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted transition-transform pointer-events-none",
                      customerOpen && "rotate-180"
                    )}
                  />
                  {customerId && (
                    <div className="absolute inset-y-0 right-9 flex items-center pointer-events-none">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                </div>

                {customerOpen && customers.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-mauve-200 rounded-xl shadow-elevated max-h-64 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-charcoal-muted">
                        Sin coincidencias.
                        <br />
                        Cambiá a <strong>"Nueva"</strong> arriba para agregarla.
                      </div>
                    ) : (
                      <>
                        {!customerQuery && (
                          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-charcoal-muted bg-mauve-50/40 border-b border-mauve-100">
                            Mostrando {filteredCustomers.length} de {customers.length}
                            {customers.length > filteredCustomers.length && " · escribí para buscar"}
                          </div>
                        )}
                        <ul className="divide-y divide-mauve-50">
                          {filteredCustomers.map((c) => (
                            <li key={c.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomerId(c.id);
                                  setCustomerQuery(c.name);
                                  setCustomerOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-2 hover:bg-mauve-50 transition-colors flex items-center justify-between gap-2",
                                  customerId === c.id && "bg-mauve-100"
                                )}
                              >
                                <div className="min-w-0">
                                  <div className="font-medium text-sm text-charcoal truncate">
                                    {c.name}
                                  </div>
                                  <div className="text-[11px] text-charcoal-muted truncate">
                                    {c.email}
                                  </div>
                                </div>
                                <span className="text-xs text-charcoal-muted whitespace-nowrap flex-shrink-0">
                                  {c.phone}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nombre completo"
                    maxLength={80}
                  />
                </div>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Teléfono"
                  maxLength={30}
                />
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Email"
                  maxLength={80}
                />
              </div>
            )}
          </section>

          {/* SERVICIOS */}
          <section>
            <Label>Servicios * ({selectedServices.length} seleccionado{selectedServices.length === 1 ? "" : "s"})</Label>
            <div className="mt-2 max-h-44 overflow-y-auto border border-mauve-100 rounded-xl divide-y divide-mauve-50">
              {services.map((s) => {
                const checked = selectedServices.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-mauve-50 transition-colors",
                      checked && "bg-mauve-100"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(s.id)}
                      className="w-4 h-4 rounded accent-mauve-600"
                    />
                    <span className="flex-1 text-sm text-charcoal">{s.name}</span>
                    <span className="text-xs text-charcoal-muted">{s.duration_minutes} min</span>
                    <span className="text-sm font-medium text-mauve-700 w-20 text-right">
                      {formatCRC(s.price)}
                    </span>
                  </label>
                );
              })}
            </div>
            {selectedServices.length > 0 && (
              <div className="mt-2 flex items-center justify-between text-sm bg-mauve-50 rounded-xl px-3 py-2">
                <span className="text-charcoal-muted">
                  Total: {totalDuration} min ({(totalDuration / 60).toFixed(1)} h)
                </span>
                <span className="font-semibold text-mauve-700">
                  {formatCRC(totalPrice)}
                </span>
              </div>
            )}
          </section>

          {/* FECHA + HORA */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="nb-date">Fecha *</Label>
              <Input
                id="nb-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTimeISO(null);
                }}
                min={new Date().toISOString().slice(0, 10)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Hora *</Label>
              {!date || selectedServices.length === 0 ? (
                <p className="mt-1 text-xs text-charcoal-muted py-2">
                  Elegí fecha y servicios primero.
                </p>
              ) : slotsLoading ? (
                <p className="mt-1 text-xs text-charcoal-muted py-2">Cargando...</p>
              ) : slots.length === 0 ? (
                <p className="mt-1 text-xs text-amber-600 py-2">
                  El salón está cerrado este día.
                </p>
              ) : noSlotsAvailable ? (
                <p className="mt-1 text-xs text-amber-600 py-2">
                  No entra en los horarios libres ({totalDuration} min).
                </p>
              ) : (
                <select
                  value={timeISO ?? ""}
                  onChange={(e) => setTimeISO(e.target.value || null)}
                  className={cn(
                    "mt-1 w-full rounded-xl border border-mauve-200 bg-white px-3 py-2 text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-mauve-400"
                  )}
                >
                  <option value="">Seleccionar...</option>
                  {(["mañana", "tarde", "noche"] as const).map((p) =>
                    grouped[p].filter((s) => s.available).length > 0 ? (
                      <optgroup key={p} label={p.charAt(0).toUpperCase() + p.slice(1)}>
                        {grouped[p]
                          .filter((s) => s.available)
                          .map((s) => (
                            <option key={s.iso} value={s.iso}>
                              {s.time}
                            </option>
                          ))}
                      </optgroup>
                    ) : null
                  )}
                </select>
              )}
            </div>
          </section>

          {/* NOTAS */}
          <section>
            <Label htmlFor="nb-notes">Notas (opcional)</Label>
            <textarea
              id="nb-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              className={cn(
                "mt-1 w-full rounded-xl border border-mauve-200 bg-white px-3 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-mauve-400 resize-none"
              )}
              placeholder="Detalles, color preferido, alergia, etc."
            />
          </section>

          {/* TOGGLE INVITACIÓN */}
          <label className="flex items-center gap-3 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={sendInvitation}
              onChange={(e) => setSendInvitation(e.target.checked)}
              className="w-4 h-4 rounded accent-mauve-600"
            />
            <span className="flex-1">
              <span className="font-medium text-charcoal">
                Enviar invitación de Google Calendar a la clienta
              </span>
              <span className="block text-xs text-charcoal-muted">
                Desactivá si la cita es solo para tu calendario (walk-in sin email).
              </span>
            </span>
          </label>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2 border-t border-mauve-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creando..." : "Crear cita"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
