import { createClient } from "@/lib/supabase/server";
import type { Testimonial } from "@/lib/supabase/types";

export async function getVisibleTestimonials(): Promise<Testimonial[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("visible", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getVisibleTestimonials]", error);
    return [];
  }
  return (data ?? []) as Testimonial[];
}
