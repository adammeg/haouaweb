import type { PatientSnapshot } from "@/types/domain";
import type { Specialty } from "@/types/domain";

export type ChecklistItemDef = {
  id: string;
  label: string;
  sub: string;
  check: (d: PatientSnapshot) => boolean;
  warn?: boolean;
};

export const CHECKLISTS: Record<Specialty, ChecklistItemDef[]> = {
  gyn: [
    {
      id: "g1",
      label: "Motif de consultation renseigné",
      sub: "Sélectionner un motif dans le menu déroulant",
      check: (d) => !!d.motif,
    },
    {
      id: "g2",
      label: "Description des symptômes complète",
      sub: "Au moins 20 caractères dans la description",
      check: (d) => (d.symptomes ?? "").length > 20,
    },
    {
      id: "g3",
      label: "DDR et caractère des cycles notés",
      sub: "Date des dernières règles + régularité",
      check: (d) => !!d.g_ddr && !!d.g_reg,
    },
    {
      id: "g4",
      label: "Contraception actuelle documentée",
      sub: "Aucun moyen = à préciser explicitement",
      check: (d) => !!d.g_contra,
    },
    {
      id: "g5",
      label: "Dernier FCV daté et résultat noté",
      sub: "Dépistage cancer col — obligatoire dès 25 ans",
      check: (d) => !!d.g_fcv && !!d.g_fcv_res,
      warn: true,
    },
    {
      id: "g6",
      label: "Gestité / Parité renseignée",
      sub: "G / P / A dans les ATCD gynéco",
      check: (d) => !!d.g_gest || d.g_gest === "0",
    },
    {
      id: "g7",
      label: "ATCD médicaux vérifiés",
      sub: "HTA, diabète, thyroïde",
      check: (d) => !!d.hta && !!d.diabete,
    },
    {
      id: "g8",
      label: "Traitements en cours notés",
      sub: "Y compris phytothérapie et automédication",
      check: (d) => !!d.traitements,
    },
    {
      id: "g9",
      label: "Examen clinique réalisé",
      sub: "Au minimum TA et poids renseignés",
      check: (d) => !!d.ec_ta && !!d.ec_poids,
    },
    {
      id: "g10",
      label: "Conclusion clinique rédigée",
      sub: 'Champ "Conclusion" dans l\'examen clinique',
      check: (d) => (d.ec_conclusion ?? "").length > 10,
      warn: true,
    },
  ],
  obst: [
    {
      id: "o1",
      label: "DDR et terme calculés",
      sub: "DDR saisie → terme et DPA calculés automatiquement",
      check: (d) => !!d.o_ddr && !!d.o_terme,
    },
    {
      id: "o2",
      label: "Gestité / Parité à jour",
      sub: "G / P / A documentés",
      check: (d) => !!d.o_gest,
    },
    {
      id: "o3",
      label: "Groupe sanguin et Rhésus",
      sub: "Si Rh négatif : vérifier RAI",
      check: (d) => !!d.o_grp,
      warn: true,
    },
    {
      id: "o4",
      label: "BCF auscultés et notés",
      sub: "Obligatoire à chaque consultation prénatale",
      check: (d) => !!d.o_bcf,
      warn: true,
    },
    {
      id: "o5",
      label: "Mouvements actifs fœtaux",
      sub: "MAF bien perçus, diminués ou absents",
      check: (d) => !!d.o_maf,
    },
    {
      id: "o6",
      label: "Tension artérielle relevée",
      sub: "Seuil : ≥ 140/90 mmHg = alerte pré-éclampsie",
      check: (d) => !!d.o_ta,
      warn: true,
    },
    {
      id: "o7",
      label: "Hauteur utérine mesurée",
      sub: "Cohérence avec le terme gestationnel",
      check: (d) => !!d.o_hu,
    },
    {
      id: "o8",
      label: "Présentation fœtale précisée",
      sub: "Dès 32 SA — siège à documenter",
      check: (d) => !!d.o_pres,
    },
    {
      id: "o9",
      label: "Sérologies de grossesse vérifiées",
      sub: "Toxo, rubéole, HBs, VIH, RAI",
      check: (d) => !!d.o_toxo || !!d.o_grp,
    },
    {
      id: "o10",
      label: "Prise de poids totale notée",
      sub: "Objectif : 9–12 kg pour IMC normal",
      check: (d) => !!d.o_pdstot,
    },
    {
      id: "o11",
      label: "ATCD obstétricaux documentés",
      sub: "Grossesses précédentes, complications, CS",
      check: (d) =>
        !!d.o_atcd_gross || d.o_gest === "1",
    },
    {
      id: "o12",
      label: "Conclusion / CAT rédigée",
      sub: "Conduite à tenir clairement notée",
      check: (d) => (d.ec_conclusion ?? "").length > 10,
      warn: true,
    },
  ],
  inf: [
    {
      id: "i1",
      label: "Durée d'infertilité précisée",
      sub: "En mois — primaire ou secondaire",
      check: (d) => !!d.i_duree,
    },
    {
      id: "i2",
      label: "Caractère des cycles documenté",
      sub: "Régularité, durée, dysménorrhée",
      check: (d) => !!d.i_reg,
    },
    {
      id: "i3",
      label: "Bilan hormonal J3 renseigné",
      sub: "FSH, LH, E2, AMH — indispensable",
      check: (d) => !!d.i_hormones,
      warn: true,
    },
    {
      id: "i4",
      label: "Compte folliculaire antral noté",
      sub: "CFA echographique — réserve ovarienne",
      check: (d) => !!d.i_cfa,
      warn: true,
    },
    {
      id: "i5",
      label: "HSG ou équivalent documenté",
      sub: "Perméabilité tubaire — obligatoire",
      check: (d) => !!d.i_hsg && d.i_hsg !== "Non réalisée",
      warn: true,
    },
    {
      id: "i6",
      label: "Spermogramme du conjoint",
      sub: "Facteur masculin à éliminer en premier",
      check: (d) =>
        !!d.i_spermo_res && d.i_spermo_res !== "Non réalisé",
      warn: true,
    },
    {
      id: "i7",
      label: "Signes SOPK recherchés",
      sub: "Acné, hirsutisme, IMC, cycles irréguliers",
      check: (d) => !!d.i_sopk,
    },
    {
      id: "i8",
      label: "Tentatives AMP antérieures notées",
      sub: "Nombre, type, résultats",
      check: (d) => !!d.i_amp,
    },
    {
      id: "i9",
      label: "TSH et prolactine dosées",
      sub: "Causes thyroïdiennes et hyperprolactinémie",
      check: (d) => {
        const h = (d.i_hormones ?? "").toLowerCase();
        return h.includes("tsh") || h.includes("prl");
      },
    },
    {
      id: "i10",
      label: "Acide folique prescrit",
      sub: "5 mg/j en préconceptionnel — systématique",
      check: (d) => (d.traitements ?? "").toLowerCase().includes("folique"),
      warn: true,
    },
  ],
};

export const CHECKLIST_SPEC_TITLES: Record<Specialty, string> = {
  gyn: "Gynécologie",
  obst: "Obstétrique",
  inf: "Infertilité / AMP",
};
