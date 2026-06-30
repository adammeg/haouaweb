/**
 * Registre central des templates documents HawaeMD.
 */

import type { DocumentRenderContext, DocumentTemplate } from "@/types/documents";
import { CR_OP_TEMPLATES } from "@/data/documents/cr-op-templates";
import { EXTRA_CERTIFICAT_TEMPLATES } from "@/data/documents/certificat-extra";
import { ORDONNANCE_TEMPLATES } from "@/data/documents/ordonnance-templates";
import { LETTRE_TEMPLATES } from "@/data/documents/lettre-templates";
import { PMA_TEMPLATES } from "@/data/documents/pma-templates";
import {
  addDays,
  computeDpaFromDdr,
  formatDateFr,
  todayIso,
} from "@/lib/documents/smart-fields";
import {
  crTable,
  f,
  renderCert,
  wrapDocumentBody,
} from "@/data/documents/template-helpers";

const CERT_GROSSESSE: DocumentTemplate = {
  id: "cert_grossesse",
  category: "certificat",
  title: "Certificat de grossesse",
  icon: "🤰",
  orientation: "portrait",
  fields: [
    { id: "cert_date", label: "Date du certificat", type: "date" },
    { id: "gro_ddr", label: "DDR", type: "date" },
    { id: "gro_sa", label: "Terme (SA)", placeholder: "ex : 32+3" },
    { id: "gro_dpa", label: "DPA", type: "date" },
    { id: "cert_notes", label: "Notes", type: "textarea", full: true },
  ],
  render(ctx) {
    const dpa =
      ctx.fields.gro_dpa ||
      computeDpaFromDdr(ctx.fields.gro_ddr || ctx.patient.ddr);
    const body = `
<p><em>Je soussigné(e), <strong>${ctx.practitioner.displayName}</strong>, certifie avoir examiné ce jour <strong>${ctx.patient.fullName}</strong>${ctx.patient.ddn ? `, née le ${formatDateFr(ctx.patient.ddn)}` : ""}, et avoir constaté une grossesse évolutive de <strong>${f(ctx, "gro_sa", ctx.patient.terme)}</strong> semaines d'aménorrhée${dpa ? `, correspondant à une date probable d'accouchement le <strong>${formatDateFr(dpa)}</strong>` : ""}.</em></p>
<p>Ce certificat est établi à la demande de l'intéressée pour faire valoir ce que de droit.</p>
${ctx.fields.cert_notes ? `<p><em>${f(ctx, "cert_notes")}</em></p>` : ""}`;
    return renderCert(ctx, "CERTIFICAT DE GROSSESSE", body);
  },
};

const CERT_ACCOUCHEMENT: DocumentTemplate = {
  id: "cert_accouchement",
  category: "certificat",
  title: "Certificat d'accouchement",
  icon: "👶",
  orientation: "portrait",
  fields: [
    { id: "acc_date", label: "Date accouchement", type: "date" },
    { id: "acc_heure", label: "Heure", type: "time" },
    { id: "acc_sexe", label: "Sexe", type: "select", options: ["Masculin", "Féminin", "Indéterminé"] },
    { id: "acc_poids", label: "Poids (g)", type: "number" },
    { id: "acc_taille", label: "Taille (cm)", type: "number" },
    { id: "acc_vivant", label: "État", type: "select", options: ["Vivant", "Mort-né"] },
    { id: "acc_etat", label: "État de santé", type: "select", options: ["Normal", "Nécessite surveillance", "Réanimation"] },
    { id: "cert_notes", label: "Observations", type: "textarea", full: true },
  ],
  render(ctx) {
    const body = `
<p><em>Je certifie avoir assisté/pratiqué l'accouchement de <strong>${ctx.patient.fullName}</strong> le <strong>${formatDateFr(ctx.fields.acc_date)}</strong>${ctx.fields.acc_heure ? ` à ${f(ctx, "acc_heure")}` : ""}, d'un enfant <strong>${f(ctx, "acc_vivant", "vivant").toLowerCase()}</strong> de sexe <strong>${f(ctx, "acc_sexe")}</strong>, pesant <strong>${f(ctx, "acc_poids")} g</strong>${ctx.fields.acc_taille ? `, mesurant ${f(ctx, "acc_taille")} cm` : ""}, dont l'état de santé est <strong>${f(ctx, "acc_etat", "normal")}</strong>.</em></p>
${ctx.fields.cert_notes ? `<p><em>${f(ctx, "cert_notes")}</em></p>` : ""}`;
    return renderCert(ctx, "CERTIFICAT D'ACCOUCHEMENT", body);
  },
};

const CERT_REPOS: DocumentTemplate = {
  id: "cert_repos",
  category: "certificat",
  title: "Certificat de repos médical",
  icon: "🛏️",
  orientation: "portrait",
  fields: [
    { id: "repos_deb", label: "Du", type: "date" },
    { id: "repos_jours", label: "Durée (jours)", type: "number", placeholder: "7" },
    { id: "repos_fin", label: "Au (fin)", type: "date" },
    { id: "repos_sortie", label: "Sorties", type: "select", options: ["Sorties autorisées", "Sorties interdites", "Sorties sur avis médical"] },
    { id: "repos_motif", label: "Motif (confidentiel)", type: "text", placeholder: "motif médical" },
    { id: "cert_notes", label: "Recommandations", type: "textarea", full: true },
  ],
  render(ctx) {
    const deb = ctx.fields.repos_deb || todayIso();
    const jours = parseInt(ctx.fields.repos_jours || "0", 10);
    const fin = ctx.fields.repos_fin || (jours ? addDays(deb, jours) : "");
    const body = `
<p><em>Je certifie que l'état de santé de <strong>${ctx.patient.fullName}</strong> nécessite un repos médical de <strong>${jours || f(ctx, "repos_jours")} jour(s)</strong> à compter du <strong>${formatDateFr(deb)}</strong>${fin ? `, soit jusqu'au <strong>${formatDateFr(fin)}</strong>` : ""}.</em></p>
<p><strong>${f(ctx, "repos_sortie", "Sorties autorisées")}</strong></p>
${ctx.fields.repos_motif ? `<p>Motif médical : <em>${f(ctx, "repos_motif")}</em></p>` : "<p><em>Motif médical</em></p>"}
${ctx.fields.cert_notes ? `<p>${f(ctx, "cert_notes")}</p>` : ""}`;
    return renderCert(ctx, "CERTIFICAT DE REPOS MÉDICAL", body);
  },
};

