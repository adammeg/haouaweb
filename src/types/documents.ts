/** Types du module documents HawaeMD */

export type DocumentCategory =
  | "cr_op"
  | "ordonnance"
  | "certificat"
  | "lettre"
  | "pma";

export type DocFieldType =
  | "text"
  | "number"
  | "date"
  | "time"
  | "textarea"
  | "select"
  | "checkbox";

export type DocFieldDef = {
  id: string;
  label: string;
  type?: DocFieldType;
  options?: string[];
  placeholder?: string;
  full?: boolean;
  section?: string;
};

export type DocumentRenderContext = {
  fields: Record<string, string>;
  docNumber: string;
  practitioner: {
    displayName: string;
    titre: string;
    specialite: string;
    etablissement: string;
    adresse: string;
    ville: string;
    codePostal: string;
    telephone: string;
    email: string;
    cnam: string;
    matriculeOrdre: string;
    logoBase64?: string;
    signatureBase64?: string;
    tamponTexte?: string;
  };
  patient: {
    nom: string;
    prenom: string;
    fullName: string;
    ddn: string;
    age: string;
    dossierId: string;
    cnam: string;
    adresse: string;
    parite: string;
    terme: string;
    ddr: string;
    dpa: string;
  };
};

export type DocumentTemplate = {
  id: string;
  category: DocumentCategory;
  title: string;
  icon: string;
  orientation: "portrait" | "landscape";
  fields: DocFieldDef[];
  render: (ctx: DocumentRenderContext) => string;
};

export type GeneratedDocument = {
  id: string;
  docNumber: string;
  templateId: string;
  category: DocumentCategory;
  title: string;
  patientId?: string;
  patientName: string;
  fields: Record<string, string>;
  renderedHtml: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentFavorite = {
  id: string;
  templateId: string;
  name: string;
  fields: Record<string, string>;
  createdAt: string;
};
