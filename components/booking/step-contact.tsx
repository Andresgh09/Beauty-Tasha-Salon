"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Customer = {
  name: string;
  phone: string;
  email: string;
  notes: string;
};

export function ContactStep({
  customer,
  onChange,
  onBack,
  onNext
}: {
  customer: Customer;
  onChange: (c: Customer) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof Customer, string>>>({});

  const validate = () => {
    const e: Partial<Record<keyof Customer, string>> = {};
    if (customer.name.trim().length < 2) e.name = "Nombre demasiado corto";
    if (!/^[+\d\s\-()]{8,20}$/.test(customer.phone)) e.phone = "Teléfono inválido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) e.email = "Email inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  const set = (key: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...customer, [key]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="font-serif text-2xl font-semibold text-charcoal mb-2">
        Tus datos de contacto
      </h3>
      <p className="text-charcoal-soft mb-6">
        Para confirmar tu cita y enviarte recordatorios.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Nombre completo *</Label>
          <Input
            id="name"
            value={customer.name}
            onChange={set("name")}
            placeholder="Ej. María Rodríguez"
            className="mt-1.5"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-xs text-destructive mt-1">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Teléfono / WhatsApp *</Label>
          <Input
            id="phone"
            type="tel"
            value={customer.phone}
            onChange={set("phone")}
            placeholder="+506 8888-8888"
            className="mt-1.5"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="text-xs text-destructive mt-1">
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Correo electrónico *</Label>
          <Input
            id="email"
            type="email"
            value={customer.email}
            onChange={set("email")}
            placeholder="tucorreo@ejemplo.com"
            className="mt-1.5"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-destructive mt-1">
              {errors.email}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notas (opcional)</Label>
          <textarea
            id="notes"
            value={customer.notes}
            onChange={set("notes")}
            rows={3}
            maxLength={500}
            placeholder="¿Algún diseño en mente, alergia o preferencia?"
            className="mt-1.5 flex w-full rounded-md border border-mauve-200 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-charcoal-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve-500 focus-visible:border-mauve-500 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-8">
        <Button variant="ghost" onClick={onBack} className="flex-1">
          Atrás
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Revisar reserva
        </Button>
      </div>
    </div>
  );
}
