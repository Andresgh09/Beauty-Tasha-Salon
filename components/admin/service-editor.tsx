"use client";

import { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "./image-uploader";
import { categories } from "@/lib/categories";
import { createService, updateService } from "@/lib/actions/services";
import type { Service, ServiceCategory } from "@/lib/supabase/types";

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function ServiceEditor({
  service,
  onClose,
  onSaved
}: {
  service: Service | null;
  onClose: () => void;
  onSaved: (s: Service, isNew: boolean) => void;
}) {
  const isNew = !service;
  const [form, setForm] = useState({
    slug: service?.slug ?? "",
    name: service?.name ?? "",
    category: (service?.category ?? "manicure") as ServiceCategory,
    price: service?.price ?? 0,
    duration_minutes: service?.duration_minutes ?? 60,
    short_description: service?.short_description ?? "",
    long_description: service?.long_description ?? "",
    images: service?.images ?? ([] as string[]),
    featured: service?.featured ?? false,
    visible: service?.visible ?? true,
    sort_order: service?.sort_order ?? 0
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
        long_description: form.long_description || null
      };
      const res = isNew
        ? await createService(payload)
        : await updateService(service!.id, payload);

      if (res.error) {
        const msg = typeof res.error === "string"
          ? res.error
          : Object.values(res.error).flat().join(". ");
        setError(msg);
        return;
      }

      const savedId = (res as { id?: string }).id ?? service?.id;
      onSaved(
        {
          ...(service ?? {}),
          ...payload,
          id: savedId!,
          created_at: service?.created_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Service,
        isNew
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-elevated w-full max-w-2xl my-8 max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-6 border-b border-mauve-100 sticky top-0 bg-white rounded-t-3xl">
          <h2 className="font-serif text-xl font-semibold text-charcoal">
            {isNew ? "Nuevo servicio" : "Editar servicio"}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-mauve-50 flex items-center justify-center cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Nombre del servicio *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm({ ...form, name, slug: isNew ? slugify(name) : form.slug });
                }}
                placeholder="Ej. Manicure Spa"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="category">Categoría *</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategory })}
                className="mt-1.5 flex h-12 w-full rounded-md border border-mauve-200 bg-white px-4 py-2 text-sm text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                placeholder="manicure-spa"
                required
                className="mt-1.5 font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="price">Precio (₡) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="duration">Duración (min) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                required
                className="mt-1.5"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="short_desc">Descripción corta *</Label>
              <Input
                id="short_desc"
                value={form.short_description}
                onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                placeholder="Una línea para mostrar en el card"
                maxLength={200}
                required
                className="mt-1.5"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="long_desc">Descripción larga</Label>
              <textarea
                id="long_desc"
                value={form.long_description ?? ""}
                onChange={(e) => setForm({ ...form, long_description: e.target.value })}
                rows={3}
                maxLength={2000}
                placeholder="Detalles del servicio (opcional)"
                className="mt-1.5 flex w-full rounded-md border border-mauve-200 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-charcoal-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve-500 resize-none"
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Fotos del servicio</Label>
              <div className="mt-1.5">
                <ImageUploader
                  value={form.images}
                  onChange={(images) => setForm({ ...form, images })}
                  folder="services"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 rounded text-mauve-700 focus:ring-mauve-500"
              />
              <span className="text-sm text-charcoal">Destacado</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.visible}
                onChange={(e) => setForm({ ...form, visible: e.target.checked })}
                className="w-4 h-4 rounded text-mauve-700 focus:ring-mauve-500"
              />
              <span className="text-sm text-charcoal">Visible en el sitio</span>
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}
        </form>

        <footer className="p-6 border-t border-mauve-100 flex gap-2 justify-end sticky bottom-0 bg-white rounded-b-3xl">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isNew ? "Crear servicio" : "Guardar cambios"}
          </Button>
        </footer>
      </div>
    </div>
  );
}
