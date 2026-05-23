import { createClient } from "@/lib/supabase/server";
import type { Service, ServiceCategory } from "@/lib/supabase/types";

/**
 * Lista todos los servicios visibles, ordenados por sort_order.
 */
export async function getVisibleServices(): Promise<Service[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("visible", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getVisibleServices]", error);
    return [];
  }
  return (data ?? []) as Service[];
}

/**
 * Obtiene un servicio por slug. Solo visibles.
 */
export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("visible", true)
    .maybeSingle();

  if (error) {
    console.error("[getServiceBySlug]", error);
    return null;
  }
  return data as Service | null;
}

/**
 * Obtiene un servicio por id (incluso si no visible — usado en admin/bookings).
 */
export async function getServiceById(id: string): Promise<Service | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getServiceById]", error);
    return null;
  }
  return data as Service | null;
}

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  manicure: "Manicure",
  pedicure: "Pedicure",
  spa: "Spa",
  semipermanente: "Semipermanente",
  extensiones: "Extensiones",
  ninas: "Niñas"
};
