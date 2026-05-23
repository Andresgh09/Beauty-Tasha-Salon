import Image from "next/image";
import type { GalleryItem } from "@/lib/supabase/types";

export function Gallery({ images }: { images: GalleryItem[] }) {
  if (images.length === 0) return null;

  return (
    <section
      id="galeria"
      className="py-20 lg:py-28 bg-gradient-to-b from-transparent via-mauve-50 to-transparent"
    >
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-sm uppercase tracking-[0.25em] text-mauve-700 mb-3 font-medium">
            Galería
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-charcoal mb-4 text-balance">
            Nuestros{" "}
            <span className="italic font-accent text-gradient">diseños</span>
          </h2>
          <p className="text-charcoal-soft text-lg">
            Cada uña es una pequeña obra de arte. Inspírate con nuestros
            trabajos recientes.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-3xl shadow-card hover:shadow-elevated transition-all duration-500"
            >
              <Image
                src={img.image_url}
                alt={img.alt_text ?? "Diseño de uñas"}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-mauve-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
