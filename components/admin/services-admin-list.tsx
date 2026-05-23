"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCRC, cn } from "@/lib/utils";
import type { Service } from "@/lib/supabase/types";
import {
  deleteService,
  toggleServiceVisible,
  toggleServiceFeatured
} from "@/lib/actions/services";
import { ServiceEditor } from "./service-editor";

export function ServicesAdminList({
  initialServices
}: {
  initialServices: Service[];
}) {
  const [services, setServices] = useState(initialServices);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [, startTransition] = useTransition();

  const handleSaved = (saved: Service, isNew: boolean) => {
    if (isNew) {
      setServices((s) => [...s, saved]);
    } else {
      setServices((s) => s.map((sv) => (sv.id === saved.id ? saved : sv)));
    }
    setEditing(null);
    setCreating(false);
  };

  const handleDelete = (service: Service) => {
    if (!confirm(`¿Eliminar el servicio "${service.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteService(service.id);
      if (res.error) {
        alert(`Error: ${res.error}`);
        return;
      }
      setServices((s) => s.filter((sv) => sv.id !== service.id));
    });
  };

  const handleToggleVisible = (service: Service) => {
    startTransition(async () => {
      const next = !service.visible;
      const res = await toggleServiceVisible(service.id, next);
      if (res.error) return alert(res.error);
      setServices((s) =>
        s.map((sv) => (sv.id === service.id ? { ...sv, visible: next } : sv))
      );
    });
  };

  const handleToggleFeatured = (service: Service) => {
    startTransition(async () => {
      const next = !service.featured;
      const res = await toggleServiceFeatured(service.id, next);
      if (res.error) return alert(res.error);
      setServices((s) =>
        s.map((sv) => (sv.id === service.id ? { ...sv, featured: next } : sv))
      );
    });
  };

  return (
    <>
      <div className="flex items-center justify-between bg-white rounded-2xl border border-mauve-100 p-4 shadow-card">
        <p className="text-sm text-charcoal-muted">
          {services.length} servicio{services.length !== 1 && "s"} ·{" "}
          {services.filter((s) => s.visible).length} visibles
        </p>
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus className="w-4 h-4" />
          Nuevo servicio
        </Button>
      </div>

      <div className="grid gap-3">
        {services.map((service) => (
          <article
            key={service.id}
            className={cn(
              "bg-white rounded-2xl border border-mauve-100 shadow-card p-4 flex items-center gap-4 transition-opacity",
              !service.visible && "opacity-60"
            )}
          >
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-mauve-100 flex-shrink-0">
              {service.images[0] ? (
                <Image
                  src={service.images[0]}
                  alt={service.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-mauve-300 text-xs">
                  Sin foto
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-serif font-semibold text-charcoal truncate">
                  {service.name}
                </h3>
                {service.featured && <Badge variant="featured">Destacado</Badge>}
                {!service.visible && <Badge variant="outline">Oculto</Badge>}
              </div>
              <div className="flex items-center gap-3 text-sm text-charcoal-muted">
                <span className="font-accent text-mauve-700 font-semibold">
                  {formatCRC(service.price)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {service.duration_minutes} min
                </span>
                <span className="capitalize hidden sm:inline">{service.category}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleToggleFeatured(service)}
                title={service.featured ? "Quitar destacado" : "Destacar"}
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer",
                  service.featured
                    ? "bg-gold/20 text-gold hover:bg-gold/30"
                    : "hover:bg-mauve-50 text-charcoal-muted hover:text-gold"
                )}
              >
                <Star className={cn("w-4 h-4", service.featured && "fill-gold")} />
              </button>
              <button
                onClick={() => handleToggleVisible(service)}
                title={service.visible ? "Ocultar" : "Mostrar"}
                className="w-9 h-9 rounded-lg hover:bg-mauve-50 flex items-center justify-center text-charcoal-muted hover:text-charcoal transition-colors cursor-pointer"
              >
                {service.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setEditing(service)}
                title="Editar"
                className="w-9 h-9 rounded-lg hover:bg-mauve-50 flex items-center justify-center text-charcoal-muted hover:text-mauve-700 transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(service)}
                title="Eliminar"
                className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-charcoal-muted hover:text-red-600 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {(creating || editing) && (
        <ServiceEditor
          service={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
