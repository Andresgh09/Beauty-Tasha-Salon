"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { BusinessHours, BlockedSlot } from "@/lib/supabase/types";

async function requireAuth() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

export async function getBusinessHours(): Promise<BusinessHours[]> {
  const supabase = await requireAuth();
  const { data } = await supabase
    .from("business_hours")
    .select("*")
    .order("day_of_week", { ascending: true });
  return (data ?? []) as BusinessHours[];
}

const HoursSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  is_open: z.boolean(),
  morning_open: z.string().nullable(),
  morning_close: z.string().nullable(),
  afternoon_open: z.string().nullable(),
  afternoon_close: z.string().nullable(),
  evening_open: z.string().nullable(),
  evening_close: z.string().nullable(),
  slot_duration_minutes: z.number().int().min(15).max(120)
});

export async function updateBusinessHours(
  day_of_week: number,
  patch: z.infer<typeof HoursSchema>
) {
  const parsed = HoursSchema.safeParse(patch);
  if (!parsed.success) return { error: "Datos inválidos" };
  const supabase = await requireAuth();
  const { error } = await supabase
    .from("business_hours")
    .update(parsed.data)
    .eq("day_of_week", day_of_week);
  if (error) return { error: error.message };
  revalidatePath("/admin/horarios");
  revalidatePath("/");
  return { ok: true };
}

export async function getBlockedSlots(): Promise<BlockedSlot[]> {
  const supabase = await requireAuth();
  const { data } = await supabase
    .from("blocked_slots")
    .select("*")
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  return (data ?? []) as BlockedSlot[];
}

const BlockSchema = z.object({
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  reason: z.string().max(200).optional().nullable()
});

export async function createBlockedSlot(input: z.infer<typeof BlockSchema>) {
  const parsed = BlockSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };
  if (new Date(parsed.data.ends_at) <= new Date(parsed.data.starts_at)) {
    return { error: "La fecha de fin debe ser posterior al inicio" };
  }
  const supabase = await requireAuth();
  const { data, error } = await supabase
    .from("blocked_slots")
    .insert({ ...parsed.data, reason: parsed.data.reason ?? null })
    .select("*")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/admin/horarios");
  revalidatePath("/");
  return { ok: true, slot: data as BlockedSlot };
}

export async function deleteBlockedSlot(id: string) {
  const supabase = await requireAuth();
  const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/horarios");
  revalidatePath("/");
  return { ok: true };
}
