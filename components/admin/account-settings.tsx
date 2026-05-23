"use client";

import { useState, useTransition } from "react";
import {
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function AccountSettings({ email }: { email: string }) {
  const supabase = createClient();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    | { type: "success"; message: string }
    | { type: "error"; message: string }
    | null
  >(null);

  // Reglas de fortaleza simples
  const checks = {
    length: newPwd.length >= 8,
    letter: /[a-zA-Z]/.test(newPwd),
    number: /\d/.test(newPwd),
    match: newPwd.length > 0 && newPwd === confirmPwd
  };
  const allOk = checks.length && checks.letter && checks.number && checks.match;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!allOk) {
      setFeedback({ type: "error", message: "Revisa los requisitos de la contraseña." });
      return;
    }

    startTransition(async () => {
      // 1) Verificar contraseña actual reintentando login (más seguro que confiar solo en sesión)
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: currentPwd
      });
      if (signInErr) {
        setFeedback({ type: "error", message: "La contraseña actual no es correcta." });
        return;
      }

      // 2) Actualizar la contraseña
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) {
        setFeedback({ type: "error", message: error.message });
        return;
      }

      setFeedback({
        type: "success",
        message: "¡Contraseña actualizada! La próxima vez usa la nueva."
      });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Info de la cuenta */}
      <section className="bg-white rounded-3xl border border-mauve-100 p-6 shadow-card">
        <h2 className="font-serif text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-mauve-700" />
          Tu cuenta
        </h2>
        <div className="p-4 rounded-2xl bg-mauve-50/60 border border-mauve-100">
          <p className="text-xs uppercase tracking-wider text-mauve-700 font-medium mb-1">
            Correo de acceso
          </p>
          <p className="text-charcoal font-medium">{email}</p>
        </div>
        <p className="text-xs text-charcoal-muted mt-3">
          Para cambiar tu correo de acceso, contacta a tu desarrollador.
        </p>
      </section>

      {/* Cambiar contraseña */}
      <section className="bg-white rounded-3xl border border-mauve-100 p-6 shadow-card">
        <h2 className="font-serif text-xl font-semibold text-charcoal mb-1 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-mauve-700" />
          Cambiar contraseña
        </h2>
        <p className="text-sm text-charcoal-muted mb-5">
          Elige una contraseña segura. La necesitarás la próxima vez que entres.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="current">Contraseña actual</Label>
            <div className="relative mt-1.5">
              <Input
                id="current"
                type={showCurrent ? "text" : "password"}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-charcoal cursor-pointer"
                aria-label={showCurrent ? "Ocultar" : "Mostrar"}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="new">Nueva contraseña</Label>
            <div className="relative mt-1.5">
              <Input
                id="new"
                type={showNew ? "text" : "password"}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-charcoal cursor-pointer"
                aria-label={showNew ? "Ocultar" : "Mostrar"}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm">Confirmar nueva contraseña</Label>
            <Input
              id="confirm"
              type={showNew ? "text" : "password"}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className="mt-1.5"
            />
          </div>

          {/* Requisitos */}
          {newPwd.length > 0 && (
            <div className="p-4 rounded-xl bg-mauve-50/50 border border-mauve-100 space-y-1.5">
              <p className="text-xs uppercase tracking-wider text-mauve-700 font-medium mb-2">
                Requisitos
              </p>
              <Req ok={checks.length}>Al menos 8 caracteres</Req>
              <Req ok={checks.letter}>Incluye al menos una letra</Req>
              <Req ok={checks.number}>Incluye al menos un número</Req>
              <Req ok={checks.match}>Las contraseñas coinciden</Req>
            </div>
          )}

          {feedback?.type === "error" && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{feedback.message}</p>
            </div>
          )}

          {feedback?.type === "success" && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{feedback.message}</p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={pending || !allOk}>
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Actualizar contraseña
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Req({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-center gap-2 text-xs transition-colors", ok ? "text-green-700" : "text-charcoal-muted")}>
      <div className={cn(
        "w-4 h-4 rounded-full flex items-center justify-center transition-colors",
        ok ? "bg-green-100" : "bg-mauve-100"
      )}>
        {ok ? <Check className="w-2.5 h-2.5 text-green-700" /> : <span className="w-1.5 h-1.5 rounded-full bg-mauve-400" />}
      </div>
      {children}
    </div>
  );
}
