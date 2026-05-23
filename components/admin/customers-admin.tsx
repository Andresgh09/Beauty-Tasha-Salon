"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  DollarSign,
  Pencil,
  Trash2,
  X,
  Loader2,
  Cake,
  StickyNote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCRC } from "@/lib/utils";
import type { Customer, Booking } from "@/lib/supabase/types";
import {
  updateCustomer,
  deleteCustomer,
  getCustomerWithHistory
} from "@/lib/actions/customers";

export function CustomersAdmin({ initial }: { initial: Customer[] }) {
  const [customers, setCustomers] = useState(initial);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [viewing, setViewing] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    if (!search) return customers;
    const s = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.phone.includes(s)
    );
  }, [customers, search]);

  return (
    <>
      <div className="bg-white rounded-2xl border border-mauve-100 p-4 shadow-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className="pl-10"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-mauve-100 p-12 text-center shadow-card">
          <p className="text-charcoal-muted">
            {customers.length === 0
              ? "Aún no hay clientas. Aparecerán aquí cuando alguien reserve."
              : "No se encontraron clientas con esa búsqueda."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-mauve-100 shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-mauve-50/50 border-b border-mauve-100">
              <tr className="text-xs text-charcoal-muted uppercase tracking-wider">
                <th className="text-left p-3 font-medium">Nombre</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Contacto</th>
                <th className="text-right p-3 font-medium">Visitas</th>
                <th className="text-right p-3 font-medium hidden sm:table-cell">Total gastado</th>
                <th className="text-right p-3 font-medium hidden lg:table-cell">Última visita</th>
                <th className="text-right p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mauve-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-mauve-50/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => setViewing(c)}
                          className="text-sm font-medium text-charcoal hover:text-mauve-700 truncate text-left cursor-pointer"
                        >
                          {c.name}
                        </button>
                        {c.notes && (
                          <StickyNote className="w-3 h-3 text-mauve-500 inline ml-1" />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <div className="flex flex-col gap-1 text-xs text-charcoal-muted">
                      <a href={`tel:${c.phone}`} className="hover:text-mauve-700 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {c.phone}
                      </a>
                      <a href={`mailto:${c.email}`} className="hover:text-mauve-700 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" />
                        {c.email}
                      </a>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-semibold text-charcoal">{c.total_bookings}</span>
                  </td>
                  <td className="p-3 text-right hidden sm:table-cell">
                    <span className="font-accent text-mauve-700 font-semibold text-sm">
                      {formatCRC(c.total_spent)}
                    </span>
                  </td>
                  <td className="p-3 text-right hidden lg:table-cell text-xs text-charcoal-muted">
                    {c.last_visit_at
                      ? format(parseISO(c.last_visit_at), "d MMM yyyy", { locale: es })
                      : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <a
                        href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        title="WhatsApp"
                        className="w-8 h-8 rounded-lg hover:bg-green-50 hover:text-green-600 text-charcoal-muted flex items-center justify-center"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => setEditing(c)}
                        title="Editar"
                        className="w-8 h-8 rounded-lg hover:bg-mauve-50 hover:text-mauve-700 text-charcoal-muted flex items-center justify-center cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <CustomerEditor
          customer={editing}
          onClose={() => setEditing(null)}
          onSaved={(c) => {
            setCustomers((arr) => arr.map((x) => (x.id === c.id ? c : x)));
            setEditing(null);
          }}
          onDelete={(id) => {
            setCustomers((arr) => arr.filter((x) => x.id !== id));
            setEditing(null);
          }}
        />
      )}

      {viewing && (
        <CustomerHistory
          customer={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
        />
      )}
    </>
  );
}

function CustomerEditor({
  customer,
  onClose,
  onSaved,
  onDelete
}: {
  customer: Customer;
  onClose: () => void;
  onSaved: (c: Customer) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState({
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    birthday: customer.birthday ?? "",
    notes: customer.notes ?? ""
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateCustomer(customer.id, {
        ...form,
        birthday: form.birthday || null,
        notes: form.notes || null
      });
      if (res.error) return setError(res.error);
      onSaved({ ...customer, ...form, birthday: form.birthday || null, notes: form.notes || null });
    });
  };

  const handleDelete = () => {
    if (!confirm(`¿Eliminar a ${customer.name}? Las citas se mantendrán pero quedarán sin cliente asociado.`)) return;
    startTransition(async () => {
      const res = await deleteCustomer(customer.id);
      if (res.error) return alert(res.error);
      onDelete(customer.id);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-elevated w-full max-w-lg max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-6 border-b border-mauve-100">
          <h2 className="font-serif text-xl font-semibold text-charcoal">Editar clienta</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-mauve-50 flex items-center justify-center cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label>Nombre completo</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Cumpleaños</Label>
              <Input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label>Notas privadas</Label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={5}
              maxLength={1000}
              placeholder="Alergias, color favorito, preferencias..."
              className="mt-1.5 w-full rounded-md border border-mauve-200 bg-white px-4 py-3 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve-500"
            />
            <p className="text-xs text-charcoal-muted mt-1">{form.notes.length}/1000 · Solo tú ves esto</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        <footer className="p-6 border-t border-mauve-100 flex gap-2 justify-between">
          <Button variant="ghost" onClick={handleDelete} disabled={pending} className="text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
            Eliminar
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={pending}>
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function CustomerHistory({
  customer,
  onClose,
  onEdit
}: {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [data, setData] = useState<{ bookings: Booking[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomerWithHistory(customer.id).then(({ bookings }) => {
      setData({ bookings });
      setLoading(false);
    });
  }, [customer.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-elevated w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-6 border-b border-mauve-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-brand flex items-center justify-center text-white text-lg font-semibold">
              {customer.name[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-charcoal">{customer.name}</h2>
              <p className="text-xs text-charcoal-muted">{customer.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-mauve-50 flex items-center justify-center cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-3">
            <Stat icon={Calendar} label="Visitas" value={customer.total_bookings.toString()} />
            <Stat icon={DollarSign} label="Total" value={formatCRC(customer.total_spent)} />
            <Stat
              icon={Cake}
              label="Cumple"
              value={customer.birthday ? format(parseISO(customer.birthday), "d MMM", { locale: es }) : "—"}
            />
          </div>

          {customer.notes && (
            <div className="p-4 rounded-2xl bg-mauve-50 border border-mauve-100">
              <p className="text-xs uppercase tracking-wider text-mauve-700 font-medium mb-2 flex items-center gap-1">
                <StickyNote className="w-3 h-3" />
                Notas privadas
              </p>
              <p className="text-sm text-charcoal whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}

          <div>
            <h3 className="font-serif text-base font-semibold text-charcoal mb-3">
              Historial de citas
            </h3>
            {loading ? (
              <div className="text-center py-6 text-charcoal-muted text-sm">
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              </div>
            ) : data?.bookings.length === 0 ? (
              <p className="text-sm text-charcoal-muted text-center py-6">
                Sin citas registradas.
              </p>
            ) : (
              <ul className="space-y-2">
                {data?.bookings.map((b) => (
                  <li
                    key={b.id}
                    className="p-3 rounded-xl bg-mauve-50/40 border border-mauve-100 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-charcoal">{b.service_name}</p>
                      <p className="text-xs text-charcoal-muted capitalize">
                        {format(parseISO(b.starts_at), "EEE d 'de' MMM yyyy · h:mm a", { locale: es })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-accent text-mauve-700 font-semibold text-sm">
                        {formatCRC(b.final_price)}
                      </p>
                      <p className="text-[10px] uppercase text-charcoal-muted">{b.status}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <footer className="p-6 border-t border-mauve-100 flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          <Button onClick={onEdit}>
            <Pencil className="w-4 h-4" />
            Editar clienta
          </Button>
        </footer>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-mauve-50/60 border border-mauve-100 text-center">
      <Icon className="w-4 h-4 mx-auto text-mauve-700 mb-1" />
      <p className="font-serif text-lg font-semibold text-charcoal leading-tight">{value}</p>
      <p className="text-[10px] uppercase text-charcoal-muted">{label}</p>
    </div>
  );
}
