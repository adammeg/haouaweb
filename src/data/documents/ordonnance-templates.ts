import type { DocumentTemplate } from "@/types/documents";
import {
  checkboxFields,
  checkedList,
  f,
  formatDateFr,
  wrapDocumentBody,
} from "./template-helpers";

export const ORDO_PROTOCOLE_PMA: DocumentTemplate = {
  id: "ordo_protocole_pma",
  category: "ordonnance",
  title: "Ordonnance protocole PMA",
  icon: "🧬",
  orientation: "portrait",
  fields: [
    { id: "pma_proto", label: "Protocole", type: "select", options: ["Antagoniste", "Long agoniste", "Court agoniste", "Naturel modifié"] },
    { id: "pma_j0", label: "J0 (début)", type: "date" },
    { id: "pma_phase1", label: "Phase 1 — Blocage", type: "textarea", full: true, placeholder: "Pilule + analogue GnRH…" },
    { id: "pma_phase2", label: "Phase 2 — Stimulation", type: "textarea", full: true, placeholder: "Gonal-F 150 UI J3-J10…" },
    { id: "pma_phase3", label: "Phase 3 — Déclenchement", type: "textarea", full: true, placeholder: "Ovitrelle 250 µg à 22h00…" },
    { id: "pma_phase4", label: "Phase 4 — Phase lutéale", type: "textarea", full: true, placeholder: "Utrogestan 200 mg x2…" },
    { id: "pma_instructions", label: "Instructions patiente", type: "textarea", full: true },
  ],
  render(ctx) {
    const body = `
<div style="font-family:Georgia,serif;font-size:11pt;line-height:1.7">
<p><strong>Protocole :</strong> ${f(ctx, "pma_proto")} — <strong>J0 :</strong> ${formatDateFr(ctx.fields.pma_j0)}</p>
<div style="margin:16px 0;padding:12px;border-left:4px solid #0a5c5c;background:#f0fafa">
  <p style="margin:0 0 8px"><strong>Phase 1 — Blocage / Prétraitement</strong></p>
  <p style="margin:0;white-space:pre-wrap">${f(ctx, "pma_phase1")}</p>
</div>
<div style="margin:16px 0;padding:12px;border-left:4px solid #0a5c5c;background:#f0fafa">
  <p style="margin:0 0 8px"><strong>Phase 2 — Stimulation ovarienne</strong></p>
  <p style="margin:0;white-space:pre-wrap">${f(ctx, "pma_phase2")}</p>
</div>
<div style="margin:16px 0;padding:12px;border-left:4px solid #0a5c5c;background:#f0fafa">
  <p style="margin:0 0 8px"><strong>Phase 3 — Déclenchement</strong></p>
  <p style="margin:0;white-space:pre-wrap">${f(ctx, "pma_phase3")}</p>
</div>
<div style="margin:16px 0;padding:12px;border-left:4px solid #0a5c5c;background:#f0fafa">
  <p style="margin:0 0 8px"><strong>Phase 4 — Soutien phase lutéale</strong></p>
  <p style="margin:0;white-space:pre-wrap">${f(ctx, "pma_phase4")}</p>
</div>
${ctx.fields.pma_instructions ? `<div style="margin-top:16px;padding:12px;background:#fff8e6;border:1px solid #f0d78c;border-radius:8px"><strong>Instructions patiente :</strong><br/><span style="white-space:pre-wrap">${f(ctx, "pma_instructions")}</span></div>` : ""}
</div>`;
    return wrapDocumentBody(ctx, "ORDONNANCE — PROTOCOLE PMA", body, "portrait");
  },
};

const BIO_PRENATAL = [
  { id: "bio_nfs", label: "NFS-Plaquettes" },
  { id: "bio_grp", label: "Groupe/Rhésus" },
  { id: "bio_rai", label: "RAI" },
  { id: "bio_rub", label: "Sérologie rubéole" },
  { id: "bio_toxo", label: "Sérologie toxoplasmose" },
  { id: "bio_cmv", label: "Sérologie CMV" },
  { id: "bio_b19", label: "Sérologie parvovirus B19" },
  { id: "bio_tpha", label: "TPHA-VDRL" },
  { id: "bio_hbs", label: "Ag HBs / Ac HBs / Ac HBc" },
  { id: "bio_vih", label: "VIH 1-2" },
  { id: "bio_vhc", label: "VHC" },
  { id: "bio_ferr", label: "Ferritine" },
  { id: "bio_tsh", label: "TSH" },
  { id: "bio_ecbu", label: "ECBU" },
  { id: "bio_gly", label: "Glycémie à jeun" },
];

const BIO_PMA = [
  { id: "bio_fsh", label: "FSH / LH / E2 / AMH (J2-J3)" },
  { id: "bio_prol", label: "Prolactine" },
  { id: "bio_tsh_pma", label: "TSH" },
  { id: "bio_testo", label: "Testostérone totale" },
  { id: "bio_dhea", label: "DHEA-S" },
  { id: "bio_17oh", label: "17-OH-Progestérone" },
  { id: "bio_sperm", label: "Spermogramme" },
  { id: "bio_spermo", label: "Spermocytogramme" },
  { id: "bio_ist", label: "Bilan infectieux IST" },
  { id: "bio_caryo", label: "Caryotype" },
];

const BIO_GYN = [
  { id: "bio_fct", label: "FCT" },
  { id: "bio_ist_gyn", label: "Bilan IST (gonocoque/Chlamydia)" },
  { id: "bio_hpv", label: "HPV génotypage" },
  { id: "bio_ca125", label: "CA-125" },
  { id: "bio_hcg", label: "HCG qualitatif/quantitatif" },
];

