"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { DiscountCode } from "@/lib/supabase/types";

async function requireAuth() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

export async function getDiscountCodes(): Promise<DiscountCode[]> {
  const supabase = await requireAuth();
  const { data } = await supabase
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as DiscountCode[];
}

const DiscountSchema = z.object({
  code: z.string().min(2).max(30).regex(/^[A-Z0-9_-]+$/, "Solo mayúsculas, números, _ y -"),
  description: z.string().max(200).optional().nullable(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().int().min(1),
  min_amount: z.number().int().min(0).default(0),
  max_uses: z.number().int().min(1).optional().nullable(),
  valid_until: z.string().datetime().optional().nullable(),
  active: z.boolean().default(true)
});

export type DiscountInput = z.infer<typeof DiscountSchema>;

export async function createDiscountCode(input: DiscountInput) {
  const parsed = DiscountSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos. Revisa el formato del código." };
  }
  if (parsed.data.discount_type === "percentage" && parsed.data.discount_value > 100) {
    return { error: "El porcentaje no puede ser mayor a 100" };
  }

  const supabase = await requireAuth();
  const { data, error } = await supabase
    .from("discount_codes")
    .insert({
      ...parsed.data,
      description: parsed.data.description || null,
      max_uses: parsed.data.max_uses || null,
      valid_until: parsed.data.valid_until || null
    })
    .select("*")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/admin/descuentos");
  return { ok: true, code: data as DiscountCode };
}

export async function toggleDiscountActive(id: string, active: boolean) {
  const supabase = await requireAuth();
  const { error } = await supabase
    .from("discount_codes")
    .update({ active })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/descuentos");
  return { ok: true };
}

export async function deleteDiscountCode(id: string) {
  const supabase = await requireAuth();
  const { error } = await supabase.from("discount_codes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/descuentos");
  return { ok: true };
}
