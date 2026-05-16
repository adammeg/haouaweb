import type { PatientSnapshot } from "@/types/domain";
import { getPatientDisplayName } from "@/lib/patient-utils";
import {
  appendPdfSection,
  createHiddenPrintRoot,
  exportElementToPdf,
} from "@/lib/pdf/html2pdf-export";

const ROOT_ID = "hawae-dossier-pdf-root";

export async function generateDossierCompletPdf(
  draft: PatientSnapshot,
): Promise<void> {
  const root = createHiddenPrintRoot(ROOT_ID);
  const name = getPatientDisplayName(draft);

  const header = document.createElement("header");
  header.style.cssText =
    "padding:20px 24px;background:#0a5c5c;color:#fff;font-family:Arial,sans-serif";
  const h1 = document.createElement("h1");
  h1.textContent = "Dossier médical complet";
  h1.style.cssText = "margin:0;font-size:18px";
  const sub = document.createElement("p");
  sub.textContent = name + " · " + (draft.specialite || "spécialité ND");
  sub.style.cssText = "margin:6px 0 0;font-size:12px;opacity:.85";
  header.appendChild(h1);
  header.appendChild(sub);
  root.appendChild(header);

  const body = document.createElement("div");
  body.style.cssText = "padding:20px 24px";
  root.appendChild(body);

  appendPdfSection(body, "Identité", [
    { label: "Nom", value: [draft.nom, draft.prenom].filter(Boolean).join(" ") },
    { label: "DDN", value: draft.ddn ?? "" },
    { label: "Téléphone", value: draft.tel ?? "" },
    { label: "Motif", value: draft.motif ?? "" },
  ]);

  if (draft.specialite === "obst") {
    appendPdfSection(body, "Grossesse", [
      { label: "DDR", value: draft.o_ddr ?? "" },
      { label: "Terme", value: draft.o_terme ?? "" },
      { label: "DPA", value: draft.o_dpa ?? "" },
      { label: "TA", value: draft.o_ta ?? "" },
      { label: "Poids", value: draft.o_poids ?? "" },
    ]);
    appendPdfSection(body, "Écho T2", [
      { label: "Date", value: draft.t2_date ?? "" },
      { label: "AG", value: draft.t2_ag ?? "" },
      { label: "BIP / PC / CA / LF", value: [draft.t2_bip, draft.t2_pc, draft.t2_ca, draft.t2_lf].join(" / ") },
      { label: "PFE", value: draft.t2_pfe ?? "" },
      { label: "Notes T2", value: draft.t2_notes ?? "" },
    ]);
  }

  if (draft.specialite === "gyn") {
    appendPdfSection(body, "Gynécologie", [
      { label: "Cycles", value: draft.g_cycle ?? "" },
      { label: "Régularité", value: draft.g_reg ?? "" },
      { label: "ATCD", value: draft.g_patho ?? "" },
    ]);
  }

  if (draft.specialite === "inf") {
    appendPdfSection(body, "PMA / Infertilité", [
      { label: "AMH", value: draft.i_amh_ngml ?? draft.bio_amh ?? "" },
      { label: "Tentatives FIV", value: draft.i_tentatives_fiv ?? "" },
      { label: "Cause", value: draft.i_cause_inf ?? "" },
    ]);
  }

  appendPdfSection(body, "Biologie", [
    { label: "Hb", value: draft.bio_hb ?? "" },
    { label: "AMH", value: draft.bio_amh ?? "" },
    { label: "CA-125", value: draft.bio_ca125 ?? "" },
    { label: "Glycémie", value: draft.bio_gly ?? "" },
  ]);

  if (draft.ec_conclusion) {
    appendPdfSection(body, "Examen & conclusion", [
      { label: "Conclusion", value: draft.ec_conclusion },
    ]);
  }

  const footer = document.createElement("footer");
  footer.style.cssText = "padding:12px 24px;font-size:9px;color:#6b7280";
  footer.textContent =
    "HawaeMD — export " + new Date().toLocaleString("fr-FR");
  root.appendChild(footer);

  await exportElementToPdf(root, {
    filename: "dossier-" + (name.replace(/[^\w\s-]/g, "").trim() || "patiente") + ".pdf",
  });
  root.remove();
}
