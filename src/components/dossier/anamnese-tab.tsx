"use client";

import type { PatientSnapshot, Specialty } from "@/types/domain";
import type { FieldPatch } from "@/components/dossier/form-primitives";
import { AnaCard, SpecChooser } from "@/components/dossier/anamnese-shared";
import { SocleCard } from "@/components/dossier/socle-card";
import { GynAnamnese } from "@/components/dossier/anamnese-gyn";
import { ObstAnamnese } from "@/components/dossier/anamnese-obst";
import { InfAnamnese } from "@/components/dossier/anamnese-inf";
import type { DossierTabId } from "@/lib/dossier/dossier-nav";

export function AnamneseTab({
  draft,
  onField,
  onNavigateTab,
  patchDraft,
}: {
  draft: PatientSnapshot;
  onField: (p: FieldPatch) => void;
  patchDraft: (p: Partial<PatientSnapshot>) => void;
  onNavigateTab?: (tab: DossierTabId) => void;
}) {
  const spec = (draft.specialite as Specialty) || "gyn";
  return (
    <div className="anamnese-tab space-y-0">
      <SocleCard key={draft.id} draft={draft} onField={onField} patchDraft={patchDraft} />

      <AnaCard title="🏥 Consultation du jour" ar="التخصص الطبي">
        <p className="ana-intro">
          Sélectionnez le type de consultation pour afficher l&apos;anamnèse adaptée :
        </p>
        <SpecChooser
          spec={spec}
          onSelect={(s) => onField({ specialite: s })}
        />
      </AnaCard>

      {spec === "gyn" && <GynAnamnese draft={draft} onField={onField} />}
      {spec === "obst" && <ObstAnamnese draft={draft} onField={onField} />}
      {spec === "inf" && <InfAnamnese draft={draft} onField={onField} />}

      {spec && (
        <button
          type="button"
          className="ia-launch-btn"
          onClick={() => onNavigateTab?.("hawae")}
        >
          <span className="ilb-icon">✦</span>
          <div className="ilb-body">
            <div className="ilb-title">Consulter Hawae</div>
            <div className="ilb-sub">
              Notre assistante clinique · Diagnostic · Bilan · Vigilance
            </div>
          </div>
          <span className="ilb-arrow">→</span>
        </button>
      )}
    </div>
  );
}
