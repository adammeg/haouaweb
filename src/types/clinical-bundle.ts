import type { Rdv } from "@/stores/rdv-store";
import type {
  Rappel,
  RappelContact,
} from "@/stores/rappels-store";
import type { ModulesWorkspace } from "@/types/modules";

/** Données hors-dossier synchronisées par médecin (modules, agenda, rappels). */
export type DoctorClinicalBundle = {
  modulesByUser: Record<string, ModulesWorkspace>;
  agenda: {
    rdvList: Rdv[];
    weekOffset: number;
  };
  rappels: {
    list: Rappel[];
    contacts: RappelContact[];
    readNotifs: string[];
  };
};

export const EMPTY_CLINICAL_BUNDLE: DoctorClinicalBundle = {
  modulesByUser: {},
  agenda: { rdvList: [], weekOffset: 0 },
  rappels: { list: [], contacts: [], readNotifs: [] },
};
