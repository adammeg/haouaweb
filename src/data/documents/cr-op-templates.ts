import type { DocumentTemplate } from "@/types/documents";
import {
  checkboxFields,
  checkedList,
  crTable,
  f,
  formatDateFr,
  wrapDocumentBody,
} from "./template-helpers";

const CESARIENNE_INDICATIONS = [
  { id: "ind_dystocie", label: "Dystocie osseuse" },
  { id: "ind_stag_dil", label: "Stagnation dilatation" },
  { id: "ind_stag_desc", label: "Stagnation descente" },
  { id: "ind_arcf", label: "ARCF / Souffrance fœtale aiguë" },
  { id: "ind_placenta", label: "Placenta prævia" },
  { id: "ind_hrp", label: "Hématome rétroplacentaire" },
  { id: "ind_cicatrice", label: "Utérus cicatriciel" },
  { id: "ind_pres_dyst", label: "Présentation dystocique" },
  { id: "ind_macro", label: "Macrosomie fœtale" },
  { id: "ind_echec", label: "Échec déclenchement" },
  { id: "ind_procidence", label: "Procidence du cordon" },
  { id: "ind_hellp", label: "Pré-éclampsie sévère / HELLP" },
  { id: "ind_desir", label: "Désir maternel éclairé" },
];

export const CR_CESARIENNE: DocumentTemplate = {
  id: "cr_cesarienne",
  category: "cr_op",
  title: "Césarienne",
  icon: "🔪",
  orientation: "landscape",
  fields: [
    { id: "cs_date", label: "Date", type: "date" },
    { id: "cs_deb", label: "Heure début", type: "time" },
    { id: "cs_fin", label: "Heure fin", type: "time" },
    { id: "cs_type", label: "Type", type: "select", options: ["Programmée", "En urgence"] },
    { id: "cs_urgence", label: "Grade urgence", type: "select", options: ["Grade 1", "Grade 2", "Grade 3", "Grade 4"] },
  ...checkboxFields("Indication(s)", CESARIENNE_INDICATIONS),
    { id: "ind_autre", label: "Autre indication", type: "text", full: true },
    { id: "cs_anesth", label: "Anesthésie", type: "select", options: ["Rachianesthésie", "APD", "AG"] },
    { id: "cs_voie", label: "Voie d'abord", type: "select", options: ["Pfannenstiel", "Médiane sous-ombilicale", "Reprise cicatrice"] },
    { id: "cs_hystero", label: "Hystérotomie", type: "select", options: ["Segmentaire transversale", "Corporéale"] },
    { id: "cs_extraction", label: "Extraction fœtale", type: "textarea" },
    { id: "cs_delivrance", label: "Délivrance", type: "select", options: ["Naturelle", "Artificielle"] },
    { id: "cs_revision", label: "Révision cavité", type: "select", options: ["Oui", "Non"] },
    { id: "cs_fermeture", label: "Fermeture utérus", placeholder: "2 plans — Vicryl" },
    { id: "cs_annexes", label: "Exploration annexes", type: "textarea" },
    { id: "cs_parietale", label: "Fermeture pariétale", type: "textarea" },
    { id: "cs_complications", label: "Complications", type: "textarea" },
    { id: "cs_pertes", label: "Pertes sanguines (mL)", type: "number" },
    { id: "cs_transfusion", label: "Transfusion", type: "select", options: ["Non", "Oui"] },
    { id: "nn_sexe", label: "NN — Sexe", type: "select", options: ["F", "M"] },
    { id: "nn_poids", label: "Poids (g)", type: "number" },
    { id: "nn_apgar", label: "Apgar 1'/5'", placeholder: "9/10" },
    { id: "cs_hospi", label: "Durée hospitalisation", placeholder: "3 jours" },
    { id: "cs_equipe", label: "Équipe", type: "textarea", full: true },
  ],
  render(ctx) {
    const inds = checkedList(ctx, CESARIENNE_INDICATIONS);
    const body = crTable([
      ["Date / Heures", `${formatDateFr(ctx.fields.cs_date)} ${f(ctx, "cs_deb")} → ${f(ctx, "cs_fin")}`],
      ["Type", `${f(ctx, "cs_type")}${ctx.fields.cs_urgence ? ` — ${f(ctx, "cs_urgence")}` : ""}`],
      ["Indication(s)", `${inds}${ctx.fields.ind_autre ? ` — ${f(ctx, "ind_autre")}` : ""}`],
      ["Anesthésie / Voie", `${f(ctx, "cs_anesth")} — ${f(ctx, "cs_voie")}`],
      ["Hystérotomie", f(ctx, "cs_hystero")],
      ["Extraction", f(ctx, "cs_extraction")],
      ["Délivrance / Révision", `${f(ctx, "cs_delivrance")} — Révision : ${f(ctx, "cs_revision")}`],
      ["Fermeture utérus", f(ctx, "cs_fermeture")],
      ["Annexes", f(ctx, "cs_annexes")],
      ["Fermeture pariétale", f(ctx, "cs_parietale")],
      ["Complications", f(ctx, "cs_complications", "Aucune")],
      ["Pertes / Transfusion", `${f(ctx, "cs_pertes")} mL — Transfusion : ${f(ctx, "cs_transfusion", "Non")}`],
      ["Nouveau-né", `${f(ctx, "nn_sexe")} — ${f(ctx, "nn_poids")} g — Apgar ${f(ctx, "nn_apgar")}`],
      ["Hospitalisation", f(ctx, "cs_hospi")],
      ["Équipe", f(ctx, "cs_equipe")],
    ]);
    return wrapDocumentBody(ctx, "COMPTE RENDU — CÉSARIENNE", body, "landscape");
  },
};

