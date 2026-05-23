import { getDiscountCodes } from "@/lib/actions/discounts";
import { DiscountsAdmin } from "@/components/admin/discounts-admin";

export const dynamic = "force-dynamic";

export default async function DiscountsAdminPage() {
  const codes = await getDiscountCodes();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-charcoal">
          Códigos de descuento
        </h1>
        <p className="text-charcoal-soft mt-1">
          Crea promociones temporales con porcentaje o monto fijo.
        </p>
      </header>
      <DiscountsAdmin initial={codes} />
    </div>
  );
}
