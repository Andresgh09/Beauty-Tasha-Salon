import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * 🔍 ENDPOINT DE DEBUG TEMPORAL
 * Devuelve info sobre las env vars de Supabase para diagnosticar
 * problemas de autenticación / RLS / GRANTs.
 *
 * ⚠️ BORRAR este archivo después de debuggear — expone metadata sensible.
 *
 * Solo responde si BOOKING_DEBUG=1 está activo.
 */
export async function GET() {
  if (process.env.BOOKING_DEBUG !== "1") {
    return NextResponse.json(
      { error: "Debug deshabilitado. Set BOOKING_DEBUG=1." },
      { status: 403 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  // Decode JWT payload (sin verificar firma) para ver el role real
  const decodeJwt = (token: string) => {
    try {
      const payload = token.split(".")[1];
      const decoded = Buffer.from(payload, "base64").toString("utf-8");
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  };

  const serviceJwt = decodeJwt(serviceKey.trim());
  const anonJwt = decodeJwt(anonKey.trim());

  // Test directo: intentar SELECT en customers usando admin client
  let customerSelectTest: {
    ok: boolean;
    error?: string;
    code?: string;
    rowsCount?: number;
  } = { ok: false };
  let customerInsertTest: {
    ok: boolean;
    error?: string;
    code?: string;
  } = { ok: false };

  try {
    const supabase = createAdminClient();

    // Test SELECT
    const { data, error } = await supabase
      .from("customers")
      .select("id")
      .limit(1);
    if (error) {
      customerSelectTest = {
        ok: false,
        error: error.message,
        code: error.code
      };
    } else {
      customerSelectTest = { ok: true, rowsCount: data?.length ?? 0 };
    }

    // Test INSERT con email random (luego se borra)
    const testEmail = `debug-${Date.now()}@delete.test`;
    const { error: insErr } = await supabase
      .from("customers")
      .insert({
        name: "DEBUG DELETE ME",
        phone: "00000000",
        email: testEmail
      });
    if (insErr) {
      customerInsertTest = {
        ok: false,
        error: insErr.message,
        code: insErr.code
      };
    } else {
      customerInsertTest = { ok: true };
      // Limpieza
      await supabase.from("customers").delete().eq("email", testEmail);
    }
  } catch (e) {
    customerSelectTest = {
      ok: false,
      error: `Excepción: ${e instanceof Error ? e.message : String(e)}`
    };
  }

  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: {
        set: Boolean(url),
        value: url, // URL no es secreta, está en el frontend
        projectRef: url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        set: Boolean(anonKey),
        length: anonKey.length,
        trimmedLength: anonKey.trim().length,
        hadWhitespace: anonKey.length !== anonKey.trim().length,
        first15: anonKey.substring(0, 15),
        last10: anonKey.substring(anonKey.length - 10),
        decodedRole: anonJwt?.role ?? null,
        decodedRef: anonJwt?.ref ?? null
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        set: Boolean(serviceKey),
        length: serviceKey.length,
        trimmedLength: serviceKey.trim().length,
        hadWhitespace: serviceKey.length !== serviceKey.trim().length,
        first15: serviceKey.substring(0, 15),
        last10: serviceKey.substring(serviceKey.length - 10),
        decodedRole: serviceJwt?.role ?? null,
        decodedRef: serviceJwt?.ref ?? null
      },
      VERCEL_URL: process.env.VERCEL_URL ?? null,
      VERCEL_ENV: process.env.VERCEL_ENV ?? null
    },
    tests: {
      customerSelect: customerSelectTest,
      customerInsert: customerInsertTest
    },
    consistency: {
      keysFromSameProject:
        serviceJwt?.ref === anonJwt?.ref ? "✅ Sí" : "❌ NO — keys de proyectos distintos",
      urlMatchesKeys:
        url.includes(serviceJwt?.ref ?? "_NONE_")
          ? "✅ Sí"
          : "❌ NO — la URL no coincide con el ref del key",
      serviceRoleIsActuallyServiceRole:
        serviceJwt?.role === "service_role"
          ? "✅ Sí"
          : `❌ NO — role real: ${serviceJwt?.role}`
    }
  });
}
