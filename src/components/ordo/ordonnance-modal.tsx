"use client";

import { useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { ORDO_SUGGESTIONS, ORDO_TEMPLATES } from "@/data/ordo-catalog";
import type { OrdoLine, PatientSnapshot, Specialty } from "@/types/domain";
import { getPatientDisplayName, patientAgeYears } from "@/lib/patient-utils";

function lineFromSuggestion(s: {
  dci: string;
  dose: string;
  posologie: string;
  duree: string;
  boites?: number;
  cat?: string;
}): OrdoLine {
  return {
    id: nanoid(8),
    dci: s.dci,
    dose: s.dose,
    posologie: s.posologie,
    duree: s.duree,
    boites: s.boites,
    cat: s.cat,
  };
}

export function OrdonnanceModal({
  open,
  onClose,
  patient,
  onPersistToDossier,
}: {
  open: boolean;
  onClose: () => void;
  patient: PatientSnapshot | null;
  /** Enregistre lignes + méta dans le dossier patient (local + synchro). */
  onPersistToDossier?: (payload: {
    lines: OrdoLine[];
    note: string;
    validite: string;
  }) => void;
}) {
  const spec = (patient?.specialite as Specialty) || "gyn";
  const [filter, setFilter] = useState("");
  const [lines, setLines] = useState<OrdoLine[]>(() => [
    lineFromSuggestion({
      dci: "",
      dose: "",
      posologie: "",
      duree: "",
    }),
  ]);
  const [note, setNote] = useState("");
  const [validite, setValidite] = useState("3 mois");

  useEffect(() => {
    if (!open || !patient) return;
    const saved = patient.ordonnanceLines;
    if (saved && saved.length > 0) {
      setLines(saved.map((l) => ({ ...l, id: l.id || nanoid(8) })));
    } else {
      setLines([
        lineFromSuggestion({
          dci: "",
          dose: "",
          posologie: "",
          duree: "",
        }),
      ]);
    }
    setNote(patient.ordonnanceNote ?? "");
    setValidite(patient.ordonnanceValidite ?? "3 mois");
    /**
     * On ne veut rehydrater le formulaire qu'à l'ouverture du modal ou quand
     * la patiente change. Dépendre du `patient` entier réinitialiserait
     * l'édition en cours à chaque frappe (le draft est mis à jour dans le
     * store à chaque saisie).
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patient?.id]);

  function closeAndPersist() {
    onPersistToDossier?.({ lines, note, validite });
    onClose();
  }

  const meds = useMemo(() => {
    const q = filter.toLowerCase();
    const pool = [
      ...(ORDO_SUGGESTIONS[spec] ?? []),
      ...ORDO_SUGGESTIONS.default,
    ];
    const seen = new Set<string>();
    const out: typeof pool = [];
    for (const m of pool) {
      const k = m.dci.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      if (!q || k.includes(q) || (m.cat?.toLowerCase().includes(q) ?? false)) {
        out.push(m);
      }
    }
    return out;
  }, [filter, spec]);

  const header = useMemo(() => {
    if (!patient) return "—";
    const age = patientAgeYears(patient.ddn);
    const bits = [
      getPatientDisplayName(patient),
      age != null ? `${age} ans` : null,
      patient.motif,
    ].filter(Boolean);
    return bits.join(" — ");
  }, [patient]);

  if (!open) return null;

  function addLine(prefill?: Partial<OrdoLine>) {
    setLines((L) => [
      ...L,
      {
        id: nanoid(8),
        dci: prefill?.dci ?? "",
        dose: prefill?.dose ?? "",
        posologie: prefill?.posologie ?? "",
        duree: prefill?.duree ?? "",
        boites: prefill?.boites,
      },
    ]);
  }

  function updateLine(id: string, patch: Partial<OrdoLine>) {
    setLines((L) => L.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeLine(id: string) {
    setLines((L) => (L.length <= 1 ? L : L.filter((l) => l.id !== id)));
  }

  function printOrdo() {
    const w = window.open("", "_blank");
    if (!w) return;
    const rows = lines
      .filter((l) => l.dci.trim())
      .map(
        (l) =>
          `<tr><td>${escapeHtml(l.dci)}</td><td>${escapeHtml(l.dose)}</td><td>${escapeHtml(l.posologie)}</td><td>${escapeHtml(l.duree)}</td></tr>`,
      )
      .join("");
    w.document.write(`<!DOCTYPE html><html><head><title>Ordonnance</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:24px;max-width:720px;margin:0 auto;color:#1a2e2e}
        h1{font-size:18px} table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
        th,td{border:1px solid #d4e8e8;padding:8px;text-align:left}
        th{background:#e8f5f5}
        .meta{font-size:11px;color:#3d5c5c;margin-top:8px}
      </style></head><body>
      <h1>Ordonnance</h1>
      <div class="meta">${escapeHtml(header)}</div>
      <p class="meta">Validité : ${escapeHtml(validite)}</p>
      ${note ? `<p>${escapeHtml(note)}</p>` : ""}
      <table><thead><tr><th>Médicament</th><th>Dose</th><th>Posologie</th><th>Durée</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <script>window.onload=function(){window.print();}</script>
      </body></html>`);
    w.document.close();
  }

  return (
    <div
      className="fixed inset-0 z-[400] flex items-stretch justify-center bg-black/45 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      onClick={closeAndPersist}
    >
      <div
        className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 className="font-display text-base font-bold text-[var(--ink)]">
              Ordonnance structurée
            </h2>
            <p className="text-xs text-[var(--muted)]">{header}</p>
          </div>
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--cream)]"
            onClick={closeAndPersist}
          >
            Fermer
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5 lg:flex-row">
          <div className="flex min-h-[200px] flex-1 flex-col rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 lg:max-w-sm">
            <input
              className="mb-3 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              placeholder="Filtrer médicaments…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <div className="flex-1 space-y-2 overflow-y-auto">
              {meds.map((m) => (
                <button
                  key={m.dci}
                  type="button"
                  className="block w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-left text-xs transition hover:border-[var(--teal)]"
                  onClick={() => addLine(lineFromSuggestion(m))}
                >
                  <span className="font-semibold text-[var(--ink)]">{m.dci}</span>
                  <span className="mt-0.5 block text-[var(--muted)]">
                    {m.cat} · {m.dose}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-[var(--border)] pt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Modèles
              </p>
              <div className="flex flex-col gap-2">
                {ORDO_TEMPLATES.filter(
                  (t) => t.spec === spec || t.spec === "all",
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="rounded-lg border border-dashed border-[var(--teal)]/40 bg-[var(--teal-pale)] px-3 py-2 text-left text-xs"
                    onClick={() => {
                      setLines(
                        t.lignes.map((l) => lineFromSuggestion(l)),
                      );
                    }}
                  >
                    {t.icon} {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-[2] space-y-4">
            <div className="space-y-3">
              {lines.map((l) => (
                <div
                  key={l.id}
                  className="grid gap-2 rounded-xl border border-[var(--border)] bg-white p-3 sm:grid-cols-2 lg:grid-cols-12"
                >
                  <input
                    className="lg:col-span-4 rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                    placeholder="DCI / spécialité"
                    value={l.dci}
                    onChange={(e) => updateLine(l.id, { dci: e.target.value })}
                  />
                  <input
                    className="lg:col-span-2 rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                    placeholder="Dose"
                    value={l.dose}
                    onChange={(e) => updateLine(l.id, { dose: e.target.value })}
                  />
                  <input
                    className="lg:col-span-4 rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                    placeholder="Posologie"
                    value={l.posologie}
                    onChange={(e) =>
                      updateLine(l.id, { posologie: e.target.value })
                    }
                  />
                  <input
                    className="lg:col-span-1 rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                    placeholder="Durée"
                    value={l.duree}
                    onChange={(e) => updateLine(l.id, { duree: e.target.value })}
                  />
                  <button
                    type="button"
                    className="lg:col-span-1 text-xs text-red-500"
                    onClick={() => removeLine(l.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-[var(--teal)]"
              onClick={() => addLine()}
            >
              + Ligne vide
            </button>

            <textarea
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              rows={2}
              placeholder="Note libre (facultatif)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                Validité
                <input
                  className="rounded border border-[var(--border)] px-2 py-1"
                  value={validite}
                  onChange={(e) => setValidite(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="ml-auto rounded-xl bg-[var(--teal)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
                onClick={printOrdo}
              >
                Imprimer / PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
