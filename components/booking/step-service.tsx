"use client";

import Image from "next/image";
import { Clock, Check, Plus } from "lucide-react";
import { formatCRC, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { totalDuration, totalPrice } from "./booking";
import type { Service } from "@/lib/supabase/types";

const MAX_SERVICES = 5;

export function ServiceStep({
  services,
  selected,
  onChange,
  onNext
}: {
  services: Service[];
  selected: Service[];
  onChange: (services: Service[]) => void;
  onNext: () => void;
}) {
  const selectedIds = new Set(selected.map((s) => s.id));

  const toggle = (service: Service) => {
    if (selectedIds.has(service.id)) {
      onChange(selected.filter((s) => s.id !== service.id));
    } else if (selected.length >= MAX_SERVICES) {
      // No agregar más del límite
      return;
    } else {
      onChange([...selected, service]);
    }
  };

  const sumDuration = totalDuration(selected);
  const sumPrice = totalPrice(selected);

  return (
    <div>
      <h3 className="font-serif text-2xl font-semibold text-charcoal mb-2">
        ¿Qué servicios te interesan?
      </h3>
      <p className="text-charcoal-soft mb-6">
        Podés combinar varios (ej: manicura + pedicura). Se cobra y se reserva
        el tiempo total.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {services.map((service) => {
          const isSelected = selectedIds.has(service.id);
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => toggle(service)}
              className={cn(
                "group relative text-left p-4 rounded-2xl border-2 transition-all cursor-pointer",
                isSelected
                  ? "border-mauve-500 bg-mauve-50 shadow-soft"
                  : "border-mauve-100 bg-white hover:border-mauve-300 hover:shadow-card"
              )}
            >
              <div
                className={cn(
                  "absolute top-3 right-3 w-6 h-6 rounded-md flex items-center justify-center transition-all",
                  isSelected
                    ? "bg-gradient-brand text-white"
                    : "bg-white border-2 border-mauve-200 text-transparent group-hover:border-mauve-400"
                )}
              >
                {isSelected ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3 h-3 text-mauve-400 opacity-0 group-hover:opacity-100" />
                )}
              </div>
              {service.images[0] && (
                <div className="relative w-14 h-14 rounded-full overflow-hidden mb-3 ring-2 ring-white shadow-soft">
                  <Image
                    src={service.images[0]}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              )}
              <h4 className="font-serif font-semibold text-charcoal mb-1 pr-8">
                {service.name}
              </h4>
              <div className="flex items-center justify-between mt-2">
                <span className="font-accent text-lg font-semibold text-mauve-700">
                  {formatCRC(service.price)}
                </span>
                <span className="flex items-center gap-1 text-xs text-charcoal-muted">
                  <Clock className="w-3 h-3" />
                  {service.duration_minutes}m
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Resumen del combo + CTA */}
      {selected.length > 0 ? (
        <div className="bg-gradient-soft rounded-2xl p-5 border border-mauve-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-mauve-700 font-medium mb-1">
              Tu selección
            </p>
            <p className="text-sm text-charcoal-soft mb-2">
              {selected.length === 1
                ? selected[0].name
                : selected.map((s) => s.name).join(" + ")}
            </p>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-accent text-2xl font-semibold text-mauve-700">
                {formatCRC(sumPrice)}
              </span>
              <span className="flex items-center gap-1 text-sm text-charcoal-muted">
                <Clock className="w-3.5 h-3.5" />
                {sumDuration} min total
              </span>
              {selected.length > 1 && (
                <span className="text-xs text-charcoal-muted">
                  · {selected.length} servicios
                </span>
              )}
            </div>
          </div>
          <Button onClick={onNext} size="lg" className="sm:flex-shrink-0">
            Continuar
          </Button>
        </div>
      ) : (
        <p className="text-center text-sm text-charcoal-muted py-4">
          Seleccioná al menos un servicio para continuar.
        </p>
      )}

      {selected.length >= MAX_SERVICES && (
        <p className="text-xs text-amber-700 text-center mt-3">
          Máximo {MAX_SERVICES} servicios por cita.
        </p>
      )}
    </div>
  );
}
