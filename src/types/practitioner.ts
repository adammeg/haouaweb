/** Profil praticien — entête persistante pour tous les documents */

export type PractitionerTitle = "Dr" | "Pr" | "Médecin Spécialiste";

export type PractitionerProfile = {
  prenom: string;
  nom: string;
  titre: PractitionerTitle;
  specialite: string;
  matriculeOrdre: string;
  etablissement: string;
  service: string;
  adresse: string;
  ville: string;
  codePostal: string;
  telephone: string;
  email: string;
  cnam: string;
  logoBase64: string;
  signatureBase64: string;
  tamponTexte: string;
};

export const DEFAULT_PRACTITIONER: PractitionerProfile = {
  prenom: "",
  nom: "",
  titre: "Dr",
  specialite: "Gynécologue-Obstétricien",
  matriculeOrdre: "",
  etablissement: "",
  service: "",
  adresse: "",
  ville: "",
  codePostal: "",
  telephone: "",
  email: "",
  cnam: "",
  logoBase64: "",
  signatureBase64: "",
  tamponTexte: "",
};
