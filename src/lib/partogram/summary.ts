import type { ClinicalAlert } from "./alerts";
import type { PartoCanvasEntry } from "./canvas-types";

export type PartoPatientMeta = {
  nom?: string;
  prenom?: string;
  age?: string;
  parite?: string;
  terme?: string;
  debut?: string;
  praticien?: string;
  dossier?: string;
};

export function buildClinicalSummary(
  patient: PartoPatientMeta,
  entries: PartoCanvasEntry[],
  info: { duree: string; phase: string },
  alerts: ClinicalAlert[],
): string {
  const name =
    [patient.prenom, patient.nom].filter(Boolean).join(" ") || "Patiente";
  let txt = "PARTOGRAMME OMS — RÉSUMÉ CLINIQUE\n";
  txt += "═".repeat(50) + "\n";
  txt += `Dossier : ${patient.dossier ?? "—"}\n`;
  txt += `Patiente : ${name} | Âge : ${patient.age || "—"} | Parité : P${patient.parite ?? "0"}\n`;
  txt += `Terme : ${patient.terme || "—"} | Début travail : ${
    patient.debut
      ? new Date(patient.debut).toLocaleString("fr-FR")
      : "—"
  }\n`;
  txt += `Praticien : ${patient.praticien || "—"}\n\n`;

  if (!entries.length) {
    txt += "Aucune observation enregistrée.\n";
  } else {
    txt += `DURÉE SURVEILLANCE : ${info.duree}\n`;
    txt += `PHASE ACTUELLE : ${info.phase}\n`;
    txt += `DERNIÈRE DILATATION : ${entries[entries.length - 1]!.dil ?? "—"} cm\n\n`;
    txt += "OBSERVATIONS :\n";
    entries.forEach((e) => {
      const t = new Date(e.time).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      txt += `  ${t} — Dil:${e.dil ?? "—"}cm Desc:${e.desc ?? "—"}/5 BCF:${e.bcf ?? "—"} CX:${e.cxNb ?? "—"}/10min LA:${e.la || "—"}`;
      txt += "\n";
    });
    if (alerts.some((a) => a.level !== "green")) {
      txt += "\nALERTES :\n";
      alerts.forEach((a) => {
        txt += "  • " + a.text + "\n";
      });
    }
  }
  txt +=
    "\n" +
    "─".repeat(50) +
    "\nGénéré par HawaeMD — " +
    new Date().toLocaleString("fr-FR") +
    "\n";
  return txt;
}
