"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/admin/reset-password`
      }
    );

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    // Siempre mostramos éxito (no revelar si el email existe o no).
    setSent(true);
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
            Recuperar contraseña
          </h1>
          <p className="text-charcoal-soft text-sm">Beauty Tasha Salón</p>
        </div>

        {sent ? (
          <div className="bg-white border border-mauve-100 rounded-3xl p-8 shadow-elevated text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 border border-green-200">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-charcoal mb-1">
                Revisá tu correo
              </h2>
              <p className="text-sm text-charcoal-soft">
                Si <strong>{email}</strong> tiene una cuenta, te enviamos un
                enlace para restablecer la contraseña. Puede tardar un par de
                minutos; revisá también spam.
              </p>
            </div>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-mauve-700 hover:text-mauve-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al login
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-mauve-100 rounded-3xl p-8 shadow-elevated space-y-5"
          >
            <p className="text-sm text-charcoal-soft">
              Ingresá tu correo y te enviaremos un enlace para crear una nueva
              contraseña.
            </p>

            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
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
                  Enviando...
                </>
              ) : (
                "Enviar enlace"
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
    </main>
  );
}
