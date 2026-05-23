"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { GalleryItem } from "@/lib/supabase/types";

async function requireAuth() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

export async function getAllGallery(): Promise<GalleryItem[]> {
  const supabase = await requireAuth();
  const { data } = await supabase
    .from("gallery")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as GalleryItem[];
}

export async function addGalleryImage(url: string, alt: string) {
  const supabase = await requireAuth();
  const { data: max } = await supabase
    .from("gallery")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (max?.sort_order ?? 0) + 10;

  const { data, error } = await supabase
    .from("gallery")
    .insert({ image_url: url, alt_text: alt || null, sort_order: nextOrder })
    .select("*")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/admin/galeria");
  revalidatePath("/");
  return { ok: true, item: data as GalleryItem };
}

export async function deleteGalleryImage(id: string) {
  const supabase = await requireAuth();
  const { error } = await supabase.from("gallery").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/galeria");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleGalleryVisible(id: string, visible: boolean) {
  const supabase = await requireAuth();
  const { error } = await supabase
    .from("gallery")
    .update({ visible })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/galeria");
  revalidatePath("/");
  return { ok: true };
}

export async function reorderGallery(ids: string[]) {
  const supabase = await requireAuth();
  const updates = ids.map((id, i) =>
    supabase.from("gallery").update({ sort_order: (i + 1) * 10 }).eq("id", id)
  );
  await Promise.all(updates);
  revalidatePath("/admin/galeria");
  revalidatePath("/");
  return { ok: true };
}

export async function updateGalleryAlt(id: string, alt: string) {
  const supabase = await requireAuth();
  const { error } = await supabase
    .from("gallery")
    .update({ alt_text: alt || null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/galeria");
  return { ok: true };
}
