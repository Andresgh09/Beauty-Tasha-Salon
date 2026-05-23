import Image from "next/image";
import { Heart, Award, Sparkles, Users, type LucideIcon } from "lucide-react";
import type { AboutSettings } from "@/lib/queries/settings";

const STAT_ICONS: Record<number, LucideIcon> = {
  0: Users,
  1: Award,
  2: Sparkles,
  3: Heart
};

export function About({ settings }: { settings: AboutSettings | null }) {
  const s: AboutSettings = settings ?? {
    title_part1: "Pasión, técnica y un",
    title_part2: "toque personal",
    paragraph_1:
      "Beauty Tasha Salón nace de la pasión por el arte de las uñas y el deseo de crear un espacio donde cada clienta se sienta cuidada, escuchada y especial.",
    paragraph_2:
      "Especializada en técnicas modernas como Gel X, Rubber Base y Luminary, Tasha combina precisión técnica con creatividad para lograr diseños únicos que reflejan tu personalidad.",
    image_url:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800",
    quote: "Cada cliente es única y merece sentirse especial.",
    stats: [
      { label: "Clientas felices", value: "200+" },
      { label: "Años de experiencia", value: "5+" },
      { label: "Diseños únicos", value: "1000+" },
      { label: "Reseñas 5★", value: "98%" }
    ]
  };

  return (
    <section id="sobre-tasha" className="py-20 lg:py-28">
      <div className="container grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="relative order-2 lg:order-1">
          <div className="relative aspect-[4/5] max-w-md mx-auto rounded-[2rem] overflow-hidden shadow-elevated">
            <Image
              src={s.image_url}
              alt="Tasha, fundadora de Beauty Tasha Salón"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -right-6 glass rounded-2xl p-5 shadow-elevated max-w-[200px]">
            <p className="font-accent italic text-mauve-700 text-lg leading-snug">
              &ldquo;{s.quote}&rdquo;
            </p>
            <p className="text-xs text-charcoal-muted mt-2">— Tasha, fundadora</p>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-sm uppercase tracking-[0.25em] text-mauve-700 mb-3 font-medium">
            Sobre Tasha
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-charcoal mb-6 text-balance">
            {s.title_part1}{" "}
            <span className="italic font-accent text-gradient">{s.title_part2}</span>
          </h2>
          <div className="space-y-4 text-charcoal-soft text-lg leading-relaxed">
            <p>{s.paragraph_1}</p>
            <p>{s.paragraph_2}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {s.stats.map((stat, i) => {
              const Icon = STAT_ICONS[i] ?? Sparkles;
              return (
                <div
                  key={stat.label}
                  className="bg-white border border-mauve-100 rounded-2xl p-4 shadow-card"
                >
                  <div className="w-10 h-10 rounded-full bg-mauve-100 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-mauve-700" />
                  </div>
                  <p className="font-serif text-2xl font-semibold text-charcoal">
                    {stat.value}
                  </p>
                  <p className="text-xs text-charcoal-muted">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
