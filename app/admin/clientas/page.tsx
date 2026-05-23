import { getCustomers } from "@/lib/actions/customers";
import { CustomersAdmin } from "@/components/admin/customers-admin";

export const dynamic = "force-dynamic";

export default async function CustomersAdminPage() {
  const customers = await getCustomers();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-charcoal">Clientas</h1>
        <p className="text-charcoal-soft mt-1">
          Lista de clientas con su historial, total gastado y notas privadas.
        </p>
      </header>
      <CustomersAdmin initial={customers} />
    </div>
  );
}