const CERT_APTITUDE: DocumentTemplate = {
  id: "cert_aptitude",
  category: "certificat",
  title: "Certificat de bonne santé / aptitude",
  icon: "✅",
  orientation: "portrait",
  fields: [
    { id: "apt_finalite", label: "Finalité", type: "select", options: ["Exercice professionnel", "Activité sportive", "Mariage", "Permis de conduire", "Autre"] },
    { id: "apt_detail", label: "Précision", placeholder: "ex : sport en compétition" },
    { id: "cert_notes", label: "Observations", type: "textarea", full: true },
  ],
  render(ctx) {
    const fin = f(ctx, "apt_finalite", "ses activités");
    const body = `
<p><em>Je certifie avoir examiné ce jour <strong>${ctx.patient.fullName}</strong>${ctx.patient.ddn ? `, née le ${formatDateFr(ctx.patient.ddn)}` : ""}, dont l'état de santé m'apparaît compatible avec <strong>${fin}</strong>${ctx.fields.apt_detail ? ` (${f(ctx, "apt_detail")})` : ""}.</em></p>
<p>Aucune contre-indication médicale n'a été décelée à ce jour.</p>
${ctx.fields.cert_notes ? `<p><em>${f(ctx, "cert_notes")}</em></p>` : ""}`;
    return renderCert(ctx, "CERTIFICAT MÉDICAL D'APTITUDE", body);
  },
};

const CERT_ARRET_GROSSESSE: DocumentTemplate = {
  id: "cert_arret_grossesse",
  category: "certificat",
  title: "Arrêt de travail grossesse",
  icon: "📋",
  orientation: "portrait",
  fields: [
    { id: "gro_sa", label: "Terme (SA)", placeholder: "28" },
    { id: "arret_deb", label: "Du", type: "date" },
    { id: "arret_fin", label: "Au", type: "date" },
    { id: "arret_motif", label: "Motif", type: "select", options: [
      "Menace d'accouchement prématuré", "Hypertension gravidique", "Hyperémèse gravidique",
      "Placenta prævia", "Grossesse multiple", "Pathologie médicale intercurrente", "Prescription de confort obstétrical",
    ]},
    { id: "arret_detail", label: "Précision", type: "textarea", full: true },
  ],
  render(ctx) {
    const body = `
<p><em>Prescrit à <strong>${ctx.patient.fullName}</strong>, enceinte de <strong>${f(ctx, "gro_sa", ctx.patient.terme)} SA</strong>, un arrêt de travail du <strong>${formatDateFr(ctx.fields.arret_deb)}</strong> au <strong>${formatDateFr(ctx.fields.arret_fin)}</strong> en raison de :</em></p>
<p><strong>${f(ctx, "arret_motif")}</strong></p>
${ctx.fields.arret_detail ? `<p>${f(ctx, "arret_detail")}</p>` : ""}
<p style="font-size:10px;color:#6b7280;margin-top:16px">Note CNAM : arrêt de travail pour grossesse à risque — voir réglementation en vigueur.</p>`;
    return renderCert(ctx, "ARRÊT DE TRAVAIL — GROSSESSE", body);
  },
};

