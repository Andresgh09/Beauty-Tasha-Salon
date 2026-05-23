"use client";

import { useState, useEffect } from "react";
import { Sparkles, Check } from "lucide-react";
import { ServiceStep } from "./step-service";
import { DateTimeStep } from "./step-datetime";
import { ContactStep } from "./step-contact";
import { ConfirmationStep } from "./step-confirmation";
import { cn } from "@/lib/utils";
import type { Service } from "@/lib/supabase/types";

export type BookingState = {
  services: Service[];
  date: Date | null;
  timeISO: string | null;
  customer: {
    name: string;
    phone: string;
    email: string;
    notes: string;
  };
};

/** Suma de duraciones de todos los servicios seleccionados (en minutos) */
export function totalDuration(services: Service[]): number {
  return services.reduce((sum, s) => sum + s.duration_minutes, 0);
}

/** Suma de precios de todos los servicios seleccionados */
export function totalPrice(services: Service[]): number {
  return services.reduce((sum, s) => sum + s.price, 0);
}

const STEPS = [
  { id: 1, label: "Servicio" },
  { id: 2, label: "Fecha y hora" },
  { id: 3, label: "Datos" },
  { id: 4, label: "Confirmación" }
];

export function Booking({ services }: { services: Service[] }) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<BookingState>({
    services: [],
    date: null,
    timeISO: null,
    customer: { name: "", phone: "", email: "", notes: "" }
  });

  const update = (patch: Partial<BookingState>) =>
    setState((s) => ({ ...s, ...patch }));

  // Escuchar el evento emitido desde la sección de Servicios
  // (un solo servicio pre-seleccionado al hacer click en "Agendar")
  useEffect(() => {
    const handler = (e: Event) => {
      const service = (e as CustomEvent<Service>).detail;
      setState({
        services: [service],
        date: null,
        timeISO: null,
        customer: { name: "", phone: "", email: "", notes: "" }
      });
      setStep(2);
    };
    window.addEventListener("booking:select-service", handler);
    return () => window.removeEventListener("booking:select-service", handler);
  }, []);

  return (
    <section id="reservar" className="py-20 lg:py-28 relative">
      <div
        className="absolute inset-0 bg-mesh-mauve opacity-30 -z-10"
        aria-hidden="true"
      />

      <div className="container max-w-5xl">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 glass-mauve rounded-full px-4 py-1.5 text-xs font-medium text-mauve-700 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Reserva online
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-charcoal mb-4 text-balance">
            Agenda tu{" "}
            <span className="italic font-accent text-gradient">cita</span>
          </h2>
          <p className="text-charcoal-soft text-lg">
            En 4 pasos sencillos. Recibirás confirmación por correo y un
            recordatorio antes de tu cita.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 md:gap-4 mb-10 overflow-x-auto">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-2 md:gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    step > s.id
                      ? "bg-gradient-brand text-white"
                      : step === s.id
                      ? "bg-gradient-brand text-white shadow-glow ring-4 ring-mauve-200"
                      : "bg-white border border-mauve-200 text-charcoal-muted"
                  )}
                >
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <span
                  className={cn(
                    "text-xs md:text-sm font-medium whitespace-nowrap hidden sm:block",
                    step >= s.id ? "text-charcoal" : "text-charcoal-muted"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-6 md:w-12 h-0.5 transition-colors",
                    step > s.id ? "bg-mauve-500" : "bg-mauve-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white border border-mauve-100 rounded-3xl p-6 md:p-10 shadow-elevated">
          {step === 1 && (
            <ServiceStep
              services={services}
              selected={state.services}
              onChange={(s) => update({ services: s })}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && state.services.length > 0 && (
            <DateTimeStep
              services={state.services}
              date={state.date}
              timeISO={state.timeISO}
              onChange={(date, timeISO) => update({ date, timeISO })}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && state.services.length > 0 && state.timeISO && (
            <ContactStep
              customer={state.customer}
              onChange={(customer) => update({ customer })}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}
          {step === 4 && state.services.length > 0 && state.timeISO && (
            <ConfirmationStep
              state={state}
              onReset={() => {
                setState({
                  services: [],
                  date: null,
                  timeISO: null,
                  customer: { name: "", phone: "", email: "", notes: "" }
                });
                setStep(1);
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
