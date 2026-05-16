"use client";

import type { PatientSnapshot, Specialty } from "@/types/domain";
import {
  Field,
  SelectInput,
  TextInput,
  type FieldPatch,
} from "@/components/dossier/form-primitives";
import { ETHNIE_OPTIONS, calcImc } from "@/lib/dossier/anamnese-config";
import { AnaCard, SpecChooser, useAnaPatch } from "@/components/dossier/anamnese-shared";
import { GynAnamnese } from "@/components/dossier/anamnese-gyn";
import { ObstAnamnese } from "@/components/dossier/anamnese-obst";
import { InfAnamnese } from "@/components/dossier/anamnese-inf";
import type { DossierTabId } from "@/components/dossier/dossier-form-view";

export function AnamneseTab({
  draft,
  onField,
  onNavigateTab,
}: {
  draft: PatientSnapshot;
  onField: (p: FieldPatch) => void;
  onNavigateTab?: (tab: DossierTabId) => void;
}) {
  const spec = (draft.specialite as Specialty) || "gyn";
  const patch = useAnaPatch(onField);

  const syncAnthro = (poids: string, taille: string) => {
    const imc = calcImc(poids, taille);
    onField({
      ec_poids: poids,
      ec_taille: taille,
      ...(imc ? { imc } : {}),
    });
  };

  return (
    <div className="anamnese-tab space-y-0">
      <AnaCard title="🪪 Identité de la patiente" ar="هوية المريضة">
        <div className="dossier-form-grid triple">
          <Field label="Nom *">
            <TextInput value={draft.nom} placeholder="Ben Ali" onChange={(v) => patch("nom", v)} />
          </Field>
          <Field label="Prénom *">
            <TextInput value={draft.prenom} placeholder="Fatma" onChange={(v) => patch("prenom", v)} />
          </Field>
          <Field label="Date de naissance">
            <TextInput type="date" value={draft.ddn} onChange={(v) => patch("ddn", v)} />
          </Field>
          <Field label="Téléphone">
            <TextInput value={draft.tel} placeholder="+216 …" onChange={(v) => patch("tel", v)} />
          </Field>
          <Field label="Profession">
            <TextInput value={draft.profession} onChange={(v) => patch("profession", v)} />
          </Field>
          <Field label="CIN">
            <TextInput value={draft.cin} onChange={(v) => patch("cin", v)} />
          </Field>
          <Field label="Poids (kg)">
            <TextInput
              type="number"
              value={draft.ec_poids}
              placeholder="65"
              onChange={(v) => syncAnthro(v, draft.ec_taille ?? "")}
            />
          </Field>
          <Field label="Taille (cm)">
            <TextInput
              type="number"
              value={draft.ec_taille}
              placeholder="163"
              onChange={(v) => syncAnthro(draft.ec_poids ?? "", v)}
            />
          </Field>
          <Field label="Ethnie">
            <SelectInput
              value={draft.ethnie}
              onChange={(v) => patch("ethnie", v)}
              options={ETHNIE_OPTIONS}
            />
          </Field>
        </div>
      </AnaCard>

      <AnaCard title="🏥 Contexte clinique" ar="التخصص الطبي">
        <p className="ana-intro">
          Sélectionnez le type de consultation pour afficher l&apos;anamnèse adaptée :
        </p>
        <SpecChooser
          spec={spec}
          onSelect={(s) => onField({ specialite: s })}
        />
      </AnaCard>

      {spec === "gyn" && <GynAnamnese draft={draft} onField={onField} />}
      {spec === "obst" && (
        <ObstAnamnese
          draft={draft}
          onField={onField}
          onGoT2={() => onNavigateTab?.("t2")}
        />
      )}
      {spec === "inf" && <InfAnamnese draft={draft} onField={onField} />}

      {spec && (
        <button
          type="button"
          className="ia-launch-btn"
          onClick={() => onNavigateTab?.("hawae")}
        >
          <span className="ilb-icon">🤖</span>
          <div className="ilb-body">
            <div className="ilb-title">Lancer l&apos;analyse IA</div>
            <div className="ilb-sub">
              Diagnostic différentiel · Bilan recommandé · Points de vigilance
            </div>
          </div>
          <span className="ilb-arrow">→</span>
        </button>
      )}
    </div>
  );
}
