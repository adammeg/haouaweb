"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "./auth-card";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (data.error === "email_taken") {
          setFormError("Un compte existe déjà avec cet e-mail.");
        } else if (data.error === "rate_limited") {
          setFormError("Trop d’inscriptions depuis cette connexion. Réessayez plus tard.");
        } else if (data.error === "password_too_long") {
          setFormError("Mot de passe trop long (max. 256 caractères).");
        } else if (data.error === "password_too_short") {
          setFormError("Le mot de passe doit contenir au moins 8 caractères.");
        } else if (data.error === "invalid_email") {
          setFormError("Adresse e-mail invalide.");
        } else if (data.error === "missing_fields") {
          setFormError("Renseignez tous les champs.");
        } else if (
          data.error?.includes("MONGODB_URI") ||
          data.error?.includes("Mongo")
        ) {
          setFormError(
            "Base de données indisponible. Démarrez MongoDB et définissez MONGODB_URI dans .env.",
          );
        } else {
          setFormError("Inscription impossible. Réessayez.");
        }
        return;
      }
      router.push("/dossier");
      router.refresh();
    } catch {
      setFormError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Créer un compte médecin"
      subtitle="Compte local pour cet appareil / serveur (données dans .data/doctors.json)."
      footer={
        <p className="text-center text-sm text-[var(--muted)]">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-semibold text-[var(--teal)] hover:underline">
            Se connecter
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
          <label htmlFor="su-name" className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]">
            Nom complet
          </label>
          <input
            id="su-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dr. …"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="su-email" className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]">
            E-mail professionnel
          </label>
          <input
            id="su-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
          />
        </div>
        <div>
          <label
            htmlFor="su-password"
            className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]"
          >
            Mot de passe (min. 8 caractères)
          </label>
          <input
            id="su-password"
            name="password"
            type="password"
            autoComplete="new-password"
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
          {loading ? "Création…" : "Créer mon compte"}
        </button>
      </form>
    </AuthCard>
  );
}
