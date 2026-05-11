"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";

export function ClinicSignupForm() {
  const router = useRouter();
  const [clinicName, setClinicName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/clinic/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicName, adminName, email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (data.error === "email_taken") {
          setFormError("Un compte existe déjà avec cet e-mail.");
        } else if (data.error === "missing_fields") {
          setFormError("Renseignez tous les champs.");
        } else if (data.error === "password_too_short") {
          setFormError("Le mot de passe doit contenir au moins 8 caractères.");
        } else if (data.error === "rate_limited") {
          setFormError("Trop de tentatives. Réessayez plus tard.");
        } else if (data.error?.includes("MONGODB_URI")) {
          setFormError("Base de données indisponible. Vérifiez MongoDB (.env).");
        } else {
          setFormError("Création impossible. Réessayez.");
        }
        return;
      }
      router.push("/clinic");
      router.refresh();
    } catch {
      setFormError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Créer votre clinique"
      subtitle="Espace clinique pour gérer les comptes médecins et accéder à l'application."
      footer={
        <p className="text-center text-sm text-[var(--muted)]">
          Déjà une clinique ?{" "}
          <Link
            href="/clinic-login"
            className="font-semibold text-[var(--teal)] hover:underline"
          >
            Connexion clinique
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
            htmlFor="cl-name"
            className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]"
          >
            Nom de la clinique
          </label>
          <input
            id="cl-name"
            required
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="cl-admin"
            className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]"
          >
            Nom de l&apos;administrateur
          </label>
          <input
            id="cl-admin"
            required
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            placeholder="Dr. …"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="cl-email"
            className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]"
          >
            E-mail admin
          </label>
          <input
            id="cl-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="cl-pass"
            className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]"
          >
            Mot de passe admin (min. 8 caractères)
          </label>
          <input
            id="cl-pass"
            type="password"
            required
            minLength={8}
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
          {loading ? "Création…" : "Créer la clinique"}
        </button>
      </form>
    </AuthCard>
  );
}

