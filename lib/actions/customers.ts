"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Customer, Booking } from "@/lib/supabase/types";

async function requireAuth() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

export async function getCustomers(): Promise<Customer[]> {
  const supabase = await requireAuth();
  const { data } = await supabase
    .from("customers")
    .select("*")
    .order("last_visit_at", { ascending: false, nullsFirst: false });
  return (data ?? []) as Customer[];
}

export async function getCustomerWithHistory(id: string): Promise<{
  customer: Customer | null;
  bookings: Booking[];
}> {
  const supabase = await requireAuth();
  const [{ data: customer }, { data: bookings }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("bookings")
      .select("*")
      .eq("customer_id", id)
      .order("starts_at", { ascending: false })
  ]);
  return {
    customer: (customer ?? null) as Customer | null,
    bookings: (bookings ?? []) as Booking[]
  };
}

const CustomerSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(8).max(20),
  email: z.string().email(),
  birthday: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable()
});

export async function updateCustomer(id: string, input: z.infer<typeof CustomerSchema>) {
  const parsed = CustomerSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };
  const supabase = await requireAuth();
  const { error } = await supabase
    .from("customers")
    .update({
      ...parsed.data,
      birthday: parsed.data.birthday || null,
      notes: parsed.data.notes || null
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/clientas");
  return { ok: true };
}

export async function deleteCustomer(id: string) {
  const supabase = await requireAuth();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/clientas");
  return { ok: true };
}