const CELIO_INDICATIONS = [
  { id: "cel_infert", label: "Bilan infertilité" },
  { id: "cel_endo", label: "Endométriose" },
  { id: "cel_kyste", label: "Kyste ovarien" },
  { id: "cel_geu", label: "GEU" },
  { id: "cel_myome", label: "Myomectomie" },
  { id: "cel_adh", label: "Adhésiolyse" },
  { id: "cel_steril", label: "Stérilisation tubaire" },
  { id: "cel_hyst", label: "Hystérectomie cœlioscopique" },
  { id: "cel_explor", label: "Exploration pelvis" },
];

export const CR_CELIOSCOPIE: DocumentTemplate = {
  id: "cr_celioscopie",
  category: "cr_op",
  title: "Cœlioscopie gynécologique",
  icon: "🔬",
  orientation: "landscape",
  fields: [
  ...checkboxFields("Indication(s)", CELIO_INDICATIONS),
    { id: "cel_ind_autre", label: "Autre indication", type: "text" },
    { id: "cel_trend", label: "Trendelenburg (°)", placeholder: "20" },
    { id: "cel_sonde", label: "Sonde urinaire", type: "select", options: ["Oui", "Non"] },
    { id: "cel_trocarts", label: "Trocarts", type: "textarea" },
    { id: "cel_co2", label: "CO₂ pression/volume", placeholder: "12 mmHg / 45 L" },
    { id: "cel_uterus", label: "Utérus", type: "textarea" },
    { id: "cel_td", label: "Trompe droite", type: "textarea" },
    { id: "cel_tg", label: "Trompe gauche", type: "textarea" },
    { id: "cel_od", label: "Ovaire droit", type: "textarea" },
    { id: "cel_og", label: "Ovaire gauche", type: "textarea" },
    { id: "cel_douglas", label: "Douglas", type: "textarea" },
    { id: "cel_gestes", label: "Gestes réalisés", type: "textarea", full: true },
    { id: "cel_anapath", label: "Anapath", type: "select", options: ["Non", "Oui"] },
    { id: "cel_anapath_desc", label: "Description pièce", type: "text" },
    { id: "cel_complications", label: "Complications", type: "textarea" },
    { id: "cel_pertes", label: "Pertes (mL)", type: "number" },
    { id: "cel_duree", label: "Durée (min)", type: "number" },
    { id: "cel_equipe", label: "Équipe", type: "textarea", full: true },
  ],
  render(ctx) {
    const body = crTable([
      ["Indication(s)", `${checkedList(ctx, CELIO_INDICATIONS)}${ctx.fields.cel_ind_autre ? ` — ${f(ctx, "cel_ind_autre")}` : ""}`],
      ["Position", `Trendelenburg ${f(ctx, "cel_trend")}° — Sonde : ${f(ctx, "cel_sonde")}`],
      ["Trocarts", f(ctx, "cel_trocarts")],
      ["CO₂", f(ctx, "cel_co2")],
      ["Utérus", f(ctx, "cel_uterus")],
      ["Trompe D", f(ctx, "cel_td")],
      ["Trompe G", f(ctx, "cel_tg")],
      ["Ovaire D", f(ctx, "cel_od")],
      ["Ovaire G", f(ctx, "cel_og")],
      ["Douglas", f(ctx, "cel_douglas")],
      ["Gestes", f(ctx, "cel_gestes")],
      ["Anapath", ctx.fields.cel_anapath === "Oui" ? f(ctx, "cel_anapath_desc") : "Non"],
      ["Complications", f(ctx, "cel_complications", "Aucune")],
      ["Pertes / Durée", `${f(ctx, "cel_pertes")} mL — ${f(ctx, "cel_duree")} min`],
      ["Équipe", f(ctx, "cel_equipe")],
    ]);
    return wrapDocumentBody(ctx, "COMPTE RENDU — CŒLIOSCOPIE GYNÉCOLOGIQUE", body, "landscape");
  },
};

