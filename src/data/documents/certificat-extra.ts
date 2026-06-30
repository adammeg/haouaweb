import type { DocumentTemplate } from "@/types/documents";
import {
  checkboxFields,
  checkedList,
  f,
  formatDateFr,
  renderCert,
} from "./template-helpers";

export const CERT_DECES_FOETAL: DocumentTemplate = {
  id: "cert_deces_foetal",
  category: "certificat",
  title: "Certificat de décès fœtal",
  icon: "📄",
  orientation: "portrait",
  fields: [
    { id: "df_date", label: "Date constat", type: "date" },
    { id: "df_terme", label: "Terme (SA)", placeholder: "22" },
    { id: "df_poids", label: "Poids (g)", type: "number" },
    { id: "df_sexe", label: "Sexe", type: "select", options: ["Masculin", "Féminin", "Indéterminé"] },
    { id: "df_nature", label: "Nature", type: "select", options: ["Mort-né", "FCS > 20 SA", "MFIU", "MNN"] },
    { id: "df_cause", label: "Cause présumée", type: "textarea", full: true },
    { id: "cert_notes", label: "Observations", type: "textarea", full: true },
  ],
  render(ctx) {
    const body = `
<p><em>Je soussigné(e), <strong>${ctx.practitioner.displayName}</strong>, certifie le décès fœtal de l'enfant de <strong>${ctx.patient.fullName}</strong>, survenu le <strong>${formatDateFr(ctx.fields.df_date)}</strong>.</em></p>
<p>Terme : <strong>${f(ctx, "df_terme")} SA</strong> — Poids : <strong>${f(ctx, "df_poids")} g</strong> — Sexe : <strong>${f(ctx, "df_sexe")}</strong></p>
<p>Nature : <strong>${f(ctx, "df_nature")}</strong></p>
<p>Cause présumée : <em>${f(ctx, "df_cause")}</em></p>
${ctx.fields.cert_notes ? `<p>${f(ctx, "cert_notes")}</p>` : ""}
<p style="font-size:10px;color:#6b7280;margin-top:16px">Document établi conformément à la réglementation tunisienne en vigueur (déclaration légale).</p>`;
    return renderCert(ctx, "CERTIFICAT DE DÉCÈS FŒTAL", body);
  },
};

export const CERT_SUIVI_PMA: DocumentTemplate = {
  id: "cert_suivi_pma",
  category: "certificat",
  title: "Certificat de suivi PMA",
  icon: "🧬",
  orientation: "portrait",
  fields: [
    { id: "pma_type_inf", label: "Infertilité", type: "select", options: ["Primaire", "Secondaire"] },
    { id: "pma_depuis", label: "Suivi depuis", type: "date" },
    { id: "pma_protocole", label: "Protocole", type: "select", options: ["FIV", "ICSI", "IAC", "IAD", "Congélation embryonnaire"] },
    { id: "pma_statut", label: "Statut", type: "select", options: ["En cours", "Réalisé"] },
    { id: "pma_date_acte", label: "Date acte", type: "date" },
    { id: "pma_dest", label: "Établi pour", type: "select", options: ["CNAM", "Assurance", "Employeur", "Usage personnel"] },
    { id: "cert_notes", label: "Précisions", type: "textarea", full: true },
  ],
  render(ctx) {
    const body = `
<p><em><strong>${ctx.patient.fullName}</strong> est actuellement suivie dans notre unité de PMA pour une infertilité <strong>${f(ctx, "pma_type_inf", "—").toLowerCase()}</strong> depuis le <strong>${formatDateFr(ctx.fields.pma_depuis)}</strong>.</em></p>
<p>Un protocole de <strong>${f(ctx, "pma_protocole")}</strong> est <strong>${f(ctx, "pma_statut", "en cours").toLowerCase()}</strong>${ctx.fields.pma_date_acte ? ` (date : ${formatDateFr(ctx.fields.pma_date_acte)})` : ""}.</p>
<p>Ce certificat est établi pour : <strong>${f(ctx, "pma_dest")}</strong>.</p>
${ctx.fields.cert_notes ? `<p><em>${f(ctx, "cert_notes")}</em></p>` : ""}`;
    return renderCert(ctx, "CERTIFICAT DE SUIVI PMA", body);
  },
};

const CNAM_RISQUES = [
  { id: "cnam_risque_hta", label: "Hypertension gravidique" },
  { id: "cnam_risque_diab", label: "Diabète gestationnel" },
  { id: "cnam_risque_map", label: "Menace d'accouchement prématuré" },
  { id: "cnam_risque_placenta", label: "Placenta prævia" },
  { id: "cnam_risque_gem", label: "Grossesse multiple" },
];

export const CERT_DECLARATION_CNAM: DocumentTemplate = {
  id: "cert_declaration_cnam",
  category: "certificat",
  title: "Déclaration de grossesse (CNAM)",
  icon: "🏛️",
  orientation: "portrait",
  fields: [
    { id: "cnam_affilie", label: "N° affilié CNAM", placeholder: "—" },
    { id: "gro_sa", label: "Terme (SA)", placeholder: "12" },
    { id: "gro_dpa", label: "Terme prévisionnel (DPA)", type: "date" },
    { id: "cnam_foetus", label: "Nombre de fœtus", type: "select", options: ["1", "2", "3+"] },
    { id: "cnam_risque", label: "Grossesse à risque", type: "select", options: ["Non", "Oui"] },
  ...checkboxFields("Risques (si oui)", CNAM_RISQUES),
    { id: "cnam_risque_autre", label: "Autre risque", type: "text" },
    { id: "cert_notes", label: "Observations", type: "textarea", full: true },
  ],
  render(ctx) {
    const risques =
      ctx.fields.cnam_risque === "Oui"
        ? checkedList(ctx, CNAM_RISQUES) +
          (ctx.fields.cnam_risque_autre ? ` — ${f(ctx, "cnam_risque_autre")}` : "")
        : "Non";
    const body = `
<p><strong>DÉCLARATION DE GROSSESSE — CNAM TUNISIE</strong></p>
<p>Patiente : <strong>${ctx.patient.fullName}</strong>${ctx.patient.ddn ? `, née le ${formatDateFr(ctx.patient.ddn)}` : ""}</p>
<p>N° affilié CNAM : <strong>${f(ctx, "cnam_affilie", ctx.patient.cnam)}</strong></p>
<p>Déclaration à partir du 3<sup>e</sup> mois — Terme : <strong>${f(ctx, "gro_sa", ctx.patient.terme)} SA</strong></p>
<p>Date probable d'accouchement : <strong>${formatDateFr(ctx.fields.gro_dpa || ctx.patient.dpa)}</strong></p>
<p>Nombre de fœtus : <strong>${f(ctx, "cnam_foetus", "1")}</strong></p>
<p>Grossesse à risque : <strong>${risques}</strong></p>
${ctx.fields.cert_notes ? `<p>${f(ctx, "cert_notes")}</p>` : ""}
<p style="margin-top:24px">Praticien déclarant : <strong>${ctx.practitioner.displayName}</strong></p>`;
    return renderCert(ctx, "DÉCLARATION DE GROSSESSE", body);
  },
};

export const EXTRA_CERTIFICAT_TEMPLATES = [
  CERT_DECES_FOETAL,
  CERT_SUIVI_PMA,
  CERT_DECLARATION_CNAM,
];
