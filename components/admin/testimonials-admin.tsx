"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Loader2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/lib/supabase/types";
import {
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonialVisible,
  type TestimonialInput
} from "@/lib/actions/testimonials";

export function TestimonialsAdmin({ initial }: { initial: Testimonial[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [creating, setCreating] = useState(false);
  const [, startTransition] = useTransition();

  const handleSaved = (saved: Testimonial, isNew: boolean) => {
    if (isNew) setItems((i) => [...i, saved]);
    else setItems((i) => i.map((t) => (t.id === saved.id ? saved : t)));
    setEditing(null);
    setCreating(false);
  };

  const handleDelete = (t: Testimonial) => {
    if (!confirm(`¿Eliminar el testimonio de ${t.customer_name}?`)) return;
    startTransition(async () => {
      const res = await deleteTestimonial(t.id);
      if (res.error) return alert(res.error);
      setItems((i) => i.filter((x) => x.id !== t.id));
    });
  };

  const handleToggle = (t: Testimonial) => {
    startTransition(async () => {
      const next = !t.visible;
      await toggleTestimonialVisible(t.id, next);
      setItems((i) => i.map((x) => (x.id === t.id ? { ...x, visible: next } : x)));
    });
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-mauve-100 p-4 shadow-card flex items-center justify-between">
        <p className="text-sm text-charcoal-muted">
          {items.length} testimonio{items.length !== 1 && "s"} ·{" "}
          {items.filter((i) => i.visible).length} publicado
          {items.filter((i) => i.visible).length !== 1 && "s"}
        </p>
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus className="w-4 h-4" />
          Nuevo testimonio
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((t) => (
          <article
            key={t.id}
            className={cn(
              "bg-white rounded-2xl border border-mauve-100 p-5 shadow-card",
              !t.visible && "opacity-60"
            )}
          >
            <div className="flex items-center gap-1 mb-2">
              {[...Array(t.rating)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
              ))}
              {!t.visible && (
                <Badge variant="outline" className="ml-auto">Oculto</Badge>
              )}
            </div>
            <p className="text-sm text-charcoal-soft leading-relaxed mb-3 line-clamp-4">
              &ldquo;{t.text}&rdquo;
            </p>
            <div className="flex items-center gap-2 pt-3 border-t border-mauve-100">
              {t.customer_avatar ? (
                <div className="relative w-9 h-9 rounded-full overflow-hidden">
                  <Image src={t.customer_avatar} alt={t.customer_name} fill sizes="36px" className="object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-mauve-100 flex items-center justify-center text-mauve-700 text-sm font-semibold">
                  {t.customer_name[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-charcoal truncate">
                  {t.customer_name}
                </p>
                {t.customer_role && (
                  <p className="text-[10px] text-charcoal-muted truncate">{t.customer_role}</p>
                )}
              </div>
            </div>
            <div className="flex gap-1 mt-3 -mb-2 -mx-1">
              <button
                onClick={() => handleToggle(t)}
                className="flex-1 h-8 rounded-lg hover:bg-mauve-50 text-charcoal-muted flex items-center justify-center cursor-pointer"
                title={t.visible ? "Ocultar" : "Mostrar"}
              >
                {t.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setEditing(t)}
                className="flex-1 h-8 rounded-lg hover:bg-mauve-50 text-charcoal-muted hover:text-mauve-700 flex items-center justify-center cursor-pointer"
                title="Editar"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(t)}
                className="flex-1 h-8 rounded-lg hover:bg-red-50 text-charcoal-muted hover:text-red-600 flex items-center justify-center cursor-pointer"
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {(creating || editing) && (
        <TestimonialEditor
          item={editing}
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

function TestimonialEditor({
  item,
  onClose,
  onSaved
}: {
  item: Testimonial | null;
  onClose: () => void;
  onSaved: (t: Testimonial, isNew: boolean) => void;
}) {
  const isNew = !item;
  const [form, setForm] = useState<TestimonialInput>({
    customer_name: item?.customer_name ?? "",
    customer_role: item?.customer_role ?? "",
    customer_avatar: item?.customer_avatar ?? "",
    rating: item?.rating ?? 5,
    text: item?.text ?? "",
    visible: item?.visible ?? true,
    featured: item?.featured ?? false,
    sort_order: item?.sort_order ?? 0
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = isNew
        ? await createTestimonial(form)
        : await updateTestimonial(item!.id, form);
      if (res.error) return setError(res.error);
      const saved = (res as { testimonial?: Testimonial }).testimonial ??
        ({ ...item, ...form, id: item?.id, created_at: item?.created_at ?? new Date().toISOString() } as Testimonial);
      onSaved(saved, isNew);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-elevated w-full max-w-lg max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-6 border-b border-mauve-100">
          <h2 className="font-serif text-xl font-semibold text-charcoal">
            {isNew ? "Nuevo testimonio" : "Editar testimonio"}
          </h2>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-mauve-50 flex items-center justify-center cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Rol / Etiqueta</Label>
              <Input
                value={form.customer_role ?? ""}
                onChange={(e) => setForm({ ...form, customer_role: e.target.value })}
                placeholder="Clienta hace 2 años"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>URL del avatar (opcional)</Label>
            <Input
              type="url"
              value={form.customer_avatar ?? ""}
              onChange={(e) => setForm({ ...form, customer_avatar: e.target.value })}
              placeholder="https://... (deja vacío para usar iniciales)"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Calificación (1-5 estrellas)</Label>
            <div className="flex gap-1 mt-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm({ ...form, rating: n })}
                  className="p-1 cursor-pointer"
                >
                  <Star
                    className={cn(
                      "w-7 h-7",
                      n <= form.rating ? "fill-gold text-gold" : "text-mauve-200"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Texto del testimonio *</Label>
            <textarea
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              rows={5}
              maxLength={500}
              required
              className="mt-1.5 w-full rounded-md border border-mauve-200 bg-white px-4 py-3 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve-500"
            />
            <p className="text-xs text-charcoal-muted mt-1">
              {form.text.length}/500
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.visible}
              onChange={(e) => setForm({ ...form, visible: e.target.checked })}
              className="w-4 h-4 rounded text-mauve-700"
            />
            <span className="text-sm text-charcoal">Publicado en el sitio</span>
          </label>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}
        </form>

        <footer className="p-6 border-t border-mauve-100 flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isNew ? "Crear" : "Guardar"}
          </Button>
        </footer>
      </div>
    </div>
  );
}
