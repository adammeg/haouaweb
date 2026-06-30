import type { DocumentTemplate } from "@/types/documents";
import { f, formatDateFr, wrapDocumentBody } from "./template-helpers";

export const PMA_CONSENTEMENT: DocumentTemplate = {
  id: "pma_consentement",
  category: "pma",
  title: "Consentement FIV / ICSI",
  icon: "📝",
  orientation: "portrait",
  fields: [
    { id: "cons_technique", label: "Technique", type: "select", options: ["FIV", "ICSI", "IAC", "IAD", "TEC"] },
    { id: "cons_risques", label: "Risques expliqués", type: "textarea", full: true, placeholder: "OHSS, grossesse multiple, FCS, échec…" },
    { id: "cons_alternatives", label: "Alternatives", type: "textarea", full: true },
    { id: "cons_embryons", label: "Devenir embryons congelés", type: "textarea", full: true },
    { id: "cons_date", label: "Date", type: "date" },
    { id: "cons_temoin", label: "Témoin", placeholder: "Nom prénom" },
  ],
  render(ctx) {
    const body = `
<p>Le couple <strong>${ctx.patient.fullName}</strong> et son conjoint a reçu une information complète sur la technique de <strong>${f(ctx, "cons_technique")}</strong>.</p>
<p><strong>Risques expliqués :</strong><br/>${f(ctx, "cons_risques").replace(/\n/g, "<br/>")}</p>
<p><strong>Alternatives thérapeutiques :</strong><br/>${f(ctx, "cons_alternatives", "—").replace(/\n/g, "<br/>")}</p>
<p><strong>Devenir des embryons congelés :</strong><br/>${f(ctx, "cons_embryons", "—").replace(/\n/g, "<br/>")}</p>
<p>Le couple dispose d'un délai de réflexion et peut révoquer son consentement par écrit à tout moment.</p>
<p style="margin-top:32px">Fait le <strong>${formatDateFr(ctx.fields.cons_date)}</strong></p>
<div style="display:flex;justify-content:space-between;margin-top:40px;font-size:11px">
  <div>Signature couple<br/><br/>________________</div>
  <div>Témoin : ${f(ctx, "cons_temoin", "—")}<br/><br/>________________</div>
  <div>Médecin<br/><br/>________________</div>
</div>`;
    return wrapDocumentBody(ctx, "CONSENTEMENT ÉCLAIRÉ PMA", body, "portrait");
  },
};

export const PMA_PONCTION: DocumentTemplate = {
  id: "pma_ponction",
  category: "pma",
  title: "Fiche de ponction ovocytaire",
  icon: "💉",
  orientation: "landscape",
  fields: [
    { id: "ponc_date", label: "Date/heure", type: "date" },
    { id: "ponc_heure", label: "Heure", type: "time" },
    { id: "ponc_proto", label: "Protocole stimulation", type: "text" },
    { id: "ponc_follicules", label: "Follicules à J trigger", type: "number" },
    { id: "ponc_ovocytes", label: "Ovocytes recueillis", type: "number" },
    { id: "ponc_maturite", label: "Maturité", placeholder: "MII / MI / GV" },
    { id: "ponc_liquide", label: "Qualité liquide folliculaire", type: "select", options: ["Normale", "Hémorragique", "Purulent"] },
    { id: "ponc_complications", label: "Complications", type: "textarea" },
    { id: "ponc_anesth", label: "Anesthésie", type: "select", options: ["Locale", "Sédation", "AG"] },
  ],
  render(ctx) {
    const rows = [
      ["Date / Heure", `${formatDateFr(ctx.fields.ponc_date)} ${f(ctx, "ponc_heure")}`],
      ["Protocole", f(ctx, "ponc_proto")],
      ["Follicules J trigger", f(ctx, "ponc_follicules")],
      ["Ovocytes recueillis", f(ctx, "ponc_ovocytes")],
      ["Maturité", f(ctx, "ponc_maturite")],
      ["Liquide folliculaire", f(ctx, "ponc_liquide")],
      ["Complications", f(ctx, "ponc_complications", "Aucune")],
      ["Anesthésie", f(ctx, "ponc_anesth")],
    ]
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 10px;font-weight:600;width:30%;background:#f0fafa;border:1px solid #d4e8e8">${k}</td><td style="padding:6px 10px;border:1px solid #d4e8e8">${v}</td></tr>`,
      )
      .join("");
    return wrapDocumentBody(
      ctx,
      "FICHE DE PONCTION OVOCYTAIRE",
      `<table style="width:100%;border-collapse:collapse;font-size:11px">${rows}</table>`,
      "landscape",
    );
  },
};

