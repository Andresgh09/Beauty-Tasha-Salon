"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  Save,
  Loader2,
  Check,
  Sparkles,
  User,
  Phone,
  ImagePlus,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updateSetting } from "@/lib/actions/settings";
import { uploadImage } from "@/lib/actions/storage";
import type {
  HeroSettings,
  AboutSettings,
  ContactSettings
} from "@/lib/queries/settings";

type Tab = "hero" | "about" | "contact";

export function ContentEditor({
  hero,
  about,
  contact
}: {
  hero: HeroSettings | null;
  about: AboutSettings | null;
  contact: ContactSettings | null;
}) {
  const [tab, setTab] = useState<Tab>("hero");

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-mauve-100 p-2 shadow-card inline-flex gap-1">
        <TabButton active={tab === "hero"} onClick={() => setTab("hero")} icon={Sparkles}>
          Hero (portada)
        </TabButton>
        <TabButton active={tab === "about"} onClick={() => setTab("about")} icon={User}>
          Sobre Tasha
        </TabButton>
        <TabButton active={tab === "contact"} onClick={() => setTab("contact")} icon={Phone}>
          Contacto
        </TabButton>
      </div>

      {tab === "hero" && <HeroForm initial={hero} />}
      {tab === "about" && <AboutForm initial={about} />}
      {tab === "contact" && <ContactForm initial={contact} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer",
        active
          ? "bg-gradient-brand text-white shadow-soft"
          : "text-charcoal-soft hover:bg-mauve-50"
      )}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}

function useSaveSetting(key: string) {
  const [pending, startTransition] = useTransition();
  const [savedTick, setSavedTick] = useState(false);
  const save = (value: Record<string, unknown>) => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const res = await updateSetting(key, value);
        if (res.error) alert(res.error);
        else {
          setSavedTick(true);
          setTimeout(() => setSavedTick(false), 1800);
        }
        resolve();
      });
    });
  };
  return { save, pending, savedTick };
}

function SingleImageField({
  value,
  onChange,
  label = "Imagen"
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);

  const handle = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadImage(fd, "site");
    setUploading(false);
    if (res.error) return alert(res.error);
    if (res.url) onChange(res.url);
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex items-center gap-3">
        {value ? (
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-mauve-100">
            <Image src={value} alt="" fill sizes="96px" className="object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 hover:bg-red-500 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-mauve-200 flex items-center justify-center text-mauve-300">
            <ImagePlus className="w-6 h-6" />
          </div>
        )}
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
          />
          <span className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-mauve-100 hover:bg-mauve-200 text-sm font-medium text-charcoal cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {value ? "Cambiar foto" : "Subir foto"}
          </span>
        </label>
      </div>
    </div>
  );
}

function SaveButton({ pending, savedTick, onClick }: { pending: boolean; savedTick: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center gap-3 justify-end pt-2 border-t border-mauve-100">
      {savedTick && (
        <span className="text-sm text-green-600 flex items-center gap-1">
          <Check className="w-4 h-4" /> Guardado
        </span>
      )}
      <Button onClick={onClick} disabled={pending}>
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar cambios
      </Button>
    </div>
  );
}

