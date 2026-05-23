"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus,
  Trash2,
  Power,
  PowerOff,
  Copy,
  Check,
  Loader2,
  X,
  Tag,
  Percent,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn, formatCRC } from "@/lib/utils";
import type { DiscountCode } from "@/lib/supabase/types";
import {
  createDiscountCode,
  toggleDiscountActive,
  deleteDiscountCode,
  type DiscountInput
} from "@/lib/actions/discounts";

export function DiscountsAdmin({ initial }: { initial: DiscountCode[] }) {
  const [codes, setCodes] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleToggle = (d: DiscountCode) => {
    startTransition(async () => {
      const next = !d.active;
      await toggleDiscountActive(d.id, next);
      setCodes((arr) => arr.map((x) => (x.id === d.id ? { ...x, active: next } : x)));
    });
  };

  const handleDelete = (d: DiscountCode) => {
    if (!confirm(`¿Eliminar el código "${d.code}"?`)) return;
    startTransition(async () => {
      const res = await deleteDiscountCode(d.id);
      if (res.error) return alert(res.error);
      setCodes((arr) => arr.filter((x) => x.id !== d.id));
    });
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-mauve-100 p-4 shadow-card flex items-center justify-between">
        <p className="text-sm text-charcoal-muted">
          {codes.length} código{codes.length !== 1 && "s"} ·{" "}
          {codes.filter((c) => c.active).length} activo
          {codes.filter((c) => c.active).length !== 1 && "s"}
        </p>
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus className="w-4 h-4" />
          Nuevo código
        </Button>
      </div>

      {codes.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-mauve-200 p-12 text-center">
          <Tag className="w-10 h-10 mx-auto mb-3 text-mauve-300" />
          <p className="text-charcoal-muted mb-4">
            Aún no tienes códigos. Crea uno para tu próxima campaña.
          </p>
          <Button onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" />
            Crear código
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {codes.map((d) => {
            const expired = d.valid_until && new Date(d.valid_until) < new Date();
            const maxedOut = d.max_uses && d.uses_count >= d.max_uses;
            return (
              <article
                key={d.id}
                className={cn(
                  "bg-white rounded-2xl border border-mauve-100 p-5 shadow-card",
                  (!d.active || expired || maxedOut) && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <code className="font-mono text-lg font-bold text-charcoal bg-mauve-100 px-3 py-1 rounded-lg truncate">
                      {d.code}
                    </code>
                    <button
                      onClick={() => handleCopy(d.code)}
                      title="Copiar"
                      className="w-8 h-8 rounded-lg hover:bg-mauve-50 text-charcoal-muted hover:text-mauve-700 flex items-center justify-center cursor-pointer flex-shrink-0"
                    >
                      {copied === d.code ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {!d.active && <Badge variant="outline">Inactivo</Badge>}
                  {expired && <Badge variant="outline">Vencido</Badge>}
                  {maxedOut && <Badge variant="outline">Agotado</Badge>}
                </div>

                <div className="space-y-1 mb-3">
                  <p className="font-serif text-xl font-semibold text-mauve-700 flex items-center gap-1">
                    {d.discount_type === "percentage" ? (
                      <>
                        <Percent className="w-4 h-4" />
                        {d.discount_value}% off
                      </>
                    ) : (
                      <>
                        −{formatCRC(d.discount_value)}
                      </>
                    )}
                  </p>
                  {d.description && (
                    <p className="text-xs text-charcoal-muted">{d.description}</p>
                  )}
                </div>

                <div className="text-xs text-charcoal-muted space-y-1 pt-3 border-t border-mauve-100">
                  {d.min_amount > 0 && (
                    <p>Compra mínima: {formatCRC(d.min_amount)}</p>
                  )}
                  {d.max_uses && (
                    <p>Usos: {d.uses_count} / {d.max_uses}</p>
                  )}
                  {d.valid_until && (
                    <p>
                      Vence: {format(parseISO(d.valid_until), "d MMM yyyy", { locale: es })}
                    </p>
                  )}
                </div>

                <div className="flex gap-1 mt-3 -mx-1 -mb-1">
                  <button
                    onClick={() => handleToggle(d)}
                    className="flex-1 h-9 rounded-lg hover:bg-mauve-50 text-charcoal-muted hover:text-charcoal flex items-center justify-center gap-1 text-xs font-medium cursor-pointer"
                  >
                    {d.active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                    {d.active ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() => handleDelete(d)}
                    className="w-9 h-9 rounded-lg hover:bg-red-50 text-charcoal-muted hover:text-red-600 flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {creating && (
        <DiscountEditor
          onClose={() => setCreating(false)}
          onSaved={(c) => {
            setCodes((arr) => [c, ...arr]);
            setCreating(false);
          }}
        />
      )}
    </>
  );
}

function DiscountEditor({
  onClose,
  onSaved
}: {
  onClose: () => void;
  onSaved: (c: DiscountCode) => void;
}) {
  const [form, setForm] = useState<DiscountInput>({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    min_amount: 0,
    max_uses: null,
    valid_until: null,
    active: true
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await createDiscountCode({
        ...form,
        code: form.code.toUpperCase(),
        description: form.description || null,
        max_uses: form.max_uses || null,
        valid_until: form.valid_until || null
      });
      if (res.error) return setError(res.error);
      if (res.code) onSaved(res.code);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-elevated w-full max-w-md p-6 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-charcoal">Nuevo código</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-mauve-50 flex items-center justify-center cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="space-y-3">
          <div>
            <Label>Código *</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="VERANO25"
              maxLength={30}
              className="mt-1.5 font-mono uppercase"
            />
            <p className="text-xs text-charcoal-muted mt-1">
              Solo mayúsculas, números, _ y -
            </p>
          </div>

          <div>
            <Label>Descripción</Label>
            <Input
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Promo de verano 2026"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Tipo de descuento</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setForm({ ...form, discount_type: "percentage", discount_value: 10 })}
                className={cn(
                  "p-3 rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer transition-colors",
                  form.discount_type === "percentage"
                    ? "border-mauve-500 bg-mauve-50"
                    : "border-mauve-100 hover:bg-mauve-50/50"
                )}
              >
                <Percent className="w-4 h-4" />
                Porcentaje
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, discount_type: "fixed", discount_value: 2000 })}
                className={cn(
                  "p-3 rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer transition-colors",
                  form.discount_type === "fixed"
                    ? "border-mauve-500 bg-mauve-50"
                    : "border-mauve-100 hover:bg-mauve-50/50"
                )}
              >
                <DollarSign className="w-4 h-4" />
                Monto fijo
              </button>
            </div>
          </div>

          <div>
            <Label>
              {form.discount_type === "percentage" ? "Porcentaje (%)" : "Monto en colones"}
            </Label>
            <Input
              type="number"
              min="1"
              max={form.discount_type === "percentage" ? 100 : undefined}
              value={form.discount_value}
              onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mín. compra (₡)</Label>
              <Input
                type="number"
                min="0"
                value={form.min_amount}
                onChange={(e) => setForm({ ...form, min_amount: Number(e.target.value) })}
                placeholder="0"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Máx. usos</Label>
              <Input
                type="number"
                min="1"
                value={form.max_uses ?? ""}
                onChange={(e) =>
                  setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="∞"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>Vence el (opcional)</Label>
            <Input
              type="datetime-local"
              value={form.valid_until ? form.valid_until.slice(0, 16) : ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  valid_until: e.target.value ? new Date(e.target.value).toISOString() : null
                })
              }
              className="mt-1.5"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear código
          </Button>
        </div>
      </div>
    </div>
  );
}
