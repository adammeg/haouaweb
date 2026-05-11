"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RDV_LABELS,
  RDV_STATUTS,
  RDV_TYPE_ICONS,
  type Rdv,
  type RdvDraft,
  type RdvStatut,
  type RdvType,
} from "@/stores/rdv-store";
import { useRdvStore } from "@/stores/rdv-store";
import { useHawaeStore } from "@/stores/hawae-store";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";
import { getPatientDisplayName } from "@/lib/patient-utils";

const TYPES: RdvType[] = [
  "consultation",
  "grossesse",
  "echo",
  "chirurgie",
  "bilan",
  "urgence",
];

type RdvModalProps =
  | {
      mode: "create";
      open: boolean;
      prefillDate?: string;
      prefillHeure?: string;
      prefillPatient?: string;
      onClose: () => void;
      onSaved?: (id: string) => void;
    }
  | {
      mode: "edit";
      open: boolean;
      rdv: Rdv;
      onClose: () => void;
      onSaved?: (id: string) => void;
    };

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function emptyDraft(
  prefillDate?: string,
  prefillHeure?: string,
  prefillPatient?: string,
): RdvDraft {
  return {
    patient: prefillPatient ?? "",
    tel: "",
    date: prefillDate ?? todayIso(),
    heure: prefillHeure ?? "09:00",
    duree: 30,
    type: "consultation",
    statut: "confirme",
    notes: "",
  };
}

export function RdvModal(props: RdvModalProps) {
  const { open, mode, onClose, onSaved } = props;
  const save = useRdvStore((s) => s.saveRdv);
  const removeRdv = useRdvStore((s) => s.deleteRdv);

  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });
  const patientNames = useMemo(
    () =>
      Object.values(patientsMap)
        .map((p) => getPatientDisplayName(p))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "fr")),
    [patientsMap],
  );

  const [draft, setDraft] = useState<RdvDraft>(() => {
    if (mode === "edit") {
      const r = props.rdv;
      return {
        id: r.id,
        patient: r.patient,
        tel: r.tel,
        date: r.date,
        heure: r.heure,
        duree: r.duree,
        type: r.type,
        statut: r.statut,
        notes: r.notes,
      };
    }
    return emptyDraft(
      props.prefillDate,
      props.prefillHeure,
      props.prefillPatient,
    );
  });

  const [error, setError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit") {
      const r = props.rdv;
      setDraft({
        id: r.id,
        patient: r.patient,
        tel: r.tel,
        date: r.date,
        heure: r.heure,
        duree: r.duree,
        type: r.type,
        statut: r.statut,
        notes: r.notes,
      });
    } else {
      setDraft(
        emptyDraft(props.prefillDate, props.prefillHeure, props.prefillPatient),
      );
    }
    setError(null);
    setTimeout(() => firstInputRef.current?.focus(), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = draft.patient.trim();
    if (!p) return setError("Nom de la patiente requis.");
    if (!draft.date) return setError("Date requise.");
    if (!draft.heure) return setError("Heure requise.");
    const id = save({ ...draft, patient: p });
    onSaved?.(id);
    onClose();
  }

  function onDelete() {
    if (mode !== "edit") return;
    if (!confirm("Supprimer ce rendez-vous ?")) return;
    removeRdv(props.rdv.id);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rdv-modal-title"
      className="fixed inset-0 z-[500] flex items-start justify-center overflow-y-auto bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mt-[4vh] w-full max-w-[560px] rounded-2xl bg-white p-6 shadow-[var(--shadow-l)]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2
              id="rdv-modal-title"
              className="rdv-modal-title font-display"
            >
              {mode === "edit"
                ? "Modifier le rendez-vous"
                : "Nouveau rendez-vous"}
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Planifiez une consultation — les données restent isolées par
              médecin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--cream)]"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--teal)]">
              Type de RDV
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, type: t }))}
                  className={`rdv-type-btn ${
                    draft.type === t ? "active" : ""
                  }`}
                  data-type={t}
                >
                  <span className="rdv-type-icon" aria-hidden>
                    {RDV_TYPE_ICONS[t]}
                  </span>
                  {RDV_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="rdv-patient"
              className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]"
            >
              Patiente *
            </label>
            <input
              id="rdv-patient"
              ref={firstInputRef}
              list="rdv-patient-list"
              value={draft.patient}
              onChange={(e) =>
                setDraft((d) => ({ ...d, patient: e.target.value }))
              }
              placeholder="Nom et prénom"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
            />
            <datalist id="rdv-patient-list">
              {patientNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="rdv-tel"
                className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]"
              >
                Téléphone
              </label>
              <input
                id="rdv-tel"
                type="tel"
                value={draft.tel}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, tel: e.target.value }))
                }
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
              />
            </div>
            <div>
              <label
                htmlFor="rdv-duree"
                className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]"
              >
                Durée (min)
              </label>
              <select
                id="rdv-duree"
                value={draft.duree}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, duree: Number(e.target.value) }))
                }
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
              >
                {[15, 30, 45, 60, 90, 120].map((n) => (
                  <option key={n} value={n}>
                    {n} min
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor="rdv-date"
                className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]"
              >
                Date *
              </label>
              <input
                id="rdv-date"
                type="date"
                value={draft.date}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, date: e.target.value }))
                }
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
              />
            </div>
            <div>
              <label
                htmlFor="rdv-heure"
                className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]"
              >
                Heure *
              </label>
              <input
                id="rdv-heure"
                type="time"
                value={draft.heure}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, heure: e.target.value }))
                }
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
              />
            </div>
            <div>
              <label
                htmlFor="rdv-statut"
                className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]"
              >
                Statut
              </label>
              <select
                id="rdv-statut"
                value={draft.statut}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    statut: e.target.value as RdvStatut,
                  }))
                }
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
              >
                {(Object.keys(RDV_STATUTS) as RdvStatut[]).map((k) => (
                  <option key={k} value={k}>
                    {RDV_STATUTS[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="rdv-notes"
              className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]"
            >
              Notes
            </label>
            <textarea
              id="rdv-notes"
              rows={3}
              value={draft.notes}
              onChange={(e) =>
                setDraft((d) => ({ ...d, notes: e.target.value }))
              }
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
            {mode === "edit" ? (
              <button
                type="button"
                onClick={onDelete}
                className="hawae-btn hawae-btn-danger"
              >
                Supprimer
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="hawae-btn hawae-btn-ghost"
              >
                Annuler
              </button>
              <button type="submit" className="hawae-btn hawae-btn-primary">
                {mode === "edit" ? "Enregistrer" : "Créer le RDV"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
