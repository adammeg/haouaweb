"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  RAPPEL_CAT_LABEL,
  RAPPEL_URGENCE_LABEL,
  useRappelsStore,
  type RappelCat,
  type RappelUrgence,
} from "@/stores/rappels-store";
import { useHawaeStore } from "@/stores/hawae-store";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";

/**
 * Port fidèle du modal v48 `rappel-modal` (fonctions openRappelModal /
 * addRappel / closeRappelModal). Les champs sont identiques : description,
 * date, urgence, catégorie, patiente.
 */
export function RappelModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addRappel = useRappelsStore((s) => s.addRappel);
  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });

  const tomorrowISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0]!;
  }, []);

  const [desc, setDesc] = useState("");
  const [date, setDate] = useState<string>(tomorrowISO);
  const [urgence, setUrgence] = useState<RappelUrgence>("medium");
  const [cat, setCat] = useState<RappelCat>("autre");
  const [patient, setPatient] = useState("");
  const [error, setError] = useState<string | null>(null);

  const descId = useId();
  const dateId = useId();
  const urgenceId = useId();
  const catId = useId();
  const patientId = useId();
  const patientListId = useId();

  useEffect(() => {
    if (!open) return;
    setDesc("");
    setDate(tomorrowISO);
    setUrgence("medium");
    setCat("autre");
    setPatient("");
    setError(null);
  }, [open, tomorrowISO]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const patientOptions = Object.values(patientsMap)
    .map((p) =>
      `${p.prenom ?? ""} ${p.nom ?? ""}`.trim() || "",
    )
    .filter((s) => s.length > 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = desc.trim();
    if (!trimmed) {
      setError("⚠️ Description requise");
      return;
    }
    addRappel({
      desc: trimmed,
      date,
      urgence,
      cat,
      patient: patient.trim(),
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rappel-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="rappel-modal-title"
              className="font-display text-lg font-bold text-[var(--ink)]"
            >
              ⏰ Nouveau rappel
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Crée un rappel manuel (à part des RDV). Les rappels échus
              apparaîtront automatiquement dans les notifications.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[var(--muted)] hover:bg-[var(--cream)]"
            aria-label="Fermer"
          >
            ✕
          </button>
        </header>

        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label
              htmlFor={descId}
              className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-mid)]"
            >
              Description *
            </label>
            <input
              id={descId}
              type="text"
              value={desc}
              onChange={(e) => {
                setDesc(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ex : Rappeler résultats bilan thyroïdien"
              autoFocus
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--teal)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={dateId}
                className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-mid)]"
              >
                Date
              </label>
              <input
                id={dateId}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--teal)]"
              />
            </div>
            <div>
              <label
                htmlFor={urgenceId}
                className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-mid)]"
              >
                Urgence
              </label>
              <select
                id={urgenceId}
                value={urgence}
                onChange={(e) =>
                  setUrgence(e.target.value as RappelUrgence)
                }
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--teal)]"
              >
                {(Object.entries(RAPPEL_URGENCE_LABEL) as [
                  RappelUrgence,
                  string,
                ][]).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor={catId}
                className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-mid)]"
              >
                Catégorie
              </label>
              <select
                id={catId}
                value={cat}
                onChange={(e) => setCat(e.target.value as RappelCat)}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--teal)]"
              >
                {(Object.entries(RAPPEL_CAT_LABEL) as [RappelCat, string][]).map(
                  ([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label
                htmlFor={patientId}
                className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-mid)]"
              >
                Patiente (optionnel)
              </label>
              <input
                id={patientId}
                type="text"
                value={patient}
                onChange={(e) => setPatient(e.target.value)}
                list={patientListId}
                placeholder="Nom et prénom"
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--teal)]"
              />
              <datalist id={patientListId}>
                {patientOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          </div>

          {error ? (
            <p className="rounded-md bg-[#fef2f2] px-3 py-2 text-[12px] font-semibold text-[#b91c1c]">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="hawae-btn hawae-btn-ghost"
            >
              Annuler
            </button>
            <button type="submit" className="hawae-btn hawae-btn-primary">
              + Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
