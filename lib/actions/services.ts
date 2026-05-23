"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Service, ServiceCategory } from "@/lib/supabase/types";

const ServiceSchema = z.object({
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  name: z.string().min(2).max(80),
  category: z.enum(["manicure", "pedicure", "spa", "semipermanente", "extensiones", "ninas"]),
  price: z.number().int().min(0).max(10_000_000),
  duration_minutes: z.number().int().min(1).max(600),
  short_description: z.string().min(5).max(200),
  long_description: z.string().max(2000).optional().nullable(),
  images: z.array(z.string().url()).max(8).default([]),
  featured: z.boolean().default(false),
  visible: z.boolean().default(true),
  sort_order: z.number().int().default(0)
});

export type ServiceInput = z.infer<typeof ServiceSchema>;

async function requireAuth() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return { supabase, user };
}

export async function createService(input: ServiceInput) {
  const parsed = ServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from("services")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) return { error: { _form: [error.message] } };
  revalidatePath("/admin/servicios");
  revalidatePath("/");
  return { ok: true, id: data?.id };
}

export async function updateService(id: string, input: ServiceInput) {
  const parsed = ServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from("services")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: { _form: [error.message] } };
  revalidatePath("/admin/servicios");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteService(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/servicios");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleServiceVisible(id: string, visible: boolean) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from("services")
    .update({ visible })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/servicios");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleServiceFeatured(id: string, featured: boolean) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from("services")
    .update({ featured })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/servicios");
  revalidatePath("/");
  return { ok: true };
}

export async function getAllServices(): Promise<Service[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("[getAllServices]", error);
    return [];
  }
  return (data ?? []) as Service[];
}
