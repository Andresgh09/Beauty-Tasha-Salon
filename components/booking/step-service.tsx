"use client";

import Image from "next/image";
import { Clock, Check } from "lucide-react";
import { formatCRC, cn } from "@/lib/utils";
import type { Service } from "@/lib/supabase/types";

export function ServiceStep({
  services,
  selected,
  onSelect
}: {
  services: Service[];
  selected: Service | null;
  onSelect: (s: Service) => void;
}) {
  return (
    <div>
      <h3 className="font-serif text-2xl font-semibold text-charcoal mb-2">
        ¿Qué servicio te interesa?
      </h3>
      <p className="text-charcoal-soft mb-6">
        Selecciona el servicio para ver disponibilidad.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const isSelected = selected?.id === service.id;
          return (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className={cn(
                "group relative text-left p-4 rounded-2xl border-2 transition-all cursor-pointer",
                isSelected
                  ? "border-mauve-500 bg-mauve-50 shadow-soft"
                  : "border-mauve-100 bg-white hover:border-mauve-300 hover:shadow-card"
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-brand flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
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
              <h4 className="font-serif font-semibold text-charcoal mb-1">
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
    </div>
  );
}