const CERT_POST_OP: DocumentTemplate = {
  id: "cert_post_op",
  category: "certificat",
  title: "Certificat post-opératoire",
  icon: "🏥",
  orientation: "portrait",
  fields: [
    { id: "op_date", label: "Date intervention", type: "date" },
    { id: "op_type", label: "Type intervention", placeholder: "Cœlioscopie gynécologique" },
    { id: "op_anesth", label: "Anesthésie", type: "select", options: ["AG", "Rachianesthésie", "APD", "Locale", "Sédation"] },
    { id: "op_suites", label: "Suites", type: "select", options: ["Simples", "Nécessitant surveillance"] },
    { id: "op_repos_sem", label: "Repos (semaines)", type: "number" },
    { id: "op_reprise", label: "Reprise activité", type: "date" },
  ],
  render(ctx) {
    const body = `
<p><em><strong>${ctx.patient.fullName}</strong> a subi une intervention chirurgicale le <strong>${formatDateFr(ctx.fields.op_date)}</strong> (<strong>${f(ctx, "op_type")}</strong>) sous <strong>${f(ctx, "op_anesth")}</strong>.</em></p>
<p>Les suites opératoires immédiates sont <strong>${f(ctx, "op_suites", "simples")}</strong>.</p>
${ctx.fields.op_repos_sem ? `<p>Un repos de <strong>${f(ctx, "op_repos_sem")} semaine(s)</strong> est recommandé.</p>` : ""}
${ctx.fields.op_reprise ? `<p>La reprise des activités professionnelles est envisageable le <strong>${formatDateFr(ctx.fields.op_reprise)}</strong>.</p>` : ""}`;
    return renderCert(ctx, "CERTIFICAT POST-OPÉRATOIRE", body);
  },
};

const LETTRE_REFERENCE: DocumentTemplate = {
  id: "lettre_reference",
  category: "lettre",
  title: "Lettre de référence / transfert",
  icon: "📨",
  orientation: "portrait",
  fields: [
    { id: "dest_nom", label: "Destinataire", placeholder: "Dr Prénom NOM" },
    { id: "dest_spec", label: "Spécialité", placeholder: "Cardiologue" },
    { id: "motif", label: "Motif de transfert", type: "textarea", full: true },
    { id: "clinique", label: "Résumé clinique", type: "textarea", full: true },
    { id: "urgence", label: "Urgence", type: "select", options: ["Routine", "Urgent", "Extrême urgence"] },
  ],
  render(ctx) {
    const body = `
<p>Cher(e) Confrère/Consœur,</p>
<p>Je vous adresse <strong>${ctx.patient.fullName}</strong>${ctx.patient.age ? `, ${ctx.patient.age}` : ""}${ctx.patient.parite ? `, ${ctx.patient.parite}` : ""}${ctx.patient.terme ? `, actuellement à ${ctx.patient.terme}` : ""}, pour <strong>${f(ctx, "motif")}</strong>.</p>
${ctx.fields.clinique ? `<p><strong>Éléments cliniques :</strong><br/>${f(ctx, "clinique").replace(/\n/g, "<br/>")}</p>` : ""}
<p><strong>Degré d'urgence :</strong> ${f(ctx, "urgence", "Routine")}</p>
<p>Je reste disponible pour tout complément d'information.</p>
<p>Confraternellement,</p>`;
    return wrapDocumentBody(ctx, "LETTRE DE RÉFÉRENCE", body, "portrait");
  },
};

