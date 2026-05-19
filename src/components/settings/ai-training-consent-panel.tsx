"use client";

import { useCallback, useEffect, useState } from "react";
import type { DoctorAiTrainingSettings } from "@/types/training";

export function AiTrainingConsentPanel() {
  const [settings, setSettings] = useState<DoctorAiTrainingSettings | null>(
    null,
  );
  const [consentVersion, setConsentVersion] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/training/consent");
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setSettings(data.settings);
      setConsentVersion(data.consentVersion ?? "");
    } catch {
      setError("Impossible de charger les préférences.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleConsent(enabled: boolean) {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/training/consent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("save_failed");
      const data = await res.json();
      setSettings(data.settings);
      setConsentVersion(data.consentVersion ?? "");
      if (enabled) {
        setMessage(
          "Consentement enregistré. Synchronisation des dossiers en cours…",
        );
        await runSync();
      } else {
        setMessage(
          "Contribution désactivée. Aucun nouveau dossier ne sera collecté.",
        );
      }
    } catch {
      setError("Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function runSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/training/sync", { method: "POST" });
      if (!res.ok) throw new Error("sync_failed");
      const data = await res.json();
      const s = data.stats;
      if (s?.skippedNoConsent) {
        setMessage("Activez d'abord la contribution pour synchroniser.");
        return;
      }
      setMessage(
        `Synchronisation terminée : ${s?.processed ?? 0} dossiers traités, ${s?.inserted ?? 0} ajoutés, ${s?.updated ?? 0} mis à jour.`,
      );
    } catch {
      setError("Échec de la synchronisation.");
    } finally {
      setSyncing(false);
    }
  }

  const enabled = settings?.enabled ?? false;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-xs)] sm:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            Contribution au modèle Hawae
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--muted)]">
            En activant cette option, vous autorisez la copie des dossiers
            patientes <strong>complets</strong> (identité, anamnèse, bilans,
            historique Hawae, FIV, partogrammes, certificats, etc.) vers MongoDB
            pour l&apos;entraînement du modèle Hawae. Vous pouvez désactiver à
            tout moment.
          </p>
        </div>
        <span
          className={
            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide " +
            (enabled
              ? "bg-[var(--teal-pale)] text-[var(--green)]"
              : "bg-[var(--cream)] text-[var(--muted)]")
          }
        >
          {enabled ? "Actif" : "Inactif"}
        </span>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-[var(--ink-mid)]">
        <li className="flex items-start gap-2">
          <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--teal)]" />
          Dossier complet + historique de consultations + réponses Hawae.
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--teal)]" />
          Données PMA/FIV, partogrammes, certificats et documents liés.
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
          Synchronisation automatique à chaque sauvegarde (dossier, modules, agenda).
        </li>
      </ul>

      {consentVersion ? (
        <p className="mt-3 text-[11px] text-[var(--muted)]">
          Version du consentement : {consentVersion}
          {settings?.consentedAt
            ? ` — accepté le ${new Date(settings.consentedAt).toLocaleDateString("fr-FR")}`
            : ""}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-[var(--muted)]">Chargement…</p>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void toggleConsent(!enabled)}
            className={
              enabled
                ? "rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--cream)]"
                : "rounded-xl bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            }
          >
            {saving
              ? "Enregistrement…"
              : enabled
                ? "Désactiver la contribution"
                : "J'accepte — activer la contribution"}
          </button>
          {enabled ? (
            <button
              type="button"
              disabled={syncing}
              onClick={() => void runSync()}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--ink-mid)] hover:bg-[var(--teal-pale)]/30"
            >
              {syncing ? "Synchronisation…" : "Resynchroniser les dossiers"}
            </button>
          ) : null}
        </div>
      )}

      {message ? (
        <p className="mt-3 text-sm text-[var(--green)]">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-[var(--red)]">{error}</p>
      ) : null}
    </section>
  );
}
