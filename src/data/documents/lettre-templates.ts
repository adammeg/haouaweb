import type { DocumentTemplate } from "@/types/documents";
import { f, formatDateFr, wrapDocumentBody } from "./template-helpers";

export const LETTRE_SORTIE: DocumentTemplate = {
  id: "lettre_sortie",
  category: "lettre",
  title: "Lettre de sortie d'hospitalisation",
  icon: "🏥",
  orientation: "portrait",
  fields: [
    { id: "sortie_motif", label: "Motif d'hospitalisation", type: "textarea", full: true },
    { id: "sortie_atcd", label: "Antécédents", type: "textarea", full: true },
    { id: "sortie_bilan", label: "Bilan réalisé", type: "textarea", full: true },
    { id: "sortie_traitement", label: "Traitement instauré", type: "textarea", full: true },
    { id: "sortie_evolution", label: "Évolution", type: "textarea", full: true },
    { id: "sortie_conclusion", label: "Conclusion + CAT", type: "textarea", full: true },
    { id: "sortie_sortie", label: "Traitement de sortie", type: "textarea", full: true },
    { id: "sortie_rdv", label: "RDV de suivi", type: "text" },
  ],
  render(ctx) {
    const body = `
<p><strong>Motif d'hospitalisation :</strong><br/>${f(ctx, "sortie_motif").replace(/\n/g, "<br/>")}</p>
<p><strong>Antécédents :</strong><br/>${f(ctx, "sortie_atcd", "—").replace(/\n/g, "<br/>")}</p>
<p><strong>Bilan :</strong><br/>${f(ctx, "sortie_bilan", "—").replace(/\n/g, "<br/>")}</p>
<p><strong>Traitement instauré :</strong><br/>${f(ctx, "sortie_traitement", "—").replace(/\n/g, "<br/>")}</p>
<p><strong>Évolution :</strong><br/>${f(ctx, "sortie_evolution", "—").replace(/\n/g, "<br/>")}</p>
<p><strong>Conclusion :</strong><br/>${f(ctx, "sortie_conclusion", "—").replace(/\n/g, "<br/>")}</p>
<p><strong>Traitement de sortie :</strong><br/>${f(ctx, "sortie_sortie", "—").replace(/\n/g, "<br/>")}</p>
${ctx.fields.sortie_rdv ? `<p><strong>RDV :</strong> ${f(ctx, "sortie_rdv")}</p>` : ""}`;
    return wrapDocumentBody(ctx, "LETTRE DE SORTIE", body, "portrait");
  },
};

export const LETTRE_AVIS: DocumentTemplate = {
  id: "lettre_avis",
  category: "lettre",
  title: "Demande d'avis spécialisé",
  icon: "🩺",
  orientation: "portrait",
  fields: [
    { id: "dest_nom", label: "Destinataire", placeholder: "Dr Prénom NOM" },
    { id: "dest_spec", label: "Spécialité", placeholder: "Cardiologue" },
    { id: "avis_motif", label: "Motif clinique", type: "textarea", full: true },
    { id: "avis_question", label: "Question posée", type: "textarea", full: true },
    { id: "avis_bilan", label: "Examens récents", type: "textarea", full: true },
  ],
  render(ctx) {
    const body = `
<p>Cher(e) Confrère/Consœur${ctx.fields.dest_nom ? `, <strong>${f(ctx, "dest_nom")}</strong>` : ""}${ctx.fields.dest_spec ? ` (${f(ctx, "dest_spec")})` : ""},</p>
<p>Je vous prie de bien vouloir donner votre avis concernant <strong>${ctx.patient.fullName}</strong>${ctx.patient.age ? `, ${ctx.patient.age}` : ""}.</p>
<p><strong>Motif :</strong><br/>${f(ctx, "avis_motif").replace(/\n/g, "<br/>")}</p>
${ctx.fields.avis_bilan ? `<p><strong>Examens :</strong><br/>${f(ctx, "avis_bilan").replace(/\n/g, "<br/>")}</p>` : ""}
<p><strong>Question :</strong><br/><em>${f(ctx, "avis_question")}</em></p>
<p>Je vous remercie par avance.</p>
<p>Confraternellement,</p>`;
    return wrapDocumentBody(ctx, "DEMANDE D'AVIS SPÉCIALISÉ", body, "portrait");
  },
};

export const LETTRE_CR_CONSULTATION: DocumentTemplate = {
  id: "lettre_cr_consultation",
  category: "lettre",
  title: "Compte rendu de consultation",
  icon: "📋",
  orientation: "portrait",
  fields: [
    { id: "cons_date", label: "Date consultation", type: "date" },
    { id: "cons_motif", label: "Motif", type: "textarea", full: true },
    { id: "cons_anamnese", label: "Anamnèse", type: "textarea", full: true },
    { id: "cons_examen", label: "Examen clinique", type: "textarea", full: true },
    { id: "cons_examens", label: "Examens complémentaires", type: "textarea", full: true },
    { id: "cons_diag", label: "Diagnostic / Impression", type: "textarea", full: true },
    { id: "cons_plan", label: "Plan de prise en charge", type: "textarea", full: true },
    { id: "cons_info", label: "Informations patiente", type: "textarea", full: true },
    { id: "cons_rdv", label: "Prochain RDV", type: "text" },
  ],
  render(ctx) {
    const body = `
<p>Consultation du <strong>${formatDateFr(ctx.fields.cons_date)}</strong> — <strong>${ctx.patient.fullName}</strong></p>
<p><strong>Motif :</strong> ${f(ctx, "cons_motif")}</p>
<p><strong>Anamnèse :</strong><br/>${f(ctx, "cons_anamnese", "—").replace(/\n/g, "<br/>")}</p>
<p><strong>Examen clinique :</strong><br/>${f(ctx, "cons_examen", "—").replace(/\n/g, "<br/>")}</p>
${ctx.fields.cons_examens ? `<p><strong>Examens :</strong><br/>${f(ctx, "cons_examens").replace(/\n/g, "<br/>")}</p>` : ""}
<p><strong>Impression :</strong> ${f(ctx, "cons_diag")}</p>
<p><strong>Plan :</strong><br/>${f(ctx, "cons_plan", "—").replace(/\n/g, "<br/>")}</p>
${ctx.fields.cons_info ? `<p><strong>Informations données :</strong> ${f(ctx, "cons_info")}</p>` : ""}
${ctx.fields.cons_rdv ? `<p><strong>Prochain RDV :</strong> ${f(ctx, "cons_rdv")}</p>` : ""}`;
    return wrapDocumentBody(ctx, "COMPTE RENDU DE CONSULTATION", body, "portrait");
  },
};

export const LETTRE_TEMPLATES = [
  LETTRE_SORTIE,
  LETTRE_AVIS,
  LETTRE_CR_CONSULTATION,
];
