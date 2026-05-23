import Image from "next/image";
import { Plus, Eye, EyeOff, Star } from "lucide-react";
import { getAllServices } from "@/lib/actions/services";
import { formatCRC } from "@/lib/utils";
import { ServicesAdminList } from "@/components/admin/services-admin-list";

export const dynamic = "force-dynamic";

export default async function ServicesAdminPage() {
  const services = await getAllServices();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-charcoal">
            Servicios
          </h1>
          <p className="text-charcoal-soft mt-1">
            Gestiona tu catálogo de servicios, precios y fotos.
          </p>
        </div>
      </header>

      <ServicesAdminList initialServices={services} />
    </div>
  );
}
