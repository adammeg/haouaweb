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
  count: number;
  listQuery: string;
  onListQuery: (q: string) => void;
  specFilter: Specialty | "all";
  onSpecFilter: (f: Specialty | "all") => void;
  onOpen: (id: string) => void;
  onNew: () => void;
  hasAny: boolean;
};

export function DossierListView({
  patients,
  count,
  listQuery,
  onListQuery,
  specFilter,
  onSpecFilter,
  onOpen,
  onNew,
  hasAny,
}: Props) {
  return (
    <div className="dossier-list-screen">
      <div className="dl-topbar">
        <div>
          <div className="dl-title">📋 Dossiers patientes</div>
          <div className="dl-count">
            {count} dossier{count !== 1 ? "s" : ""} affiché{count !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="dl-search">
          <span aria-hidden>🔍</span>
          <input
            type="search"
            placeholder="Rechercher par nom, motif…"
            value={listQuery}
            onChange={(e) => onListQuery(e.target.value)}
            aria-label="Rechercher un dossier"
          />
        </div>
        <button type="button" className="dl-new-btn" onClick={onNew}>
          ＋ Nouvelle patiente
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={`dossier-sf-chip border border-[var(--border)] bg-white ${specFilter === "all" ? "active !border-[var(--teal)] !bg-[var(--teal)] !text-white" : ""}`}
          onClick={() => onSpecFilter("all")}
        >
          Tous
        </button>
        {SPECS.map((s) => (
          <button
            key={s}
            type="button"
            className={`dossier-sf-chip border border-[var(--border)] bg-white ${specFilter === s ? "active !border-[var(--teal)] !bg-[var(--teal)] !text-white" : ""}`}
            onClick={() => onSpecFilter(s)}
          >
            {SPECIALTY_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="dl-grid">
        {patients.length === 0 ? (
          <div className="dl-empty">
            <div className="dl-empty-icon">📋</div>
            <div className="dl-empty-text">
              {hasAny ? "Aucun résultat pour ces filtres." : "Aucun dossier pour l'instant."}
            </div>
            <div className="dl-empty-sub">
              Créez une fiche patiente pour démarrer une consultation.
            </div>
            <button type="button" className="dl-new-btn mt-6" onClick={onNew}>
              Créer un dossier
            </button>
          </div>
        ) : (
          patients.map((p) => {
            const age = patientAgeYears(p.ddn);
            const spec = p.specialite as Specialty | undefined;
            return (
              <button
                key={p.id}
                type="button"
                className="dl-card"
                onClick={() => onOpen(p.id)}
              >
                <div
                  className="dl-card-avatar"
                  style={{
                    background:
                      SPEC_AVATAR_COLORS[spec ?? ""] ?? "var(--teal)",
                  }}
                >
                  {patientInitials(p)}
                </div>
                <div className="dl-card-info">
                  <div className="dl-card-name">{getPatientDisplayName(p)}</div>
                  <div className="dl-card-meta">
                    {age != null ? `${age} ans` : "Âge ?"}
                    {p.motif ? ` · ${p.motif.slice(0, 40)}` : ""}
                  </div>
                  {spec ? (
                    <span className={`dl-card-spec ${spec}`}>
                      {SPECIALTY_LABELS[spec]}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