const CR_AVB: DocumentTemplate = {
  id: "cr_avb",
  category: "cr_op",
  title: "Accouchement voie basse (AVB)",
  icon: "👶",
  orientation: "landscape",
  fields: [
    { id: "acc_date", label: "Date/heure accouchement", type: "date" },
    { id: "acc_heure", label: "Heure", type: "time" },
    { id: "terme", label: "Terme", placeholder: "39 SA + 2j" },
    { id: "parite", label: "Parité G/P", placeholder: "G2P1" },
    { id: "travail", label: "Mise en travail", type: "select", options: ["Spontané", "Déclenché"] },
    { id: "declenchement", label: "Méthode déclenchement", placeholder: "Ocytocine / Misoprostol" },
    { id: "duree_travail", label: "Durée travail (h)", placeholder: "8" },
    { id: "presentation", label: "Présentation", type: "select", options: ["Céphalique", "Siège", "Transverse"] },
    { id: "variete", label: "Variété", placeholder: "OIGA" },
    { id: "expulsion", label: "Mode expulsion", type: "select", options: ["Eutocique", "Ventouse", "Forceps"] },
    { id: "instrumental", label: "Détail instrumental", type: "textarea" },
    { id: "episiotomie", label: "Épisiotomie", type: "select", options: ["Non", "Médio-latérale droite", "Médio-latérale gauche"] },
    { id: "delivrance", label: "Délivrance", type: "select", options: ["Naturelle", "Dirigée", "Artificielle"] },
    { id: "hpp", label: "HPP", type: "select", options: ["Non", "Oui"] },
    { id: "hpp_traitement", label: "Traitement HPP", type: "textarea" },
    { id: "nn_sexe", label: "NN — Sexe", type: "select", options: ["F", "M"] },
    { id: "nn_poids", label: "Poids (g)", type: "number" },
    { id: "nn_apgar", label: "Apgar 1'/5'", placeholder: "9/10" },
    { id: "la", label: "Liquide amniotique", type: "select", options: ["Clair", "Méconial I", "Méconial II", "Méconial III", "Sanglant"] },
    { id: "anesthesie", label: "Anesthésie", type: "select", options: ["Sans", "APD", "Rachianesthésie", "AG"] },
    { id: "operateurs", label: "Opérateurs", type: "textarea", full: true },
    { id: "prescriptions", label: "Prescriptions post-partum", type: "textarea", full: true },
  ],
  render(ctx: DocumentRenderContext) {
    const sections: [string, string][] = [
      ["Date", `${formatDateFr(ctx.fields.acc_date)} ${f(ctx, "acc_heure", "")}`],
      ["Terme / Parité", `${f(ctx, "terme", ctx.patient.terme)} / ${f(ctx, "parite", ctx.patient.parite)}`],
      ["Travail", `${f(ctx, "travail")}${ctx.fields.declenchement ? ` — ${f(ctx, "declenchement")}` : ""} — Durée : ${f(ctx, "duree_travail")} h`],
      ["Présentation", `${f(ctx, "presentation")} — ${f(ctx, "variete")}`],
      ["Expulsion", `${f(ctx, "expulsion")}${ctx.fields.instrumental ? ` — ${f(ctx, "instrumental")}` : ""}`],
      ["Épisiotomie", f(ctx, "episiotomie", "Non")],
      ["Délivrance", f(ctx, "delivrance")],
      ["HPP", ctx.fields.hpp === "Oui" ? `Oui — ${f(ctx, "hpp_traitement")}` : "Non"],
      ["Nouveau-né", `${f(ctx, "nn_sexe")} — ${f(ctx, "nn_poids")} g — Apgar ${f(ctx, "nn_apgar")}`],
      ["LA", f(ctx, "la", "Clair")],
      ["Anesthésie", f(ctx, "anesthesie")],
      ["Opérateurs", f(ctx, "operateurs")],
    ];
    const body = `${crTable(sections)}
${ctx.fields.prescriptions ? `<p><strong>Prescriptions post-partum :</strong><br/>${f(ctx, "prescriptions").replace(/\n/g, "<br/>")}</p>` : ""}`;
    return wrapDocumentBody(ctx, "COMPTE RENDU — ACCOUCHEMENT PAR VOIE BASSE", body, "landscape");
  },
};

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  // Certificats
  CERT_GROSSESSE,
  CERT_ACCOUCHEMENT,
  CERT_REPOS,
  CERT_APTITUDE,
  CERT_ARRET_GROSSESSE,
  CERT_POST_OP,
  ...EXTRA_CERTIFICAT_TEMPLATES,
  // CR opératoires
  CR_AVB,
  ...CR_OP_TEMPLATES,
  // Ordonnances
  ...ORDONNANCE_TEMPLATES,
  // Lettres
  LETTRE_REFERENCE,
  ...LETTRE_TEMPLATES,
  // PMA
  ...PMA_TEMPLATES,
];

export function getDocumentTemplate(id: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find((t) => t.id === id);
}

export function templatesByCategory(
  cat: DocumentTemplate["category"],
): DocumentTemplate[] {
  return DOCUMENT_TEMPLATES.filter((t) => t.category === cat);
}
