"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Testimonial } from "@/lib/supabase/types";

async function requireAuth() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

export async function getAllTestimonials(): Promise<Testimonial[]> {
  const supabase = await requireAuth();
  const { data } = await supabase
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as Testimonial[];
}

const TestimonialSchema = z.object({
  customer_name: z.string().min(2).max(80),
  customer_role: z.string().max(80).optional().nullable(),
  customer_avatar: z.string().url().optional().nullable().or(z.literal("")),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10).max(500),
  visible: z.boolean(),
  featured: z.boolean(),
  sort_order: z.number().int().default(0)
});

export type TestimonialInput = z.infer<typeof TestimonialSchema>;

export async function createTestimonial(input: TestimonialInput) {
  const parsed = TestimonialSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };
  const supabase = await requireAuth();
  const { data, error } = await supabase
    .from("testimonials")
    .insert({
      ...parsed.data,
      customer_role: parsed.data.customer_role || null,
      customer_avatar: parsed.data.customer_avatar || null
    })
    .select("*")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/admin/testimonios");
  revalidatePath("/");
  return { ok: true, testimonial: data as Testimonial };
}

export async function updateTestimonial(id: string, input: TestimonialInput) {
  const parsed = TestimonialSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };
  const supabase = await requireAuth();
  const { error } = await supabase
    .from("testimonials")
    .update({
      ...parsed.data,
      customer_role: parsed.data.customer_role || null,
      customer_avatar: parsed.data.customer_avatar || null
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/testimonios");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteTestimonial(id: string) {
  const supabase = await requireAuth();
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/testimonios");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleTestimonialVisible(id: string, visible: boolean) {
  const supabase = await requireAuth();
  const { error } = await supabase
    .from("testimonials")
    .update({ visible })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/testimonios");
  revalidatePath("/");
  return { ok: true };
}
