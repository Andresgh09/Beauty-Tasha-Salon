import { Navbar } from "@/components/sections/navbar";
import { Hero } from "@/components/sections/hero";
import { Services } from "@/components/sections/services";
import { Gallery } from "@/components/sections/gallery";
import { About } from "@/components/sections/about";
import { Booking } from "@/components/booking/booking";
import { Testimonials } from "@/components/sections/testimonials";
import { Footer } from "@/components/sections/footer";
import { getVisibleServices } from "@/lib/queries/services";
import { getVisibleGallery } from "@/lib/queries/gallery";
import { getVisibleTestimonials } from "@/lib/queries/testimonials";
import {
  getHeroSettings,
  getAboutSettings,
  getContactSettings
} from "@/lib/queries/settings";

// Revalidar la home cada 60s para reflejar cambios del admin sin esperar build
export const revalidate = 60;

const BASE_URL = "https://beautytashasalon.vercel.app";

export default async function HomePage() {
  const [services, gallery, testimonials, hero, about, contact] = await Promise.all([
    getVisibleServices(),
    getVisibleGallery(),
    getVisibleTestimonials(),
    getHeroSettings(),
    getAboutSettings(),
    getContactSettings()
  ]);

  // Calcular rating agregado de los testimonios para AggregateRating
  const ratingCount = testimonials.length;
  const ratingValue =
    ratingCount > 0
      ? (testimonials.reduce((sum, t) => sum + (t.rating ?? 5), 0) / ratingCount).toFixed(1)
      : "5.0";

  // JSON-LD: BeautySalon (subtype de LocalBusiness) + AggregateRating + Reviews
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: "Beauty Tasha Salón",
    alternateName: "Beauty Tasha",
    description:
      "Nail studio premium en San José, Costa Rica. Manicure, pedicure, esmaltado semipermanente y extensiones de uñas.",
    url: BASE_URL,
    image: `${BASE_URL}/og-image.jpg`,
    telephone: contact?.phone ?? "+506 8888-8888",
    email: contact?.email ?? "hola@beautytashasalon.com",
    priceRange: "₡₡",
    address: {
      "@type": "PostalAddress",
      addressLocality: "San José",
      addressCountry: "CR"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "9.9281",
      longitude: "-84.0907"
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "19:00"
      }
    ],
    ...(ratingCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue,
        ratingCount,
        bestRating: "5",
        worstRating: "1"
      },
      review: testimonials.slice(0, 5).map((t) => ({
        "@type": "Review",
        author: { "@type": "Person", name: t.customer_name },
        reviewRating: {
          "@type": "Rating",
          ratingValue: t.rating ?? 5,
          bestRating: "5"
        },
        reviewBody: t.text
      }))
    }),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios de uñas",
      itemListElement: services.slice(0, 10).map((s, i) => ({
        "@type": "Offer",
        position: i + 1,
        name: s.name,
        description: s.short_description,
        price: s.price,
        priceCurrency: "CRC"
      }))
    },
    sameAs: [
      contact?.instagram,
      contact?.facebook
    ].filter(Boolean)
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <Navbar />
        <Hero settings={hero} />
        <Services services={services} />
        <Gallery images={gallery} />
        <About settings={about} />
        <Booking services={services} />
        <Testimonials testimonials={testimonials} />
        <Footer contact={contact} />
      </main>
    </>
  );
}
