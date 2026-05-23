import Image from "next/image";
import { Star, Quote } from "lucide-react";
import type { Testimonial } from "@/lib/supabase/types";

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section id="testimonios" className="py-20 lg:py-28 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-mesh-mauve opacity-40 -z-10"
        aria-hidden="true"
      />

      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-sm uppercase tracking-[0.25em] text-mauve-700 mb-3 font-medium">
            Testimonios
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-charcoal mb-4 text-balance">
            Lo que dicen nuestras{" "}
            <span className="italic font-accent text-gradient">clientas</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <figure
              key={t.id}
              className="relative bg-white rounded-3xl p-8 shadow-card hover:shadow-elevated transition-shadow"
            >
              <Quote
                className="absolute top-6 right-6 w-8 h-8 text-mauve-200"
                aria-hidden="true"
              />
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <blockquote className="text-charcoal-soft leading-relaxed mb-6">
                &ldquo;{t.text}&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-3 pt-4 border-t border-mauve-100">
                {t.customer_avatar && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-mauve-100">
                    <Image
                      src={t.customer_avatar}
                      alt={t.customer_name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-charcoal text-sm">
                    {t.customer_name}
                  </p>
                  {t.customer_role && (
                    <p className="text-xs text-charcoal-muted">{t.customer_role}</p>
                  )}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
