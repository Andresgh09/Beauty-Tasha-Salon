"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, X, Receipt, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCRC, formatSalonDateMedium } from "@/lib/utils";
import type { Expense, ExpenseCategory } from "@/lib/supabase/types";
import {
  createExpense,
  updateExpense,
  deleteExpense
} from "@/lib/actions/expenses";

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  materials: "Materiales",
  rent: "Alquiler",
  utilities: "Servicios públicos",
  marketing: "Marketing",
  salary: "Salarios",
  equipment: "Equipo",
  maintenance: "Mantenimiento",
  transport: "Transporte",
  other: "Otros"
};

const CATEGORY_ORDER: ExpenseCategory[] = [
  "materials",
  "rent",
  "utilities",
  "marketing",
  "salary",
  "equipment",
  "maintenance",
  "transport",
  "other"
];

function toLocalInput(iso: string): string {
  // ISO → "YYYY-MM-DDTHH:MM" en zona Costa Rica
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function fromLocalInput(local: string): string {
  // "YYYY-MM-DDTHH:MM" interpretado como Costa Rica (-06:00)
  return new Date(`${local}:00-06:00`).toISOString();
}

export function ExpensesSection({ expenses }: { expenses: Expense[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setOpen(true);
  }

  return (
    <section className="bg-white rounded-3xl border border-mauve-100 p-6 shadow-card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="font-serif text-xl font-semibold text-charcoal">Gastos</h2>
          <p className="text-xs text-charcoal-muted">
            Materiales, alquiler, marketing y demás egresos del negocio
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Registrar gasto
        </Button>
      </div>

      {expenses.length === 0 ? (
        <div className="py-10 text-center text-charcoal-muted text-sm">
          <Receipt className="w-8 h-8 mx-auto mb-2 text-mauve-300" />
          No hay gastos registrados en este período.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-charcoal-muted border-b border-mauve-100">
                <th className="px-6 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Categoría</th>
                <th className="px-3 py-2 font-medium">Descripción</th>
                <th className="px-3 py-2 font-medium text-right">Monto</th>
                <th className="px-6 py-2 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mauve-100">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-mauve-50/50 transition-colors">
                  <td className="px-6 py-3 whitespace-nowrap text-charcoal capitalize">
                    {formatSalonDateMedium(e.spent_at)}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-mauve-50 text-mauve-700 border border-mauve-100">
                      {CATEGORY_LABELS[e.category]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-charcoal-soft">
                    {e.description}
                    {e.notes && (
                      <span className="block text-[10px] text-charcoal-muted mt-0.5">
                        {e.notes}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-accent text-red-600 font-semibold whitespace-nowrap">
                    −{formatCRC(e.amount)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <RowActions expense={e} onEdit={() => openEdit(e)} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-mauve-200 font-semibold">
                <td colSpan={3} className="px-6 py-3 text-charcoal text-right">
                  Total gastos
                </td>
                <td className="px-3 py-3 text-right font-accent text-red-700 text-base">
                  −{formatCRC(expenses.reduce((s, e) => s + e.amount, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {open && (
        <ExpenseModal
          expense={editing}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}

function RowActions({
  expense,
  onEdit
}: {
  expense: Expense;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteExpense(expense.id);
      if (res.error) alert(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="inline-flex gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="p-1.5 rounded-lg hover:bg-mauve-50 text-charcoal-soft"
        aria-label="Editar gasto"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      {confirm ? (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="px-2 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Confirmar
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
          aria-label="Borrar gasto"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function ExpenseModal({
  expense,
  onClose
}: {
  expense: Expense | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<ExpenseCategory>(
    expense?.category ?? "materials"
  );
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState<string>(
    expense ? String(expense.amount) : ""
  );
  const [spentAt, setSpentAt] = useState<string>(
    expense ? toLocalInput(expense.spent_at) : toLocalInput(new Date().toISOString())
  );
  const [notes, setNotes] = useState(expense?.notes ?? "");

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    const amt = parseInt(amount, 10);
    if (!description.trim()) {
      setError("Agregá una descripción");
      return;
    }
    if (!amt || amt <= 0) {
      setError("Monto inválido");
      return;
    }
    const payload = {
      category,
      description: description.trim(),
      amount: amt,
      spent_at: fromLocalInput(spentAt),
      notes: notes.trim() || null
    };

    startTransition(async () => {
      const res = expense
        ? await updateExpense(expense.id, payload)
        : await createExpense(payload);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-elevated w-full max-w-md p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-mauve-50 text-charcoal-soft"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
        <h3 className="font-serif text-2xl font-semibold text-charcoal mb-4">
          {expense ? "Editar gasto" : "Registrar gasto"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="exp-category">Categoría</Label>
            <select
              id="exp-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className={cn(
                "mt-1 w-full rounded-xl border border-mauve-200 bg-white px-3 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-mauve-400"
              )}
            >
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="exp-desc">Descripción *</Label>
            <Input
              id="exp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: compra de esmaltes Gelish"
              maxLength={200}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="exp-amount">Monto (CRC) *</Label>
              <Input
                id="exp-amount"
                type="number"
                inputMode="numeric"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="15000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="exp-date">Fecha *</Label>
              <Input
                id="exp-date"
                type="datetime-local"
                value={spentAt}
                onChange={(e) => setSpentAt(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="exp-notes">Notas (opcional)</Label>
            <textarea
              id="exp-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={2}
              className={cn(
                "mt-1 w-full rounded-xl border border-mauve-200 bg-white px-3 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-mauve-400 resize-none"
              )}
              placeholder="Detalles adicionales..."
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : expense ? "Guardar cambios" : "Registrar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
