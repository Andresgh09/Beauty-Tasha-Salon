import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata = {
  title: "Admin · Beauty Tasha Salón",
  robots: { index: false, follow: false }
};

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // El layout NO se aplica a /admin/login porque el middleware ya permite acceso sin sesión.
  // Pero si Next.js intenta renderizar el layout sin user, redirige.
  if (!user) {
    // No usar redirect aquí porque /admin/login es hijo de este layout
    // (devolvemos children sin shell para que /admin/login renderice solo)
    return <>{children}</>;
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
