import { getAllGallery } from "@/lib/actions/gallery";
import { GalleryAdmin } from "@/components/admin/gallery-admin";

export const dynamic = "force-dynamic";

export default async function GalleryAdminPage() {
  const items = await getAllGallery();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-charcoal">
          Galería
        </h1>
        <p className="text-charcoal-soft mt-1">
          Sube fotos de tus diseños y arrástralas para ordenarlas.
        </p>
      </header>
      <GalleryAdmin initial={items} />
    </div>
  );
}
