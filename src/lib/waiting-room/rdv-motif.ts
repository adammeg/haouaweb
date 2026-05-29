import type { RdvType } from "@/stores/rdv-store";

const MOTIF_BY_TYPE: Record<RdvType, string> = {
  consultation: "Consultation",
  grossesse: "Suivi grossesse",
  echo: "Échographie",
  chirurgie: "Chirurgie",
  bilan: "Bilan",
  urgence: "Urgence",
};

export function motifFromRdvType(type: RdvType): string {
  return MOTIF_BY_TYPE[type] ?? "Consultation";
}
