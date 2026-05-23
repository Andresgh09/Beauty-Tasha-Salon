"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock, ArrowUpRight, X, Calendar } from "lucide-react";
import { categories } from "@/lib/categories";
import type { Service, ServiceCategory } from "@/lib/supabase/types";
import { formatCRC, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/** Emite un evento global para que el componente Booking pre-seleccione el servicio */
function handleAgendar(service: Service) {
  window.dispatchEvent(new CustomEvent("booking:select-service", { detail: service }));
  setTimeout(() => {
    document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth" });
  }, 50);
}

export function Services({ services }: { services: Service[] }) {
  const [active, setActive] = useState<ServiceCategory | "all">("all");
  const [infoService, setInfoService] = useState<Service | null>(null);

  const filtered =
    active === "all" ? services : services.filter((s) => s.category === active);

  return (
    <section id="servicios" className="py-20 lg:py-28 relative">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-sm uppercase tracking-[0.25em] text-mauve-700 mb-3 font-medium">
            Nuestros servicios
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-charcoal mb-4 text-balance">
            Un servicio para cada{" "}
            <span className="italic font-accent text-gradient">momento</span>
          </h2>
          <p className="text-charcoal-soft text-lg">
            Desde manicura clásica hasta extensiones premium. Todo con la
            calidad y cariño que mereces.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-12">
          <button
            onClick={() => setActive("all")}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer",
              active === "all"
                ? "bg-gradient-brand text-white shadow-soft"
                : "bg-white border border-mauve-200 text-charcoal hover:bg-mauve-50"
            )}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer",
                active === cat.id
                  ? "bg-gradient-brand text-white shadow-soft"
                  : "bg-white border border-mauve-200 text-charcoal hover:bg-mauve-50"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-charcoal-muted py-12">
            No hay servicios disponibles por ahora.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((service) => (
              <article
                key={service.id}
                className="group relative bg-white rounded-3xl border border-mauve-100 p-6 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
              >
                {service.featured && (
                  <Badge variant="featured" className="absolute top-4 right-4 z-10">
                    Destacado
                  </Badge>
                )}

                <header className="mb-4">
                  <h3 className="font-serif text-xl font-semibold text-charcoal mb-1">
                    {service.name}
                  </h3>
                  <div className="flex items-baseline gap-3">
                    <span className="font-accent text-2xl font-semibold text-mauve-700">
                      {formatCRC(service.price)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-charcoal-muted">
                      <Clock className="w-3 h-3" />
                      {service.duration_minutes} min
                    </span>
                  </div>
                </header>

                <div className="flex gap-2 mb-4">
                  {service.images.slice(0, 3).map((img, i) => (
                    <div
                      key={i}
                      className={cn(
                        "relative aspect-square rounded-full overflow-hidden border-2 border-white shadow-soft",
                        i === 0 ? "w-16 h-16" : i === 1 ? "w-20 h-20 -ml-3" : "w-14 h-14 -ml-3"
                      )}
                    >
                      <Image
                        src={img}
                        alt={`${service.name} ejemplo ${i + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>

                <p className="text-sm text-charcoal-soft mb-6 leading-relaxed line-clamp-2">
                  {service.short_description}
                </p>

                <div className="flex items-center justify-between gap-3">
                  {service.long_description ? (
                    <button
                      onClick={() => setInfoService(service)}
                      className="text-xs font-medium text-mauve-700 hover:text-mauve-800 underline underline-offset-4 cursor-pointer"
                    >
                      Más información
                    </button>
                  ) : (
                    <span />
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleAgendar(service)}
                  >
                    Agendar
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Modal de descripción larga */}
      {infoService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={infoService.name}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
            onClick={() => setInfoService(null)}
          />

          {/* Panel */}
          <div className="relative bg-white rounded-3xl shadow-elevated max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in-up">
            {/* Header */}
            <div className="sticky top-0 bg-white rounded-t-3xl px-8 pt-8 pb-4 border-b border-mauve-100">
              <button
                onClick={() => setInfoService(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-mauve-100 hover:bg-mauve-200 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4 text-charcoal" />
              </button>
              <p className="text-xs uppercase tracking-[0.2em] text-mauve-600 mb-1 font-medium">
                Información del servicio
              </p>
              <h3 className="font-serif text-2xl font-semibold text-charcoal">
                {infoService.name}
              </h3>
              <div className="flex items-center gap-4 mt-2">
                <span className="font-accent text-xl font-semibold text-mauve-700">
                  {formatCRC(infoService.price)}
                </span>
                <span className="flex items-center gap-1 text-sm text-charcoal-muted">
                  <Clock className="w-3.5 h-3.5" />
                  {infoService.duration_minutes} min
                </span>
              </div>
            </div>

            {/* Imágenes */}
            {infoService.images.length > 0 && (
              <div className="flex gap-3 px-8 pt-6">
                {infoService.images.slice(0, 4).map((img, i) => (
                  <div
                    key={i}
                    className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-soft flex-shrink-0"
                  >
                    <Image
                      src={img}
                      alt={`${infoService.name} ejemplo ${i + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Descripción */}
            <div className="px-8 py-6">
              <p className="text-charcoal-soft leading-relaxed whitespace-pre-line">
                {infoService.long_description}
              </p>
            </div>

            {/* CTA */}
            <div className="px-8 pb-8">
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  setInfoService(null);
                  handleAgendar(infoService);
                }}
              >
                <Calendar className="w-4 h-4" />
                Agendar este servicio
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
