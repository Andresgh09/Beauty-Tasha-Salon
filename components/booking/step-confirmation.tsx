"use client";

import { useState } from "react";
import { CheckCircle2, Calendar, Clock, User, Phone, Mail, FileText, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatCRC,
  formatSalonTime,
  formatSalonDateLong,
  formatSalonDateTimeFull
} from "@/lib/utils";
import type { BookingState } from "./booking";

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function ConfirmationStep({
  state,
  onReset
}: {
  state: BookingState;
  onReset: () => void;
}) {
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });

  const handleConfirm = async () => {
    if (state.services.length === 0 || !state.timeISO) return;
    setSubmit({ status: "loading" });
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceIds: state.services.map((s) => s.id),
          startISO: state.timeISO,
          customer: state.customer
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmit({
          status: "error",
          message: data.error ?? "Error al procesar la reserva."
        });
        return;
      }
      setSubmit({ status: "success", message: data.message });
    } catch (e) {
      setSubmit({
        status: "error",
        message: "Error de conexión. Intenta de nuevo."
      });
    }
  };

  if (submit.status === "success") {
    return (
      <div className="text-center py-8 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="font-serif text-3xl font-semibold text-charcoal mb-3">
          ¡Cita confirmada!
        </h3>
        <p className="text-charcoal-soft mb-2">{submit.message}</p>
        <p className="text-sm text-charcoal-muted mb-8">
          Te esperamos el{" "}
          <span className="font-medium text-charcoal capitalize">
            {state.timeISO && formatSalonDateTimeFull(state.timeISO)}
          </span>
        </p>
        <Button onClick={onReset} variant="outline">
          Reservar otra cita
        </Button>
      </div>
    );
  }

  if (state.services.length === 0 || !state.timeISO) return null;

  const totalDur = state.services.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalPrc = state.services.reduce((sum, s) => sum + s.price, 0);
  const isMulti = state.services.length > 1;

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="font-serif text-2xl font-semibold text-charcoal mb-2">
        Revisa tu reserva
      </h3>
      <p className="text-charcoal-soft mb-6">
        Confirma que todo esté correcto antes de finalizar.
      </p>

      <div className="bg-gradient-soft rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-mauve-700" />
          <p className="text-xs uppercase tracking-wider text-mauve-700 font-medium">
            Resumen
          </p>
        </div>

        {isMulti ? (
          <div className="mb-4">
            <ul className="space-y-1 mb-3">
              {state.services.map((s) => (
                <li
                  key={s.id}
                  className="flex items-baseline justify-between gap-2"
                >
                  <span className="font-serif text-base font-semibold text-charcoal">
                    {s.name}
                  </span>
                  <span className="text-sm text-charcoal-soft">
                    {formatCRC(s.price)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between pt-2 border-t border-mauve-200">
              <span className="text-xs uppercase tracking-wider text-charcoal-muted font-medium">
                Total ({state.services.length} servicios)
              </span>
              <span className="font-accent text-2xl font-semibold text-mauve-700">
                {formatCRC(totalPrc)}
              </span>
            </div>
          </div>
        ) : (
          <>
            <h4 className="font-serif text-xl font-semibold text-charcoal mb-1">
              {state.services[0].name}
            </h4>
            <p className="font-accent text-2xl font-semibold text-mauve-700 mb-4">
              {formatCRC(totalPrc)}
            </p>
          </>
        )}

        <div className="space-y-3 text-sm pt-4 border-t border-mauve-200">
          <Row icon={Calendar} label="Fecha">
            <span className="capitalize">
              {formatSalonDateLong(state.timeISO)}
            </span>
          </Row>
          <Row icon={Clock} label="Hora">
            {formatSalonTime(state.timeISO)} · {totalDur} min
          </Row>
          <Row icon={User} label="Nombre">
            {state.customer.name}
          </Row>
          <Row icon={Phone} label="Teléfono">
            {state.customer.phone}
          </Row>
          <Row icon={Mail} label="Email">
            {state.customer.email}
          </Row>
          {state.customer.notes && (
            <Row icon={FileText} label="Notas">
              {state.customer.notes}
            </Row>
          )}
        </div>
      </div>

      {submit.status === "error" && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 border border-red-200 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{submit.message}</p>
        </div>
      )}

      <Button
        onClick={handleConfirm}
        disabled={submit.status === "loading"}
        size="lg"
        className="w-full"
      >
        {submit.status === "loading" ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Confirmando...
          </>
        ) : (
          "Confirmar reserva"
        )}
      </Button>

      <p className="text-xs text-center text-charcoal-muted mt-4">
        Al confirmar aceptas nuestra política de citas. Te enviaremos un correo
        de confirmación.
      </p>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  children
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-mauve-700 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-charcoal-muted mb-0.5">{label}</p>
        <p className="text-charcoal break-words">{children}</p>
      </div>
    </div>
  );
}
