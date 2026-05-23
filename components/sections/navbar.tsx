"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "#servicios", label: "Servicios" },
  { href: "#galeria", label: "Galería" },
  { href: "#sobre-tasha", label: "Sobre Tasha" },
  { href: "#testimonios", label: "Testimonios" }
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-4 left-4 right-4 z-50 transition-all duration-300",
        scrolled && "top-2"
      )}
    >
      <nav
        className={cn(
          "mx-auto max-w-6xl rounded-full px-6 py-3 flex items-center justify-between transition-all duration-300",
          scrolled
            ? "glass shadow-card"
            : "bg-white/40 backdrop-blur-md border border-white/30"
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2 group"
          aria-label="Beauty Tasha Salón inicio"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center shadow-soft group-hover:shadow-glow transition-shadow">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-serif text-base font-semibold text-charcoal">
              Beauty Tasha
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-mauve-700">
              Salón
            </span>
          </div>
        </Link>

        <ul className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-charcoal-soft hover:text-mauve-700 rounded-full hover:bg-mauve-50 transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden lg:flex">
          <Button asChild size="sm">
            <Link href="#reservar">Reservar cita</Link>
          </Button>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2 text-charcoal cursor-pointer"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden mt-2 mx-auto max-w-6xl glass rounded-3xl p-6 shadow-card animate-fade-in-up">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-charcoal-soft hover:bg-mauve-50 rounded-2xl transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Button asChild className="w-full">
                <Link href="#reservar" onClick={() => setOpen(false)}>
                  Reservar cita
                </Link>
              </Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