const HYSTRO_INDICATIONS = [
  { id: "hys_metro", label: "Bilan métrorragies" },
  { id: "hys_polype", label: "Polype endométrial" },
  { id: "hys_myome", label: "Myome sous-muqueux" },
  { id: "hys_synechie", label: "Synéchie" },
  { id: "hys_cloison", label: "Cloison utérine" },
  { id: "hys_diu", label: "Corps étranger / DIU perdu" },
  { id: "hys_infert", label: "Bilan infertilité" },
];

export const CR_HYSTEROSCOPIE: DocumentTemplate = {
  id: "cr_hysteroscopie",
  category: "cr_op",
  title: "Hystéroscopie",
  icon: "🪞",
  orientation: "landscape",
  fields: [
    { id: "hys_type", label: "Type", type: "select", options: ["Diagnostique", "Opératoire"] },
  ...checkboxFields("Indication(s)", HYSTRO_INDICATIONS),
    { id: "hys_anesth", label: "Anesthésie", type: "select", options: ["Locale", "Sédation", "AG", "Rachianesthésie"] },
    { id: "hys_hystro", label: "Hystéromètre (cm)", type: "number" },
    { id: "hys_optique", label: "Optique", placeholder: "30° — 5 mm" },
    { id: "hys_milieu", label: "Milieu distension", type: "select", options: ["Sérum physiologique", "Glycocolle", "CO2"] },
    { id: "hys_volume", label: "Volume / Déficit (mL)", placeholder: "800 / 50" },
    { id: "hys_constat", label: "Constatations", type: "textarea", full: true },
    { id: "hys_gestes", label: "Gestes réalisés", type: "textarea", full: true },
    { id: "hys_biopsie", label: "Biopsie / Anapath", type: "text" },
    { id: "hys_complications", label: "Complications", type: "textarea" },
    { id: "hys_duree", label: "Durée (min)", type: "number" },
    { id: "hys_suite", label: "Suite", type: "select", options: ["Ambulatoire", "Hospitalisation"] },
  ],
  render(ctx) {
    const body = crTable([
      ["Type", f(ctx, "hys_type")],
      ["Indication(s)", checkedList(ctx, HYSTRO_INDICATIONS)],
      ["Anesthésie", f(ctx, "hys_anesth")],
      ["Hystéromètre / Optique", `${f(ctx, "hys_hystro")} cm — ${f(ctx, "hys_optique")}`],
      ["Milieu", `${f(ctx, "hys_milieu")} — ${f(ctx, "hys_volume")} mL`],
      ["Constatations", f(ctx, "hys_constat")],
      ["Gestes", f(ctx, "hys_gestes", "Aucun")],
      ["Prélèvements", f(ctx, "hys_biopsie", "Non")],
      ["Complications", f(ctx, "hys_complications", "Aucune")],
      ["Durée / Suite", `${f(ctx, "hys_duree")} min — ${f(ctx, "hys_suite")}`],
    ]);
    return wrapDocumentBody(ctx, "COMPTE RENDU — HYSTÉROSCOPIE", body, "landscape");
  },
};

