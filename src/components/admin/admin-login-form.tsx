"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (data.error === "invalid_credentials") {
          setFormError("E-mail ou mot de passe incorrect.");
        } else if (data.error === "not_app_admin") {
          setFormError("Ce compte n'est pas un admin de l'application.");
        } else if (data.error === "account_disabled") {
          setFormError("Compte désactivé.");
        } else if (data.error === "rate_limited") {
          setFormError("Trop de tentatives. Patientez une minute puis réessayez.");
        } else {
          setFormError("Connexion impossible. Réessayez.");
        }
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setFormError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Connexion admin"
      subtitle="Administration globale (cliniques et comptes médecins)."
      footer={
        <p className="text-center text-sm text-[var(--muted)]">
          Retour{" "}
          <Link href="/" className="font-semibold text-[var(--teal)] hover:underline">
            Accueil
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
          <label
            htmlFor="adm-email"
            className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]"
          >
            E-mail admin
          </label>
          <input
            id="adm-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="adm-pass"
            className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]"
          >
            Mot de passe
          </label>
          <input
            id="adm-pass"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--teal)] py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </AuthCard>
  );
}

