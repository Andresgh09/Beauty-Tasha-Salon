import { createClient } from "@/lib/supabase/server";
import type { GalleryItem } from "@/lib/supabase/types";

export async function getVisibleGallery(): Promise<GalleryItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .eq("visible", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getVisibleGallery]", error);
    return [];
  }
  return (data ?? []) as GalleryItem[];
}
