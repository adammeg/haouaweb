"use client";

import { useEffect, useMemo, useState } from "react";
import type { PatientSnapshot } from "@/types/domain";
import { dossierDisplayName } from "@/lib/dossier/patient-meta";
import {
  CR_OP_LABELS,
  printCrOpPdf,
  type CrOpType,
  type CrOpData,
} from "@/lib/cr-op/cr-op-pdf";

type Props = {
  open: boolean;
  onClose: () => void;
  draft: PatientSnapshot;
  operateur?: string;
  etablissement?: string;
};

const TYPE_ICONS: Record<CrOpType, string> = {
  coelio: "🔬",
  hystero: "🩺",
  cesarienne: "👶",
  laparotomie: "🔪",
  conisation: "✂️",
  autre: "🏥",
};

type FieldDef =
  | { key: string; label: string; type: "text" | "number" | "textarea"; placeholder?: string; full?: boolean }
  | { key: string; label: string; type: "select"; options: string[]; full?: boolean };

const TYPE_FIELDS: Record<CrOpType, FieldDef[]> = {
  coelio: [
    { key: "voie", label: "Voie d'abord", type: "select", options: ["Open-cœlioscopie (ombilicale)", "Aiguille de Veress"] },
    { key: "pression", label: "Pneumopéritoine (mmHg)", type: "number", placeholder: "12" },
    { key: "geste", label: "Geste principal", type: "text", placeholder: "ex : kystectomie ovarienne droite" },
    { key: "detail", label: "Détail de la technique", type: "textarea", full: true },
    { key: "anapath", label: "Pièce / Anatomopathologie", type: "text", full: true },
  ],
  hystero: [
    { key: "type", label: "Type", type: "select", options: ["Diagnostique", "Opératoire"] },
    { key: "milieu", label: "Milieu de distension", type: "select", options: ["Sérum physiologique", "Glycocolle", "Sorbitol", "CO₂"] },
    { key: "geste", label: "Geste", type: "text", placeholder: "ex : résection de polype" },
    { key: "detail", label: "Détail de la technique", type: "textarea", full: true },
  ],
  cesarienne: [
    { key: "terme", label: "Terme", type: "text", placeholder: "ex : 39 SA + 2 j" },
    { key: "indication", label: "Indication", type: "text", placeholder: "ex : utérus cicatriciel" },
    { key: "incision", label: "Incision", type: "select", options: ["Pfannenstiel", "Médiane sous-ombilicale", "Joel-Cohen"] },
    { key: "pres", label: "Présentation", type: "select", options: ["Céphalique", "Siège", "Transverse"] },
    { key: "apgar", label: "Apgar 1'/5'", type: "text", placeholder: "ex : 9/10" },
    { key: "poids", label: "Poids de naissance (g)", type: "number", placeholder: "3200" },
    { key: "detail", label: "Détail de la technique", type: "textarea", full: true },
  ],
  laparotomie: [
    { key: "incision", label: "Incision", type: "select", options: ["Pfannenstiel", "Médiane sous-ombilicale", "Médiane à cheval"] },
    { key: "geste", label: "Geste", type: "text", placeholder: "ex : hystérectomie totale" },
    { key: "detail", label: "Détail de la technique", type: "textarea", full: true },
    { key: "sang", label: "Pertes sanguines (mL)", type: "number", placeholder: "300" },
    { key: "drain", label: "Drainage", type: "text", placeholder: "ex : redon aspiratif" },
  ],
  conisation: [
    { key: "tech", label: "Technique", type: "select", options: ["Anse diathermique", "Bistouri froid", "Laser CO₂"] },
    { key: "hauteur", label: "Hauteur du cône (mm)", type: "number", placeholder: "15" },
    { key: "indication", label: "Indication", type: "text", placeholder: "ex : CIN 2/3" },
    { key: "detail", label: "Détail de la technique", type: "textarea", full: true },
  ],
  autre: [
    { key: "titre", label: "Intitulé de l'intervention", type: "text", full: true },
    { key: "detail", label: "Détail de la technique", type: "textarea", full: true },
  ],
};

const ANESTHESIES = ["Anesthésie générale", "Rachianesthésie", "Péridurale", "Anesthésie locale", "Sédation"];
const POSITIONS = ["Décubitus dorsal", "Position gynécologique", "Trendelenburg", "Décubitus dorsal + jambières"];
const SUITES = ["Simples", "Surveillance rapprochée", "Compliquées"];
const SAIGNEMENTS = ["Minime", "Modéré (< 500 mL)", "Important (> 500 mL)"];

function computeAge(ddn?: string): string {
  if (!ddn) return "";
  const d = new Date(ddn);
  if (Number.isNaN(d.getTime())) return "";
  const age = Math.floor((Date.now() - d.getTime()) / 31557600000);
  return age > 0 && age < 130 ? age + " ans" : "";
}

