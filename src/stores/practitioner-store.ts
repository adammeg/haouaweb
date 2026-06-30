import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createDoctorScopedStorage } from "@/lib/storage/doctor-scoped-storage";
import {
  DEFAULT_PRACTITIONER,
  type PractitionerProfile,
} from "@/types/practitioner";

type PractitionerState = {
  profile: PractitionerProfile;
  patchProfile: (p: Partial<PractitionerProfile>) => void;
  resetProfile: () => void;
};

export const usePractitionerStore = create<PractitionerState>()(
  persist(
    (set) => ({
      profile: { ...DEFAULT_PRACTITIONER },
      patchProfile: (p) =>
        set((s) => ({ profile: { ...s.profile, ...p } })),
      resetProfile: () => set({ profile: { ...DEFAULT_PRACTITIONER } }),
    }),
    {
      name: "hawae-practitioner-v1",
      storage: createJSONStorage(() => createDoctorScopedStorage()),
    },
  ),
);

/** Nom affiché du praticien pour les documents */
export function practitionerDisplayName(p: PractitionerProfile): string {
  const n = `${p.titre} ${p.prenom} ${p.nom}`.trim();
  return n === p.titre.trim() ? "Le praticien" : n;
}

/** Bloc entête pour templates (compatible v51 certGetDoctorInfo) */
export function practitionerHeaderInfo(p: PractitionerProfile) {
  const cabinet = [p.etablissement, p.service].filter(Boolean).join(" — ");
  return {
    displayName: practitionerDisplayName(p),
    titre: p.titre,
    nom: practitionerDisplayName(p),
    specialite: p.specialite || "Gynécologue-Obstétricien",
    cabinet: cabinet || p.adresse || "Cabinet médical",
    adresse: p.adresse,
    ville: p.ville || "…………",
    codePostal: p.codePostal,
    telephone: p.telephone,
    email: p.email,
    cnam: p.cnam,
    matriculeOrdre: p.matriculeOrdre,
    logoBase64: p.logoBase64 || undefined,
    signatureBase64: p.signatureBase64 || undefined,
    tamponTexte: p.tamponTexte,
  };
}
