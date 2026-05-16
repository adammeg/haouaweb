"use client";

import type { PatientSnapshot, Specialty } from "@/types/domain";
import { SPECIALTY_LABELS } from "@/types/domain";
import {
  getPatientDisplayName,
  patientAgeYears,
} from "@/lib/patient-utils";
import {
  patientInitials,
  SPEC_AVATAR_COLORS,
} from "@/lib/dossier/patient-meta";

const SPECS: Specialty[] = ["gyn", "obst", "inf"];

type Props = {
  patients: PatientSnapshot[];
  currentId: string | null;
  listQuery: string;
  onListQuery: (q: string) => void;
  specFilter: Specialty | "all";
  onSpecFilter: (f: Specialty | "all") => void;
  onSelect: (id: string) => void;
  onNewPatient: () => void;
};

export function DossierPatientsSidebar({
  patients,
  currentId,
  listQuery,
  onListQuery,
  specFilter,
  onSpecFilter,
  onSelect,
  onNewPatient,
}: Props) {
  return (
    <aside className="dossier-patients-sidebar">
      <button type="button" className="dossier-new-patient-btn" onClick={onNewPatient}>
        ＋ Nouvelle patiente
      </button>
      <div className="dossier-search-box">
        <span className="si" aria-hidden>
          🔍
        </span>
        <input
          type="search"
          placeholder="Nom, motif, CIN…"
          value={listQuery}
          onChange={(e) => onListQuery(e.target.value)}
          aria-label="Rechercher une patiente"
        />
      </div>
      <div className="dossier-sf-chips">
        <button
          type="button"
          className={`dossier-sf-chip ${specFilter === "all" ? "active" : ""}`}
          onClick={() => onSpecFilter("all")}
        >
          Tous
        </button>
        {SPECS.map((s) => (
          <button
            key={s}
            type="button"
            className={`dossier-sf-chip ${specFilter === s ? "active" : ""}`}
            onClick={() => onSpecFilter(s)}
          >
            {s === "gyn" ? "Gynéco" : s === "obst" ? "Obst" : "Fert"}
          </button>
        ))}
      </div>
      <span className="dossier-sidebar-label">Dossiers récents</span>
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {patients.map((p) => {
          const age = patientAgeYears(p.ddn);
          const spec = p.specialite as Specialty | undefined;
          return (
            <button
              key={p.id}
              type="button"
              className={`dossier-patient-item ${p.id === currentId ? "active" : ""}`}
              onClick={() => onSelect(p.id)}
            >
              <div
                className="dossier-patient-avatar"
                style={{
                  background:
                    SPEC_AVATAR_COLORS[spec ?? ""] ?? "rgba(255,255,255,0.15)",
                }}
              >
                {patientInitials(p)}
              </div>
              <div className="dossier-patient-info min-w-0">
                <div className="pname truncate">{getPatientDisplayName(p)}</div>
                <div className="pmeta truncate">
                  {spec ? SPECIALTY_LABELS[spec] : "—"}
                  {age != null ? ` · ${age}a` : ""}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