export function CrOpModal({
  open,
  onClose,
  draft,
  operateur = "Le médecin",
  etablissement = "Votre établissement",
}: Props) {
  const [type, setType] = useState<CrOpType>("coelio");
  const [common, setCommon] = useState({
    date: "",
    duree: "",
    indication: "",
    anesthesie: ANESTHESIES[0],
    position: POSITIONS[0],
    suites: SUITES[0],
    saignement: SAIGNEMENTS[0],
    prescriptions: "",
    commentaire: "",
  });
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const today = new Date().toISOString().split("T")[0];
    setCommon((c) => ({
      ...c,
      date: c.date || today,
      indication: c.indication || draft.motif || "",
    }));
  }, [open, draft.motif]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const patientName = useMemo(() => dossierDisplayName(draft), [draft]);
  const typeFields = TYPE_FIELDS[type];

  if (!open) return null;

  const setField = (k: string, v: string) =>
    setFields((f) => ({ ...f, [k]: v }));

  const generate = () => {
    const data: CrOpData = {
      type,
      patientName,
      age: computeAge(draft.ddn),
      operateur,
      etablissement,
      date: common.date,
      duree: common.duree,
      indication: common.indication,
      anesthesie: common.anesthesie,
      position: common.position,
      suites: common.suites,
      saignement: common.saignement,
      prescriptions: common.prescriptions,
      commentaire: common.commentaire,
      fields,
    };
    printCrOpPdf(data);
    onClose();
  };

  const inputCls =
    "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--teal)] focus:outline-none";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[var(--surface,#fff)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-[#0d4f4f] to-[#1a9a9a] px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              🏥 Compte-Rendu Opératoire
            </h2>
            <p className="text-xs text-white/80">{patientName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/15 px-2.5 py-1 text-sm text-white hover:bg-white/25"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(CR_OP_LABELS) as CrOpType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors " +
                  (type === t
                    ? "border-[var(--teal)] bg-[var(--teal-pale)] text-[var(--teal)]"
                    : "border-[var(--border)] bg-white text-[var(--ink-mid)] hover:bg-[var(--teal-pale)]/40")
                }
              >
                {TYPE_ICONS[t]} {CR_OP_LABELS[t]}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                Date d&apos;intervention
              </span>
              <input
                type="date"
                value={common.date}
                onChange={(e) => setCommon({ ...common, date: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                Durée (min)
              </span>
              <input
                type="number"
                value={common.duree}
                onChange={(e) => setCommon({ ...common, duree: e.target.value })}
                className={inputCls}
                placeholder="45"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                Indication
              </span>
              <input
                type="text"
                value={common.indication}
                onChange={(e) =>
                  setCommon({ ...common, indication: e.target.value })
                }
                className={inputCls}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                Anesthésie
              </span>
              <select
                value={common.anesthesie}
                onChange={(e) =>
                  setCommon({ ...common, anesthesie: e.target.value })
                }
                className={inputCls}
              >
                {ANESTHESIES.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                Position
              </span>
              <select
                value={common.position}
                onChange={(e) =>
                  setCommon({ ...common, position: e.target.value })
                }
                className={inputCls}
              >
                {POSITIONS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="my-4 border-t border-[var(--border)] pt-4">
            <h3 className="mb-3 text-sm font-bold text-[var(--teal)]">
              {TYPE_ICONS[type]} Technique — {CR_OP_LABELS[type]}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {typeFields.map((f) => (
                <label
                  key={f.key}
                  className={"text-sm" + (f.full ? " sm:col-span-2" : "")}
                >
                  <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                    {f.label}
                  </span>
                  {f.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={fields[f.key] ?? ""}
                      onChange={(e) => setField(f.key, e.target.value)}
                      className={inputCls}
                    />
                  ) : f.type === "select" ? (
                    <select
                      value={fields[f.key] ?? f.options[0]}
                      onChange={(e) => setField(f.key, e.target.value)}
                      className={inputCls}
                    >
                      {f.options.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type}
                      value={fields[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => setField(f.key, e.target.value)}
                      className={inputCls}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                Suites opératoires
              </span>
              <select
                value={common.suites}
                onChange={(e) => setCommon({ ...common, suites: e.target.value })}
                className={inputCls}
              >
                {SUITES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                Saignement
              </span>
              <select
                value={common.saignement}
                onChange={(e) =>
                  setCommon({ ...common, saignement: e.target.value })
                }
                className={inputCls}
              >
                {SAIGNEMENTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                Prescriptions post-opératoires
              </span>
              <textarea
                rows={2}
                value={common.prescriptions}
                onChange={(e) =>
                  setCommon({ ...common, prescriptions: e.target.value })
                }
                className={inputCls}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                Commentaires
              </span>
              <textarea
                rows={2}
                value={common.commentaire}
                onChange={(e) =>
                  setCommon({ ...common, commentaire: e.target.value })
                }
                className={inputCls}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--cream)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink-mid)]"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={generate}
            className="rounded-xl bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            📄 Générer le CR opératoire PDF
          </button>
        </div>
      </div>
    </div>
  );
}
