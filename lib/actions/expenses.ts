"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

const ExpenseCategoryEnum = z.enum([
  "materials",
  "rent",
  "utilities",
  "marketing",
  "salary",
  "equipment",
  "maintenance",
  "transport",
  "other"
]);

const CreateSchema = z.object({
  category: ExpenseCategoryEnum,
  description: z.string().min(1).max(200),
  amount: z.number().int().positive(),
  spent_at: z.string().datetime(),
  notes: z.string().max(500).optional().nullable()
});

const UpdateSchema = CreateSchema.partial();

export async function createExpense(input: z.infer<typeof CreateSchema>) {
  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const supabase = await requireAuth();
  const { error } = await supabase.from("expenses").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/admin/finanzas");
  return { ok: true };
}

export async function updateExpense(
  id: string,
  patch: z.infer<typeof UpdateSchema>
) {
  const parsed = UpdateSchema.safeParse(patch);
  if (!parsed.success) return { error: "Datos inválidos" };

  const supabase = await requireAuth();
  const { error } = await supabase
    .from("expenses")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/finanzas");
  return { ok: true };
}

export async function deleteExpense(id: string) {
  const supabase = await requireAuth();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/finanzas");
  return { ok: true };
}
