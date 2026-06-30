"use client";

import type { PatientSnapshot } from "@/types/domain";
import { dossierDisplayName } from "@/lib/dossier/patient-meta";
import { patientAgeYears } from "@/lib/patient-utils";
import { PartogramPanel } from "@/components/partogram/partogram-panel";

/** Partogramme OMS intégré dans l'onglet Anamnèse obstétrique */
export function ObstPartogramPanel({ draft }: { draft: PatientSnapshot }) {
  const age = patientAgeYears(draft.ddn);
  return (
    <PartogramPanel
      embedded
      patientId={draft.id}
      initialName={dossierDisplayName(draft)}
      initialTerme={draft.o_terme ?? ""}
      initialAge={age != null ? String(age) : ""}
      initialParite={draft.o_par ?? "0"}
    />
  );
}