export const CR_CONISATION: DocumentTemplate = {
  id: "cr_conisation",
  category: "cr_op",
  title: "Conisation / Colposcopie",
  icon: "🔬",
  orientation: "landscape",
  fields: [
    { id: "con_ind", label: "Indication", type: "select", options: ["CIN 1", "CIN 2", "CIN 3", "Carcinome in situ", "Microinvasif"] },
    { id: "con_colpo", label: "Colposcopie préalable", type: "select", options: ["Oui", "Non"] },
    { id: "con_zt", label: "Zone transformation", type: "select", options: ["Type 1", "Type 2", "Type 3"] },
    { id: "con_tech", label: "Technique", type: "select", options: ["LLETZ", "Laser CO2", "Bistouri froid", "Laser"] },
    { id: "con_dims", label: "Dimensions pièce", placeholder: "12 × 18 mm" },
    { id: "con_marges", label: "Marges", type: "select", options: ["Libres", "Atteintes endocervicale", "Atteintes exocervicale"] },
    { id: "con_hemostase", label: "Hémostase", type: "select", options: ["Coagulation", "Points de suture", "Monsel"] },
    { id: "con_curetage", label: "Curetage endocervical", type: "select", options: ["Non", "Oui"] },
    { id: "con_notes", label: "Observations", type: "textarea", full: true },
  ],
  render(ctx) {
    const body = crTable([
      ["Indication", f(ctx, "con_ind")],
      ["Colposcopie / ZT", `${f(ctx, "con_colpo")} — ZT ${f(ctx, "con_zt")}`],
      ["Technique", f(ctx, "con_tech")],
      ["Dimensions", f(ctx, "con_dims")],
      ["Marges", f(ctx, "con_marges")],
      ["Hémostase", f(ctx, "con_hemostase")],
      ["Curetage", f(ctx, "con_curetage")],
      ["Anapath", "Systématique"],
      ["Notes", f(ctx, "con_notes", "—")],
    ]);
    return wrapDocumentBody(ctx, "COMPTE RENDU — CONISATION", body, "landscape");
  },
};

export const CR_DIU: DocumentTemplate = {
  id: "cr_diu",
  category: "cr_op",
  title: "Pose / Retrait DIU",
  icon: "⭕",
  orientation: "landscape",
  fields: [
    { id: "diu_acte", label: "Acte", type: "select", options: ["Pose", "Retrait"] },
    { id: "diu_type", label: "Type DIU", type: "select", options: ["Cuivre", "Hormonal LNG"] },
    { id: "diu_modele", label: "Modèle", placeholder: "Mirena / Cu 375" },
    { id: "diu_ind", label: "Indication", type: "select", options: ["Contraception", "Post-abortum", "Post-partum", "Ménorragies", "Endométriose"] },
    { id: "diu_hystro", label: "Hystérométrie (cm)", type: "number" },
    { id: "diu_dilat", label: "Dilatation", type: "select", options: ["Non", "Oui"] },
    { id: "diu_difficulte", label: "Difficulté", type: "select", options: ["Aucune", "Modérée", "Sévère"] },
    { id: "diu_echo", label: "Contrôle écho", type: "select", options: ["Non", "Oui"] },
    { id: "diu_position", label: "Position", type: "select", options: ["Normale", "Anormale"] },
    { id: "diu_fils", label: "Fils visibles", type: "select", options: ["Oui", "Non"] },
  ],
  render(ctx) {
    const body = crTable([
      ["Acte", f(ctx, "diu_acte")],
      ["Type / Modèle", `${f(ctx, "diu_type")} — ${f(ctx, "diu_modele")}`],
      ["Indication", f(ctx, "diu_ind")],
      ["Hystérométrie", `${f(ctx, "diu_hystro")} cm`],
      ["Dilatation", f(ctx, "diu_dilat")],
      ["Difficulté", f(ctx, "diu_difficulte")],
      ["Écho post-pose", `${f(ctx, "diu_echo")} — Position : ${f(ctx, "diu_position")}`],
      ["Fils visibles", f(ctx, "diu_fils")],
    ]);
    return wrapDocumentBody(ctx, "COMPTE RENDU — POSE / RETRAIT DIU", body, "landscape");
  },
};

