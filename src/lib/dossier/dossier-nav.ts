import type { ConsultationEntry, PatientSnapshot } from "@/types/domain";

export type DossierTabId =
  | "anamnese"
  | "examen"
  | "bilans"
  | "pma"
  | "scores"
  | "hawae"
  | "checklist"
  | "historique"
  | "docs"
  | "certificat"
  | "protocoles"
  | "rappels"
  | "partogramme";

type DossierTab = { id: DossierTabId; label: string };
export type DossierStage = { id: string; label: string; tabs: DossierTab[] };

/** Les sections du dossier, regroupées selon le déroulé d'une consultation. */
export function dossierStages(specialite: string | undefined): DossierStage[] {
  const decision: DossierTab[] = [
    { id: "scores", label: "Scores" },
    { id: "hawae", label: "Hawae" },
    { id: "protocoles", label: "Protocoles" },
    { id: "partogramme", label: "Partogramme" },
  ];
  // L'onglet PMA n'est utilisable que pour un dossier d'infertilité.
  if (specialite === "inf") decision.unshift({ id: "pma", label: "PMA / FIV" });
  return [
    {
      id: "consultation",
      label: "Consultation",
      tabs: [
        { id: "anamnese", label: "Anamnèse" },
        { id: "examen", label: "Examen clinique" },
        { id: "bilans", label: "Examens et bilans" },
        { id: "checklist", label: "Checklist" },
      ],
    },
    { id: "decision", label: "Décision", tabs: decision },
    {
      id: "documents",
      label: "Documents",
      tabs: [
        { id: "docs", label: "Documents" },
        { id: "certificat", label: "Certificat" },
      ],
    },
    {
      id: "suivi",
      label: "Suivi",
      tabs: [
        { id: "historique", label: "Historique" },
        { id: "rappels", label: "Rappels" },
      ],
    },
  ];
}

/**
 * Allergies à afficher en permanence. Les dossiers antérieurs ont pu perdre ce champ à une nouvelle
 * consultation : la dernière valeur archivée est alors affichée avec sa date, sans être réécrite.
 */
export function knownAllergies(
  draft: PatientSnapshot,
  history: ConsultationEntry[],
): { text: string; from: string | null } | null {
  const current = draft.allergies?.trim();
  if (current) return { text: current, from: null };
  const past = [...history]
    .sort((a, b) => b.date.localeCompare(a.date))
    .find((c) => c.data?.allergies?.trim());
  return past ? { text: past.data.allergies!.trim(), from: past.date } : null;
}
