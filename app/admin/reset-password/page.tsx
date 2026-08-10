"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Phase = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al cargar, el cliente de Supabase procesa el token del enlace de
  // recuperación (viene en la URL). Cuando establece la sesión de
  // recovery, habilitamos el formulario.
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setPhase("ready");
      }
    });

    // Fallback: si ya hay sesión al montar (token ya procesado)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPhase((p) => (p === "checking" ? "ready" : p));
    });

    // Si tras unos segundos no hay sesión, el enlace es inválido/expiró
    const timeout = setTimeout(() => {
      setPhase((p) => (p === "checking" ? "invalid" : p));
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    setPhase("done");
    // Pequeña pausa para que vea el éxito y luego al panel
    setTimeout(() => {
      router.push("/admin");
      router.refresh();
    }, 1800);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh-mauve opacity-50 -z-10" />
      <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-mauve-300/30 blur-3xl -z-10" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 rounded-full bg-mauve-400/30 blur-3xl -z-10" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative inline-block w-20 h-20 rounded-full overflow-hidden bg-white shadow-glow ring-1 ring-mauve-200 mb-4">
            <Image
              src="/icon.png"
              alt="Beauty Tasha Salón"
              fill
              sizes="80px"
              className="object-contain scale-110"
              priority
            />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-charcoal mb-1">
            Nueva contraseña
          </h1>
          <p className="text-charcoal-soft text-sm">Beauty Tasha Salón</p>
        </div>

        <div className="bg-white border border-mauve-100 rounded-3xl p-8 shadow-elevated">
          {phase === "checking" && (
            <div className="py-6 text-center text-charcoal-muted">
              <div className="w-8 h-8 border-2 border-mauve-300 border-t-mauve-700 rounded-full animate-spin mx-auto mb-3" />
              Verificando el enlace...
            </div>
          )}

          {phase === "invalid" && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 border border-red-200">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-semibold text-charcoal mb-1">
                  Enlace inválido o expirado
                </h2>
                <p className="text-sm text-charcoal-soft">
                  El enlace de recuperación ya no es válido. Pedí uno nuevo.
                </p>
              </div>
              <Link
                href="/admin/forgot-password"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-mauve-700 hover:text-mauve-800"
              >
                Pedir nuevo enlace
              </Link>
            </div>
          )}

          {phase === "done" && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 border border-green-200">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-semibold text-charcoal mb-1">
                  ¡Contraseña actualizada!
                </h2>
                <p className="text-sm text-charcoal-soft">
                  Te estamos llevando al panel...
                </p>
              </div>
            </div>
          )}

          {phase === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-charcoal-soft">
                Elegí una contraseña nueva (mínimo 8 caracteres).
              </p>

              <div>
                <Label htmlFor="password">Nueva contraseña</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-charcoal cursor-pointer"
                    aria-label={show ? "Ocultar" : "Mostrar"}
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirm">Repetir contraseña</Label>
                <Input
                  id="confirm"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Button type="submit" disabled={loading} size="lg" className="w-full">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar contraseña"
                )}
              </Button>

              <Link
                href="/admin/login"
                className="flex items-center justify-center gap-1.5 text-sm font-medium text-charcoal-muted hover:text-charcoal"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al login
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