const BIO_URGENT = [
  { id: "bio_nfs_u", label: "NFS urgente" },
  { id: "bio_tp", label: "TP/TCA" },
  { id: "bio_fibri", label: "Fibrinogène" },
  { id: "bio_hcg_u", label: "HCG" },
  { id: "bio_crea", label: "Créatinine" },
  { id: "bio_trans", label: "ASAT/ALAT" },
  { id: "bio_hellp", label: "Bilan HELLP" },
  { id: "bio_ecbu_u", label: "ECBU + culture" },
];

export const ORDO_BIOLOGIE: DocumentTemplate = {
  id: "ordo_biologie",
  category: "ordonnance",
  title: "Ordonnance de biologie",
  icon: "🧪",
  orientation: "portrait",
  fields: [
  ...checkboxFields("Bilan prénatal", BIO_PRENATAL),
  ...checkboxFields("Bilan PMA", BIO_PMA),
  ...checkboxFields("Bilan gynéco", BIO_GYN),
  ...checkboxFields("Bilan obstétrical urgent", BIO_URGENT),
    { id: "bio_notes", label: "Précisions", type: "textarea", full: true },
  ],
  render(ctx) {
    const sections = [
      ["Bilan prénatal", BIO_PRENATAL],
      ["Bilan PMA", BIO_PMA],
      ["Bilan gynéco", BIO_GYN],
      ["Bilan obstétrical urgent", BIO_URGENT],
    ] as const;
    const lists = sections
      .map(([title, items]) => {
        const list = checkedList(ctx, [...items]);
        if (list === "—") return "";
        return `<p><strong>${title} :</strong> ${list}</p>`;
      })
      .filter(Boolean)
      .join("");
    const body = `
<p>Je soussigné(e) prescris à <strong>${ctx.patient.fullName}</strong> les examens biologiques suivants :</p>
${lists || "<p><em>Aucun examen sélectionné</em></p>"}
${ctx.fields.bio_notes ? `<p><em>${f(ctx, "bio_notes")}</em></p>` : ""}`;
    return wrapDocumentBody(ctx, "ORDONNANCE DE BIOLOGIE", body, "portrait");
  },
};

const IMG_ECHO = [
  { id: "img_echo_pelv", label: "Écho pelvienne (abd + vaginale)" },
  { id: "img_echo_obs", label: "Écho obstétricale (T1/T2/T3)" },
  { id: "img_echo_morpho", label: "Écho morphologique (20-22 SA)" },
  { id: "img_echo_col", label: "Mesure longueur cervicale" },
  { id: "img_doppler_up", label: "Doppler utéro-placentaire" },
  { id: "img_doppler_omb", label: "Doppler ombilical" },
  { id: "img_doppler_cer", label: "Doppler cérébral fœtal" },
  { id: "img_echo_fol", label: "Écho folliculaire PMA" },
  { id: "img_echo_mam", label: "Écho mammaire bilatérale" },
  { id: "img_echo_endo", label: "Écho endométriale" },
  { id: "img_hyfo", label: "Hystérosonographie / HyFoSy" },
];

const IMG_IRM = [
  { id: "img_irm_pelv", label: "IRM pelvienne" },
  { id: "img_irm_mam", label: "IRM mammaire" },
  { id: "img_irm_foet", label: "IRM fœtale" },
];

const IMG_MAMMO = [
  { id: "img_mammo", label: "Mammographie bilatérale" },
  { id: "img_tomo", label: "+ Tomosynthèse" },
  { id: "img_mammo_echo", label: "+ Écho mammaire complément" },
  { id: "img_cyto", label: "+ Cytoponction / Microbiopsie" },
];

export const ORDO_IMAGERIE: DocumentTemplate = {
  id: "ordo_imagerie",
  category: "ordonnance",
  title: "Ordonnance d'imagerie",
  icon: "📷",
  orientation: "portrait",
  fields: [
  ...checkboxFields("Échographie", IMG_ECHO),
  ...checkboxFields("IRM", IMG_IRM),
  ...checkboxFields("Mammographie", IMG_MAMMO),
    { id: "img_indication", label: "Indication", type: "textarea", full: true },
    { id: "img_notes", label: "Précisions", type: "textarea", full: true },
  ],
  render(ctx) {
    const sections = [
      ["Échographie", IMG_ECHO],
      ["IRM", IMG_IRM],
      ["Mammographie", IMG_MAMMO],
    ] as const;
    const lists = sections
      .map(([title, items]) => {
        const list = checkedList(ctx, [...items]);
        if (list === "—") return "";
        return `<p><strong>${title} :</strong> ${list}</p>`;
      })
      .filter(Boolean)
      .join("");
    const body = `
<p>Je soussigné(e) prescris à <strong>${ctx.patient.fullName}</strong> les examens d'imagerie suivants :</p>
${ctx.fields.img_indication ? `<p><strong>Indication :</strong> ${f(ctx, "img_indication")}</p>` : ""}
${lists || "<p><em>Aucun examen sélectionné</em></p>"}
${ctx.fields.img_notes ? `<p><em>${f(ctx, "img_notes")}</em></p>` : ""}`;
    return wrapDocumentBody(ctx, "ORDONNANCE D'IMAGERIE", body, "portrait");
  },
};

export const ORDONNANCE_TEMPLATES = [
  ORDO_PROTOCOLE_PMA,
  ORDO_BIOLOGIE,
  ORDO_IMAGERIE,
];