export const PMA_TRANSFERT: DocumentTemplate = {
  id: "pma_transfert",
  category: "pma",
  title: "Fiche de transfert embryonnaire",
  icon: "🌱",
  orientation: "landscape",
  fields: [
    { id: "te_date", label: "Date transfert", type: "date" },
    { id: "te_type", label: "Type", type: "select", options: ["Frais", "Congelé (TEC)"] },
    { id: "te_stade", label: "Stade", type: "select", options: ["J2", "J3", "J5 blastocyste", "J6 blastocyste"] },
    { id: "te_nb", label: "Nb embryons transférés", type: "select", options: ["1", "2"] },
    { id: "te_score", label: "Score morphologique", placeholder: "Istanbul / ESHRE" },
    { id: "te_congeles", label: "Nb embryons congelés", type: "number" },
    { id: "te_instructions", label: "Instructions post-transfert", type: "textarea", full: true },
    { id: "te_betahcg", label: "Date β-HCG", type: "date" },
  ],
  render(ctx) {
    const rows = [
      ["Date", formatDateFr(ctx.fields.te_date)],
      ["Type / Stade", `${f(ctx, "te_type")} — ${f(ctx, "te_stade")}`],
      ["Embryons transférés", f(ctx, "te_nb")],
      ["Score", f(ctx, "te_score")],
      ["Embryons congelés", f(ctx, "te_congeles", "0")],
      ["β-HCG prévue", formatDateFr(ctx.fields.te_betahcg)],
      ["Instructions", f(ctx, "te_instructions", "—")],
    ]
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 10px;font-weight:600;width:30%;background:#f0fafa;border:1px solid #d4e8e8">${k}</td><td style="padding:6px 10px;border:1px solid #d4e8e8">${v}</td></tr>`,
      )
      .join("");
    return wrapDocumentBody(
      ctx,
      "FICHE DE TRANSFERT EMBRYONNAIRE",
      `<table style="width:100%;border-collapse:collapse;font-size:11px">${rows}</table>`,
      "landscape",
    );
  },
};

export const PMA_SPERMOGRAMME: DocumentTemplate = {
  id: "pma_spermogramme",
  category: "pma",
  title: "Rapport de spermogramme",
  icon: "🔬",
  orientation: "portrait",
  fields: [
    { id: "sp_date", label: "Date", type: "date" },
    { id: "sp_volume", label: "Volume (mL)", type: "number" },
    { id: "sp_ph", label: "pH", type: "number" },
    { id: "sp_conc", label: "Concentration (M/mL)", type: "number" },
    { id: "sp_mob_tot", label: "Mobilité totale (%)", type: "number" },
    { id: "sp_mob_prog", label: "Mobilité progressive PR (%)", type: "number" },
    { id: "sp_morpho", label: "Morphologie Kruger strict (%)", type: "number" },
    { id: "sp_vitalite", label: "Vitalité (%)", type: "number" },
    { id: "sp_leucocytes", label: "Leucocytes", placeholder: "—" },
    { id: "sp_conclusion", label: "Conclusion", type: "select", options: [
      "Normozoospermie", "Oligospermie", "Asthénospermie", "Tératospermie", "Azoospermie", "OAT",
    ]},
    { id: "sp_reco", label: "Recommandation", type: "textarea", full: true },
  ],
  render(ctx) {
    const body = `
<p><strong>Date :</strong> ${formatDateFr(ctx.fields.sp_date)} — <strong>Patient :</strong> ${ctx.patient.fullName}</p>
<table style="width:100%;border-collapse:collapse;font-size:11px;margin:16px 0">
<tr><td style="padding:6px;border:1px solid #d4e8e8;font-weight:600">Volume</td><td style="padding:6px;border:1px solid #d4e8e8">${f(ctx, "sp_volume")} mL</td>
<td style="padding:6px;border:1px solid #d4e8e8;font-weight:600">pH</td><td style="padding:6px;border:1px solid #d4e8e8">${f(ctx, "sp_ph")}</td></tr>
<tr><td style="padding:6px;border:1px solid #d4e8e8;font-weight:600">Concentration</td><td style="padding:6px;border:1px solid #d4e8e8">${f(ctx, "sp_conc")} M/mL</td>
<td style="padding:6px;border:1px solid #d4e8e8;font-weight:600">Mobilité totale</td><td style="padding:6px;border:1px solid #d4e8e8">${f(ctx, "sp_mob_tot")} %</td></tr>
<tr><td style="padding:6px;border:1px solid #d4e8e8;font-weight:600">Mobilité PR</td><td style="padding:6px;border:1px solid #d4e8e8">${f(ctx, "sp_mob_prog")} %</td>
<td style="padding:6px;border:1px solid #d4e8e8;font-weight:600">Morphologie</td><td style="padding:6px;border:1px solid #d4e8e8">${f(ctx, "sp_morpho")} %</td></tr>
<tr><td style="padding:6px;border:1px solid #d4e8e8;font-weight:600">Vitalité</td><td style="padding:6px;border:1px solid #d4e8e8">${f(ctx, "sp_vitalite")} %</td>
<td style="padding:6px;border:1px solid #d4e8e8;font-weight:600">Leucocytes</td><td style="padding:6px;border:1px solid #d4e8e8">${f(ctx, "sp_leucocytes", "—")}</td></tr>
</table>
<p><strong>Conclusion (OMS 2021) :</strong> ${f(ctx, "sp_conclusion")}</p>
${ctx.fields.sp_reco ? `<p><strong>Recommandation :</strong> ${f(ctx, "sp_reco")}</p>` : ""}`;
    return wrapDocumentBody(ctx, "RAPPORT DE SPERMOGRAMME", body, "portrait");
  },
};

export const PMA_TEMPLATES = [
  PMA_CONSENTEMENT,
  PMA_PONCTION,
  PMA_TRANSFERT,
  PMA_SPERMOGRAMME,
];
