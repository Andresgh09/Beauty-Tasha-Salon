import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Cliente Supabase para Server Components / Server Actions / Route Handlers.
 * Usa el anon key + cookies de sesión del usuario.
 */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components no pueden setear cookies — ignorar
          }
        }
      }
    }
  );
}

/**
 * Cliente Supabase con service_role: salta RLS.
 * ⚠️ Solo usar en server-side, NUNCA exponer al cliente.
 * Para operaciones administrativas (crear bookings desde API públicas, etc).
 */
export function createAdminClient() {
  // .trim() defensivo: si el env var tiene un \n o espacio al final
  // (común al copiar/pegar JWTs), Supabase trata la request como anon
  // y los GRANTs/RLS bloquean operaciones admin.
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  return createServerClient<Database>(url, serviceKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {}
    }
  });
}
