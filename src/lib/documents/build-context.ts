/**
 * Construit le contexte de rendu document depuis dossier + praticien.
 */

import type { PatientSnapshot } from "@/types/domain";
import type { DocumentRenderContext } from "@/types/documents";
import { dossierDisplayName } from "@/lib/dossier/patient-meta";
import { patientAgeYears } from "@/lib/patient-utils";
import { practitionerHeaderInfo } from "@/stores/practitioner-store";
import type { PractitionerProfile } from "@/types/practitioner";
import {
  computeDpaFromDdr,
  formatGaFromDdr,
  genDossierNumber,
} from "@/lib/documents/smart-fields";

export function buildPatientDocContext(
  draft?: PatientSnapshot | null,
): DocumentRenderContext["patient"] {
  if (!draft) {
    return {
      nom: "",
      prenom: "",
      fullName: "",
      ddn: "",
      age: "",
      dossierId: "",
      cnam: "",
      adresse: "",
      parite: "",
      terme: "",
      ddr: "",
      dpa: "",
    };
  }
  const age = patientAgeYears(draft.ddn);
  const ddr = draft.g_ddr || draft.o_ddr || "";
  const spec = draft.specialite === "obst" ? "obs" : "gyn";
  return {
    nom: draft.nom ?? "",
    prenom: draft.prenom ?? "",
    fullName: dossierDisplayName(draft),
    ddn: draft.ddn ?? "",
    age: age != null ? `${age} ans` : "",
    dossierId: genDossierNumber(spec as "gyn" | "obs"),
    cnam: draft.cin ?? "",
    adresse: [draft.profession, draft.tel].filter(Boolean).join(" · "),
    parite: `G${draft.o_gest ?? draft.g_gest ?? "0"}P${draft.o_par ?? draft.g_par ?? "0"}`,
    terme: draft.o_terme ?? formatGaFromDdr(ddr) ?? "",
    ddr,
    dpa: draft.o_dpa ?? computeDpaFromDdr(ddr),
  };
}

export function buildDocumentContext(
  fields: Record<string, string>,
  docNumber: string,
  practitioner: PractitionerProfile,
  draft?: PatientSnapshot | null,
): DocumentRenderContext {
  const dr = practitionerHeaderInfo(practitioner);
  return {
    fields,
    docNumber,
    practitioner: {
      displayName: dr.displayName,
      titre: dr.titre,
      specialite: dr.specialite,
      etablissement: dr.cabinet,
      adresse: dr.adresse,
      ville: dr.ville,
      codePostal: dr.codePostal,
      telephone: dr.telephone,
      email: dr.email,
      cnam: dr.cnam,
      matriculeOrdre: dr.matriculeOrdre,
      logoBase64: dr.logoBase64,
      signatureBase64: dr.signatureBase64,
      tamponTexte: dr.tamponTexte,
    },
    patient: buildPatientDocContext(draft),
  };
}

/** Pré-remplit les champs template depuis le dossier */
export function defaultFieldsForTemplate(
  templateId: string,
  draft?: PatientSnapshot | null,
): Record<string, string> {
  const p = buildPatientDocContext(draft);
  const base: Record<string, string> = {
    cert_date: new Date().toISOString().slice(0, 10),
    repos_deb: new Date().toISOString().slice(0, 10),
    arret_deb: new Date().toISOString().slice(0, 10),
    gro_ddr: p.ddr,
    gro_dpa: p.dpa,
    gro_sa: p.terme.replace(/\s*SA.*/, "").trim(),
    parite: p.parite,
    terme: p.terme,
    cons_date: new Date().toISOString().slice(0, 10),
    pma_j0: new Date().toISOString().slice(0, 10),
  };
  if (templateId === "cr_avb" || templateId === "cr_avb_siege") {
    base.terme = p.terme;
    base.parite = p.parite;
  }
  return base;
}
