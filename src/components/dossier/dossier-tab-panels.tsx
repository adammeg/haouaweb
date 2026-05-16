"use client";

import { useState } from "react";
import type { ConsultationEntry, PatientSnapshot } from "@/types/domain";

/** @deprecated Utiliser ExamenCliniqueTab */
export function DossierExamenTab({
  draft,
  onField,
}: {
  draft: PatientSnapshot;
  onField: (p: Record<string, string | undefined>) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <DossierField
        label="TA"
        value={draft.ec_ta ?? ""}
        onChange={(v) => onField({ ec_ta: v })}
      />
      <DossierField
        label="Pouls"
        value={draft.ec_pouls ?? ""}
        onChange={(v) => onField({ ec_pouls: v })}
      />
      <DossierField
        label="Température"
        value={draft.ec_temp ?? ""}
        onChange={(v) => onField({ ec_temp: v })}
      />
      <DossierField
        label="Poids (kg)"
        value={draft.ec_poids ?? ""}
        onChange={(v) => onField({ ec_poids: v })}
      />
      <DossierField
        label="Taille (cm)"
        value={draft.ec_taille ?? ""}
        onChange={(v) => onField({ ec_taille: v })}
      />
      <DossierField
        label="HU / SF"
        value={draft.ec_hu ?? ""}
        onChange={(v) => onField({ ec_hu: v })}
      />
      <DossierField
        label="Présentation"
        value={draft.ec_presentation ?? ""}
        onChange={(v) => onField({ ec_presentation: v })}
      />
      <DossierField
        label="BCF"
        value={draft.ec_bcf ?? ""}
        onChange={(v) => onField({ ec_bcf: v })}
      />
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">
          Conclusion examen
        </label>
        <textarea
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
          rows={4}
          value={draft.ec_conclusion ?? ""}
          onChange={(e) => onField({ ec_conclusion: e.target.value })}
        />
      </div>
    </div>
  );
}

export function DossierScoresTab() {
  const [dil, setDil] = useState(0);
  const [eff, setEff] = useState(0);
  const [cons, setCons] = useState(0);
  const [pos, setPos] = useState(0);
  const [haut, setHaut] = useState(0);
  const bishop = dil + eff + cons + pos + haut;
  let interp = "";
  if (bishop >= 9) {
    interp = "Col très favorable — déclenchement très probable de succès.";
  } else if (bishop >= 7) {
    interp = "Col favorable — déclenchement recommandable.";
  } else if (bishop >= 5) {
    interp = "Col moyennement favorable — maturation préalable conseillée.";
  } else {
    interp = "Col défavorable — maturation indispensable avant déclenchement.";
  }

  return (
    <div className="max-w-lg space-y-4">
      <h3 className="font-display text-sm font-bold text-[var(--ink)]">
        Score de Bishop (0–13)
      </h3>
      <ScoreSelect label="Dilatation" value={dil} onChange={setDil} max={3} />
      <ScoreSelect label="Effacement" value={eff} onChange={setEff} max={3} />
      <ScoreSelect
        label="Consistance"
        value={cons}
        onChange={setCons}
        max={2}
      />
      <ScoreSelect label="Position" value={pos} onChange={setPos} max={2} />
      <ScoreSelect
        label="Hauteur présentation"
        value={haut}
        onChange={setHaut}
        max={3}
      />
      <div className="rounded-xl border border-[var(--border)] bg-[var(--teal-pale)] p-4">
        <div className="text-2xl font-bold text-[var(--teal)]">{bishop}/13</div>
        <p className="mt-2 text-sm text-[var(--ink-mid)]">{interp}</p>
      </div>
    </div>
  );
}

function ScoreSelect({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max: number;
}) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm">
      <span className="text-[var(--ink-mid)]">{label}</span>
      <select
        className="rounded-lg border border-[var(--border)] px-2 py-1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {Array.from({ length: max + 1 }, (_, i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DossierHistoriqueTab({
  entries,
  onLoad,
  onDelete,
}: {
  entries: ConsultationEntry[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-[var(--muted)]">
        Aucune consultation archivée. Utilisez le bouton « Historique » dans
        l&apos;en-tête du dossier ou « Nouvelle consultation » pour en créer une.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {entries.map((c) => {
        const d = new Date(c.date);
        return (
          <li
            key={c.id}
            className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm"
          >
            <div className="text-xs font-semibold text-[var(--teal)]">
              {d.toLocaleString("fr-FR")}
            </div>
            <div className="mt-1 font-medium text-[var(--ink)]">{c.motif}</div>
            <p className="mt-1 line-clamp-3 text-xs text-[var(--muted)]">
              {c.symptomes || "—"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-[var(--teal-pale)] px-3 py-1 text-xs font-semibold text-[var(--teal)]"
                onClick={() => onLoad(c.id)}
              >
                Charger
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-1 text-xs text-red-600"
                onClick={() => {
                  if (confirm("Supprimer cette consultation ?")) {
                    onDelete(c.id);
                  }
                }}
              >
                Supprimer
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DossierField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
        {label}
      </span>
      <input
        type={type}
        className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
