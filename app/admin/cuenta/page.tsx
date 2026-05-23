import { createClient } from "@/lib/supabase/server";
import { AccountSettings } from "@/components/admin/account-settings";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-charcoal">
          Mi cuenta
        </h1>
        <p className="text-charcoal-soft mt-1">
          Configura tu acceso al panel de administración.
        </p>
      </header>
      <AccountSettings email={user?.email ?? ""} />
    </div>
  );
}