function HeroForm({ initial }: { initial: HeroSettings | null }) {
  const [form, setForm] = useState<HeroSettings>(initial ?? {
    badge: "Nail Studio Premium · Costa Rica",
    title_part1: "El arte de unas",
    title_part2: "uñas perfectas",
    description: "",
    image_url: ""
  });
  const { save, pending, savedTick } = useSaveSetting("hero");

  return (
    <section className="bg-white rounded-3xl border border-mauve-100 p-6 shadow-card space-y-5">
      <div>
        <Label htmlFor="badge">Badge superior (la pildorita)</Label>
        <Input
          id="badge"
          value={form.badge}
          onChange={(e) => setForm({ ...form, badge: e.target.value })}
          className="mt-1.5"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="t1">Título — parte 1</Label>
          <Input
            id="t1"
            value={form.title_part1}
            onChange={(e) => setForm({ ...form, title_part1: e.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="t2">Título — parte 2 (cursiva)</Label>
          <Input
            id="t2"
            value={form.title_part2}
            onChange={(e) => setForm({ ...form, title_part2: e.target.value })}
            className="mt-1.5"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="desc">Descripción</Label>
        <textarea
          id="desc"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="mt-1.5 w-full rounded-md border border-mauve-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve-500 resize-none"
        />
      </div>
      <SingleImageField
        value={form.image_url}
        onChange={(image_url) => setForm({ ...form, image_url })}
        label="Foto principal (lado derecho)"
      />
      <SaveButton pending={pending} savedTick={savedTick} onClick={() => save(form as unknown as Record<string, unknown>)} />
    </section>
  );
}

function AboutForm({ initial }: { initial: AboutSettings | null }) {
  const [form, setForm] = useState<AboutSettings>(initial ?? {
    title_part1: "Pasión, técnica y un",
    title_part2: "toque personal",
    paragraph_1: "",
    paragraph_2: "",
    image_url: "",
    quote: "",
    stats: [
      { label: "Clientas felices", value: "200+" },
      { label: "Años de experiencia", value: "5+" },
      { label: "Diseños únicos", value: "1000+" },
      { label: "Reseñas 5★", value: "98%" }
    ]
  });
  const { save, pending, savedTick } = useSaveSetting("about");

  const updateStat = (i: number, patch: Partial<{ label: string; value: string }>) => {
    setForm({
      ...form,
      stats: form.stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    });
  };

  return (
    <section className="bg-white rounded-3xl border border-mauve-100 p-6 shadow-card space-y-5">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Título — parte 1</Label>
          <Input
            value={form.title_part1}
            onChange={(e) => setForm({ ...form, title_part1: e.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Título — parte 2 (cursiva)</Label>
          <Input
            value={form.title_part2}
            onChange={(e) => setForm({ ...form, title_part2: e.target.value })}
            className="mt-1.5"
          />
        </div>
      </div>
      <div>
        <Label>Párrafo 1</Label>
        <textarea
          value={form.paragraph_1}
          onChange={(e) => setForm({ ...form, paragraph_1: e.target.value })}
          rows={3}
          className="mt-1.5 w-full rounded-md border border-mauve-200 bg-white px-4 py-3 text-sm resize-none"
        />
      </div>
      <div>
        <Label>Párrafo 2</Label>
        <textarea
          value={form.paragraph_2}
          onChange={(e) => setForm({ ...form, paragraph_2: e.target.value })}
          rows={3}
          className="mt-1.5 w-full rounded-md border border-mauve-200 bg-white px-4 py-3 text-sm resize-none"
        />
      </div>
      <div>
        <Label>Cita destacada (la frase italic en el card flotante)</Label>
        <Input
          value={form.quote}
          onChange={(e) => setForm({ ...form, quote: e.target.value })}
          className="mt-1.5"
        />
      </div>
      <SingleImageField
        value={form.image_url}
        onChange={(image_url) => setForm({ ...form, image_url })}
        label="Foto de Tasha"
      />
      <div>
        <Label>Estadísticas</Label>
        <div className="grid grid-cols-2 gap-3 mt-1.5">
          {form.stats.map((stat, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <Input
                value={stat.value}
                onChange={(e) => updateStat(i, { value: e.target.value })}
                placeholder="200+"
                className="text-center font-semibold"
              />
              <Input
                value={stat.label}
                onChange={(e) => updateStat(i, { label: e.target.value })}
                placeholder="Clientas felices"
              />
            </div>
          ))}
        </div>
      </div>
      <SaveButton pending={pending} savedTick={savedTick} onClick={() => save(form as unknown as Record<string, unknown>)} />
    </section>
  );
}

function ContactForm({ initial }: { initial: ContactSettings | null }) {
  const [form, setForm] = useState<ContactSettings>(initial ?? {
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    instagram: "",
    facebook: "",
    google_maps_url: ""
  });
  const { save, pending, savedTick } = useSaveSetting("contact");

  return (
    <section className="bg-white rounded-3xl border border-mauve-100 p-6 shadow-card space-y-5">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Teléfono (con formato)</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+506 8888-8888"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>WhatsApp (solo números)</Label>
          <Input
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            placeholder="50688888888"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Dirección</Label>
          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="San José, Costa Rica"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Instagram (URL completa)</Label>
          <Input
            value={form.instagram}
            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            placeholder="https://instagram.com/beautytashasalon"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Facebook (URL completa)</Label>
          <Input
            value={form.facebook}
            onChange={(e) => setForm({ ...form, facebook: e.target.value })}
            placeholder="https://facebook.com/..."
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Google Maps URL (opcional)</Label>
          <Input
            value={form.google_maps_url}
            onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })}
            placeholder="https://maps.google.com/?cid=..."
            className="mt-1.5"
          />
        </div>
      </div>
      <SaveButton pending={pending} savedTick={savedTick} onClick={() => save(form as unknown as Record<string, unknown>)} />
    </section>
  );
}