export const CR_AVB_SIEGE: DocumentTemplate = {
  id: "cr_avb_siege",
  category: "cr_op",
  title: "Accouchement siège (AVB)",
  icon: "👶",
  orientation: "landscape",
  fields: [
    { id: "acc_date", label: "Date", type: "date" },
    { id: "acc_heure", label: "Heure", type: "time" },
    { id: "terme", label: "Terme", placeholder: "38 SA" },
    { id: "parite", label: "Parité", placeholder: "G2P1" },
    { id: "siege_type", label: "Type siège", type: "select", options: ["Complet", "Décomplété", "Footling"] },
    { id: "siege_manoeuvres", label: "Manœuvres", type: "select", options: ["Louvset", "Bracht", "Mauriceau", "Forceps sur tête dernière"] },
    { id: "siege_forceps", label: "Forceps (modèle)", type: "text" },
    { id: "siege_operateurs", label: "Opérateurs", type: "textarea" },
    { id: "siege_complications", label: "Complications", type: "textarea" },
    { id: "nn_sexe", label: "NN — Sexe", type: "select", options: ["F", "M"] },
    { id: "nn_poids", label: "Poids (g)", type: "number" },
    { id: "nn_apgar", label: "Apgar 1'/5'", placeholder: "8/10" },
    { id: "anesthesie", label: "Anesthésie", type: "select", options: ["Sans", "APD", "Rachianesthésie", "AG"] },
  ],
  render(ctx) {
    const body = crTable([
      ["Date / Heure", `${formatDateFr(ctx.fields.acc_date)} ${f(ctx, "acc_heure")}`],
      ["Terme / Parité", `${f(ctx, "terme")} / ${f(ctx, "parite")}`],
      ["Type siège", f(ctx, "siege_type")],
      ["Manœuvres", `${f(ctx, "siege_manoeuvres")}${ctx.fields.siege_forceps ? ` (${f(ctx, "siege_forceps")})` : ""}`],
      ["Opérateurs", f(ctx, "siege_operateurs")],
      ["Complications", f(ctx, "siege_complications", "Aucune")],
      ["Nouveau-né", `${f(ctx, "nn_sexe")} — ${f(ctx, "nn_poids")} g — Apgar ${f(ctx, "nn_apgar")}`],
      ["Anesthésie", f(ctx, "anesthesie")],
    ]);
    return wrapDocumentBody(ctx, "COMPTE RENDU — ACCOUCHEMENT SIÈGE", body, "landscape");
  },
};

export const CR_CERCLAGE: DocumentTemplate = {
  id: "cr_cerclage",
  category: "cr_op",
  title: "Cerclage du col",
  icon: "🔗",
  orientation: "landscape",
  fields: [
    { id: "cer_ind", label: "Indication", type: "select", options: ["Incompétence cervicale", "Antécédent fausse couche tardive", "Col court"] },
    { id: "cer_type", label: "Type", type: "select", options: ["Prophylactique", "Thérapeutique", "Urgence (rescue)"] },
    { id: "cer_technique", label: "Technique", type: "select", options: ["McDonald", "Shirodkar", "Voie abdominale (cœlio)", "Voie abdominale (laparotomie)"] },
    { id: "cer_pose_sa", label: "Terme pose (SA)", placeholder: "14" },
    { id: "cer_depose", label: "Dépose prévue", placeholder: "36 SA ou début travail" },
    { id: "cer_complications", label: "Complications", type: "textarea" },
    { id: "cer_notes", label: "Notes", type: "textarea", full: true },
  ],
  render(ctx) {
    const body = crTable([
      ["Indication", f(ctx, "cer_ind")],
      ["Type", f(ctx, "cer_type")],
      ["Technique", f(ctx, "cer_technique")],
      ["Terme pose", `${f(ctx, "cer_pose_sa")} SA`],
      ["Dépose prévue", f(ctx, "cer_depose")],
      ["Complications", f(ctx, "cer_complications", "Aucune")],
      ["Notes", f(ctx, "cer_notes", "—")],
    ]);
    return wrapDocumentBody(ctx, "COMPTE RENDU — CERCLAGE DU COL", body, "landscape");
  },
};

export const CR_OP_TEMPLATES = [
  CR_CESARIENNE,
  CR_CELIOSCOPIE,
  CR_HYSTEROSCOPIE,
  CR_CONISATION,
  CR_DIU,
  CR_AVB_SIEGE,
  CR_CERCLAGE,
];
