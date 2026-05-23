import Link from "next/link";
import {
  Instagram,
  Facebook,
  MessageCircle,
  MapPin,
  Phone,
  Clock,
  Sparkles
} from "lucide-react";
import type { ContactSettings } from "@/lib/queries/settings";

export function Footer({ contact }: { contact: ContactSettings | null }) {
  const c: ContactSettings = contact ?? {
    phone: "+506 8888-8888",
    whatsapp: "+50688888888",
    email: "hola@beautytashasalon.com",
    address: "San José, Costa Rica",
    instagram: "",
    facebook: "",
    google_maps_url: ""
  };

  const phoneHref = `tel:${c.phone.replace(/\s|-/g, "")}`;
  const waHref = c.whatsapp
    ? `https://wa.me/${c.whatsapp.replace(/\D/g, "")}`
    : "#";

  return (
    <footer className="relative bg-charcoal text-white pt-20 pb-8 overflow-hidden">
      <div
        className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-mauve-400 to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-mauve-700/20 blur-[100px] -z-0"
        aria-hidden="true"
      />

      <div className="container relative">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-lg font-semibold">
                  Beauty Tasha
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-mauve-300">
                  Salón
                </span>
              </div>
            </Link>
            <p className="text-sm text-white/70 leading-relaxed">
              El arte de unas uñas perfectas. Nail studio premium en Costa Rica.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-base font-semibold mb-4">Navegación</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="#servicios" className="hover:text-mauve-300 transition-colors">
                  Servicios
                </Link>
              </li>
              <li>
                <Link href="#galeria" className="hover:text-mauve-300 transition-colors">
                  Galería
                </Link>
              </li>
              <li>
                <Link href="#sobre-tasha" className="hover:text-mauve-300 transition-colors">
                  Sobre Tasha
                </Link>
              </li>
              <li>
                <Link href="#reservar" className="hover:text-mauve-300 transition-colors">
                  Reservar
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-base font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-mauve-300" />
                <span>{c.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0 text-mauve-300" />
                <a href={phoneHref} className="hover:text-mauve-300 transition-colors">
                  {c.phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-mauve-300" />
                <div>
                  <p>Lun - Sáb: 9am - 7pm</p>
                  <p>Dom: cerrado</p>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-base font-semibold mb-4">Síguenos</h3>
            <div className="flex gap-3">
              {c.instagram && (
                <a
                  href={c.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-mauve-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {c.facebook && (
                <a
                  href={c.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-mauve-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {c.whatsapp && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-mauve-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50">
          <p>
            © {new Date().getFullYear()} Beauty Tasha Salón. Todos los derechos reservados.
          </p>
          <p>
            Diseñado por{" "}
            <a
              href="https://pipelinewebstudio.com"
              className="text-mauve-300 hover:text-mauve-200 transition-colors"
            >
              Pipeline Web Studio
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
