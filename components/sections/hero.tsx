import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowerField } from "@/components/decor/flower-field";
import type { HeroSettings } from "@/lib/queries/settings";

export function Hero({ settings }: { settings: HeroSettings | null }) {
  const s: HeroSettings = settings ?? {
    badge: "Nail Studio Premium · Costa Rica",
    title_part1: "El arte de unas",
    title_part2: "uñas perfectas",
    description:
      "En Beauty Tasha Salón cuidamos cada detalle. Manicure, pedicure y diseños únicos en un ambiente elegante y relajante, hechos a tu medida.",
    image_url:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=80"
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      <div
        className="absolute inset-0 bg-mesh-mauve opacity-60 -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-mauve-300/30 blur-3xl animate-float -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 -right-20 w-96 h-96 rounded-full bg-mauve-400/30 blur-3xl animate-float -z-10"
        style={{ animationDelay: "2s" }}
        aria-hidden="true"
      />

      {/* Flores decorativas flotantes */}
      <FlowerField />

      <div className="container relative grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="flex flex-col gap-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 self-start glass-mauve rounded-full px-4 py-1.5 text-xs font-medium text-mauve-700">
            <Sparkles className="w-3.5 h-3.5" />
            {s.badge}
          </div>

          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-charcoal leading-[1.05] text-balance">
            {s.title_part1}{" "}
            <span className="text-gradient italic font-accent">{s.title_part2}</span>
          </h1>

          <p className="text-lg text-charcoal-soft max-w-lg leading-relaxed">
            {s.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="#reservar">
                Reservar mi cita
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#servicios">Ver servicios</Link>
            </Button>
          </div>

        </div>

        <div
          className="relative animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-elevated">
            <Image
              src={s.image_url}
              alt="Diseño de uñas elegante en Beauty Tasha Salón"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-mauve-900/30 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
