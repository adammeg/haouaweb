import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { AiTrainingConsentPanel } from "@/components/settings/ai-training-consent-panel";
import { PreferencesPanel } from "@/components/settings/preferences-panel";

export const metadata = {
  title: "Paramètres — HawaeMD",
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) return null;

  const roleLabel =
    session.role === "app_admin"
      ? "Administrateur plateforme"
      : session.role === "clinic_admin"
        ? "Administrateur clinique"
        : "Médecin";

  return (
    <div className="space-y-8 py-4">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--teal-pale)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--teal)]">
          Paramètres
        </span>
        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
          Profil & préférences
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-mid)]">
          Gérez les informations affichées sur les ordonnances, l&apos;apparence
          de l&apos;application et les options de sécurité.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-xs)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-bold text-[var(--ink)]">
              Compte connecté
            </h2>
            <span className="rounded-full bg-[var(--teal-pale)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--teal)]">
              {roleLabel}
            </span>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--muted)]">Nom</dt>
              <dd className="truncate font-semibold text-[var(--ink)]">
                {session.name}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--muted)]">Email</dt>
              <dd
                className="truncate font-mono text-[12px] text-[var(--ink-mid)]"
                title={session.email}
              >
                {session.email}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--muted)]">Rôle</dt>
              <dd className="font-semibold text-[var(--ink)]">{roleLabel}</dd>
            </div>
          </dl>
        </section>

        <PreferencesPanel />

        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-xs)]">
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            Raccourcis
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Accès rapide aux espaces principaux.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href="/dossier"
              className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-center text-xs font-semibold text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--teal-pale)]/40"
            >
              Dossiers
            </Link>
            <Link
              href="/salle-attente"
              className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-center text-xs font-semibold text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--teal-pale)]/40"
            >
              Salle d&apos;attente
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-center text-xs font-semibold text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--teal-pale)]/40"
            >
              Tableau de bord
            </Link>
            <Link
              href="/dossier?new=1"
              className="rounded-xl bg-[var(--teal)] px-3 py-2 text-center text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
            >
              Nouvelle patiente
            </Link>
          </div>
        </section>

        <AiTrainingConsentPanel />
      </div>
    </div>
  );
}
