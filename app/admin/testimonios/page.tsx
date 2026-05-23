import { getAllTestimonials } from "@/lib/actions/testimonials";
import { TestimonialsAdmin } from "@/components/admin/testimonials-admin";

export const dynamic = "force-dynamic";

export default async function TestimonialsAdminPage() {
  const items = await getAllTestimonials();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-charcoal">
          Testimonios
        </h1>
        <p className="text-charcoal-soft mt-1">
          Modera las reseñas que aparecen en el sitio. Solo las visibles se muestran.
        </p>
      </header>
      <TestimonialsAdmin initial={items} />
    </div>
  );
}
