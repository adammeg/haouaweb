"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "./auth-card";

const ERRORS: Record<string, string> = {
  config:
    "Configuration serveur : définissez AUTH_SECRET (min. 16 caractères) dans .env.local puis redémarrez.",
  invalid_credentials: "E-mail ou mot de passe incorrect.",
  disabled: "Compte désactivé. Contactez l'administrateur.",
};

export function LoginForm({ from, errorKey }: { from?: string; errorKey?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(
    errorKey ? (ERRORS[errorKey] ?? null) : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        const errText =
          typeof data.error === "string" ? data.error : "";
        setFormError(
          data.error === "invalid_credentials"
            ? ERRORS.invalid_credentials
            : data.error === "account_disabled"
              ? ERRORS.disabled
            : data.error === "rate_limited"
              ? "Trop de tentatives. Patientez une minute puis réessayez."
              : data.error === "missing_fields"
                ? "Renseignez l’e-mail et le mot de passe."
                : errText.includes("MONGODB_URI") || errText.includes("Mongo")
                  ? "Base de données indisponible. Vérifiez que MongoDB tourne et que MONGODB_URI est défini dans .env."
                  : "Connexion impossible. Réessayez.",
        );
        return;
      }
      const dest =
        from && from.startsWith("/") && !from.startsWith("//")
          ? from
          : "/dossier";
      router.push(dest);
      router.refresh();
    } catch {
      setFormError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Connexion"
      subtitle="Accédez à l’espace médecin (dossiers, consultations)."
      footer={
        <p className="text-center text-sm text-[var(--muted)]">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-semibold text-[var(--teal)] hover:underline">
            Créer un compte
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        {formError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {formError}
          </div>
        ) : null}
        <div>
          <label htmlFor="login-email" className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]">
            E-mail professionnel
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="hawae-input"
          />
        </div>
        <div>
          <label
            htmlFor="login-password"
            className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]"
          >
            Mot de passe
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="hawae-input"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="hawae-btn hawae-btn-primary w-full py-3 disabled:opacity-60"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </AuthCard>
  );
}
