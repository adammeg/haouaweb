/**
 * Base de connaissances RAG HawaeMD.
 * Fiches de synthèse rattachées au référentiel des pathologies (referentiel.ts).
 * Chaque fiche cite ses documents sources ; les divergences entre sociétés sont listées, jamais fusionnées.
 */

import type { PathologyId } from "./referentiel";
import { P1_GYN_KB } from "./knowledge-base-p1-gyn";
import { P1_OBST_KB } from "./knowledge-base-p1-obst";
import { buildOrientationChunks } from "./knowledge-base-orientation";
import { P23_GYN_A_KB } from "./knowledge-base-p23-gyn-a";
import { P23_GYN_B_KB } from "./knowledge-base-p23-gyn-b";
import { P23_OBST_A_KB } from "./knowledge-base-p23-obst-a";
import { P23_OBST_B_KB } from "./knowledge-base-p23-obst-b";
import { P23_OBST_C_KB } from "./knowledge-base-p23-obst-c";
import { P23_ONCO_PMA_KB } from "./knowledge-base-p23-onco-pma";
import type { SourceScope } from "./referentiel-annexes";

export type RagDomain = "OBST" | "GYN" | "PMA";

export type RagReference = {
  society: string;
  title: string;
  year?: number;
  role: "principale" | "complementaire";
  /** "verifie_referentiel" : version contrôlée dans le référentiel (2024–2026) ; sinon à reconfirmer sur le site officiel. */
  check: "verifie_referentiel" | "a_reconfirmer";
  /** Portée géographique de la société (glossaire du référentiel). */
  scope?: SourceScope;
};

export type RagChunk = {
  id: string;
  /** "orientation" : fiche générée depuis le référentiel, sans contenu clinique. Absent = fiche de synthèse. */
  kind?: "synthese" | "orientation";
  /** Contrôle de version de la source : date ISO et initiales du relecteur, renseignés à la relecture. */
  verifiedAt?: string;
  verifiedBy?: string;
  pathologyIds: PathologyId[];
  source: string;
  domain: RagDomain;
  topic: string;
  title: string;
  year: number;
  /** Niveau de preuve tel que publié par la source ; jamais auto-attribué. */
  evidence: string;
  keywords: string[];
  text: string;
  references: RagReference[];
  divergences?: string[];
  status: "en_vigueur" | "en_revision" | "remplace" | "retire";
  sourceUrl?: string;
  reviewStatus: "source_checked" | "unreviewed";
  reviewNote?: string;
};

const NOT_GRADED = "Non coté dans cette fiche — se reporter au grade publié par la source";

function main(society: string, title: string, year?: number, verified = false): RagReference {
  return { society, title, year, role: "principale", check: verified ? "verifie_referentiel" : "a_reconfirmer" };
}
function compl(society: string, title: string, year?: number, verified = false): RagReference {
  return { society, title, year, role: "complementaire", check: verified ? "verifie_referentiel" : "a_reconfirmer" };
}

const CORE_KB: RagChunk[] = [
  {
    id: "fgr-definition-doppler",
    pathologyIds: ["OB-52", "EC-04", "EC-03"],
    source: "ISUOG 2020 · Gordijn 2016 (Delphi) · FIGO 2021",
    domain: "OBST",
    topic: "FGR",
    title: "Restriction de croissance fœtale — définitions (Delphi) et marqueurs Doppler",
    year: 2021,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["FGR", "RCIU", "RCF", "PAG", "SGA", "PFE", "percentile", "biométrie", "Doppler", "AO", "ombilicale", "ACM", "RCP", "CPR", "rapport cérébro-placentaire", "DV", "ductus", "IP", "Delphi"],
    references: [
      main("ISUOG", "Practice Guidelines: diagnosis and management of small-for-gestational-age fetus and fetal growth restriction", 2020),
      main("FIGO", "Initiative on fetal growth: best practice advice for screening, diagnosis and management of FGR", 2021),
      main("Gordijn et al.", "Consensus definition of fetal growth restriction: a Delphi procedure", 2016),
      compl("ISUOG", "Practice Guidelines (updated): use of Doppler velocimetry in obstetrics", 2021),
      compl("CNGOF", "RPC Retard de croissance intra-utérin", 2013),
    ],
    divergences: ["Le percentile d'un même fœtus varie selon la courbe de référence (Hadlock, INTERGROWTH-21st, courbes CFEF) : préciser la courbe utilisée."],
    text: "DÉFINITIONS (consensus Delphi, Gordijn 2016 ; repris par ISUOG 2020 et FIGO 2021) :\nPAG (SGA) : périmètre abdominal (PA) ou poids fœtal estimé (PFE) < 10e percentile, sans autre anomalie. RCF (FGR, RCIU) : fœtus n'atteignant pas son potentiel de croissance.\nRCF PRÉCOCE (< 32 SA, sans malformation) : PA ou PFE < 3e percentile, OU diastole ombilicale nulle, OU [PA ou PFE < 10e percentile associé à un IP des artères utérines > 95e percentile et/ou un IP de l'artère ombilicale > 95e percentile].\nRCF TARDIF (≥ 32 SA) : PA ou PFE < 3e percentile, OU au moins 2 critères parmi : PA ou PFE < 10e percentile ; cassure de la courbe de PA ou de PFE de plus de 2 quartiles ; rapport cérébro-placentaire (RCP) < 5e percentile ou IP ombilical > 95e percentile.\n\nMARQUEURS DOPPLER :\n- Artère ombilicale (AO) : reflet des résistances placentaires ; diastole nulle (AEDF) puis inversée (REDF) dans les formes sévères.\n- Artère cérébrale moyenne (ACM) : IP < 5e percentile = vasodilatation cérébrale (redistribution).\n- RCP (CPR) = IP ACM / IP AO : à interpréter en percentile pour l'âge gestationnel (< 5e percentile), pas avec un seuil fixe.\n- Ductus venosus (DV) : IP > 95e percentile, onde a nulle ou inversée = signes tardifs d'altération hémodynamique.\n- Artères utérines : IP moyen > 95e percentile = défaut de placentation.\n\nÉTIOLOGIES À RECHERCHER : insuffisance placentaire (la plus fréquente), anomalies chromosomiques ou malformatives, infections fœtales (CMV…), pathologies maternelles vasculaires ou auto-immunes.",
  },
  {
    id: "fgr-stades-terme-naissance",
    pathologyIds: ["OB-52", "EC-04", "OB-60"],
    source: "ISUOG 2020 · Figueras & Gratacós 2014 (protocole de Barcelone)",
    domain: "OBST",
    topic: "FGR",
    title: "Restriction de croissance fœtale — stades de Barcelone, surveillance et terme de naissance",
    year: 2020,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["FGR", "RCIU", "RCF", "stade", "Barcelone", "surveillance", "extraction", "terme", "naissance", "AEDF", "REDF", "DV", "ductus", "AO", "RCF informatisé", "VCT"],
    references: [
      main("ISUOG", "Practice Guidelines: diagnosis and management of small-for-gestational-age fetus and fetal growth restriction", 2020),
      main("Figueras & Gratacós", "Update on the diagnosis and classification of fetal growth restriction and proposal of a stage-based management protocol (Fetal Diagn Ther)", 2014),
      compl("FIGO", "Initiative on fetal growth", 2021),
      compl("SMFM", "Consult Series #52: Diagnosis and management of fetal growth restriction", 2020),
    ],
    divergences: ["Les termes de naissance par stade (Barcelone) et les repères ISUOG 2020 ne sont pas strictement superposables ; le SMFM propose d'autres bornes."],
    text: "ATTENTION : la classification en stades I à IV est le protocole de Barcelone (Figueras & Gratacós 2014). Ce n'est pas une classification FIGO.\n\nPROTOCOLE PAR STADES (Figueras & Gratacós 2014) :\nStade I (insuffisance placentaire légère) : PFE < 3e percentile, ou RCP < 5e percentile, ou IP AO > 95e, ou IP ACM < 5e, ou IP des artères utérines > 95e. Surveillance hebdomadaire ; naissance proposée à 37 SA, déclenchement possible.\nStade II : diastole ombilicale nulle (AEDF). Surveillance bihebdomadaire ; naissance proposée à 34 SA, par césarienne.\nStade III : diastole ombilicale inversée (REDF) ou IP du DV > 95e percentile. Surveillance tous les 1 à 2 jours ; naissance proposée à 30 SA, par césarienne.\nStade IV : onde a du DV inversée, ou variabilité à court terme < 3 ms au RCF informatisé, ou décélérations. Surveillance toutes les 12 heures ; naissance proposée à partir de 26 SA, par césarienne.\n\nREPÈRES ISUOG 2020 :\n- Onde a du DV nulle ou inversée, ou RCF informatisé pathologique : naissance à partir de 26 SA.\n- REDF ombilical : naissance au plus tard vers 30–32 SA. AEDF ombilical : au plus tard vers 32–34 SA.\n- RCF tardif avec IP AO > 95e percentile : naissance entre 36 et 38 SA. Avec redistribution cérébrale isolée : vers 38 SA, sans dépasser 39 SA.\n- PAG isolé à Doppler normaux : naissance à partir de 38 SA, sans dépasser 39 SA.\n\nUn Doppler ombilical nul ou inversé, ou un DV anormal, impose une évaluation urgente quel que soit le percentile du PFE.\nAvant toute naissance prématurée programmée : corticothérapie anténatale et sulfate de magnésium à visée neuroprotectrice selon l'âge gestationnel, naissance en maternité de niveau adapté. Avant 26 SA, la décision est individualisée avec les parents.",
  },
  {
    id: "pe-depistage-aspirine",
    pathologyIds: ["OB-20", "EC-01"],
    source: "FIGO 2019 (Poon) · ASPRE (Rolnik, NEJM 2017) · ISSHP 2021",
    domain: "OBST",
    topic: "PE",
    title: "Prééclampsie — dépistage du 1er trimestre et prévention par aspirine",
    year: 2021,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["prééclampsie", "PE", "dépistage", "screening", "ASPRE", "aspirine", "prévention", "PlGF", "PAPP-A", "MoM", "artères utérines", "risque", "T1", "premier trimestre", "sFlt-1"],
    references: [
      main("FIGO", "Initiative on pre-eclampsia: a pragmatic guide for first-trimester screening and prevention (Poon)", 2019),
      main("ISSHP", "2021 classification, diagnosis and management recommendations (Magee)", 2022),
      main("Rolnik et al.", "Aspirin versus placebo in pregnancies at high risk for preterm preeclampsia (ASPRE, NEJM)", 2017),
      compl("NICE", "NG133 Hypertension in pregnancy", 2019),
      compl("ACOG", "PB 222 Gestational Hypertension and Preeclampsia", 2020),
    ],
    divergences: [
      "Dose d'aspirine : 150 mg le soir (FIGO 2019, ASPRE) ; 75–150 mg (NICE NG133) ; 81 mg (ACOG) ; 100–160 mg (pratique française).",
      "Mode de sélection : dépistage combiné pour toutes (FIGO, FMF) ; facteurs de risque cliniques (NICE, ACOG).",
      "Terme d'arrêt : 36 SA dans ASPRE ; variable selon les sociétés.",
    ],
    text: "DÉPISTAGE COMBINÉ DU 1ER TRIMESTRE (11 à 13+6 SA, algorithme FMF) : facteurs maternels + pression artérielle moyenne + IP moyen des artères utérines + PlGF (± PAPP-A), exprimés en multiples de la médiane (MoM). Les MoM dépendent des médianes du laboratoire, de l'automate et des caractéristiques maternelles : elles ne se recalculent pas à partir de médianes fixes.\n\nESSAI ASPRE (Rolnik 2017) : femmes à risque de PE prématurée > 1/100 selon l'algorithme ; aspirine 150 mg le soir, débutée entre 11 et 14 SA, poursuivie jusqu'à 36 SA. PE avant 37 SA : 1,6 % sous aspirine contre 4,3 % sous placebo (odds ratio 0,38). Pas de différence significative pour la PE à terme.\n\nFIGO 2019 : dépistage combiné proposé à toutes ; aspirine à faible dose le soir, débutée avant 16 SA, chez les femmes à haut risque.\n\nEN L'ABSENCE DE DÉPISTAGE COMBINÉ (listes NICE NG133 / ACOG) : haut risque = antécédent de PE, HTA chronique, diabète de type 1 ou 2, néphropathie chronique, lupus ou SAPL. Facteurs modérés (au moins 2) : nulliparité, âge maternel élevé, obésité, antécédent familial de PE, intervalle > 10 ans entre deux grossesses, grossesse multiple. Les seuils d'âge et d'IMC diffèrent entre NICE et ACOG.\n\nPlGF ou rapport sFlt-1/PlGF aux 2e et 3e trimestres : aide à écarter une PE en cas de suspicion clinique ; les seuils dépendent du test utilisé.",
  },
  {
    id: "pe-diagnostic-classification",
    pathologyIds: ["OB-20", "OB-19"],
    source: "ISSHP 2021 (Magee 2022) · RFE SFAR/CNGOF",
    domain: "OBST",
    topic: "PE",
    title: "Prééclampsie — définition ISSHP, formes sévères, HELLP",
    year: 2022,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["prééclampsie", "PE", "diagnostic", "HTA", "hypertension", "protéinurie", "sévère", "critères", "HELLP", "éclampsie", "définition", "ISSHP", "barre épigastrique"],
    references: [
      main("ISSHP", "2021 classification, diagnosis and management recommendations for international practice (Magee)", 2022),
      main("SFAR/CNGOF/SFMP/SFNN", "RFE Prise en charge multidisciplinaire des formes graves de prééclampsie", 2009),
      compl("ACOG", "PB 222 Gestational Hypertension and Preeclampsia", 2020),
      compl("NICE", "NG133 Hypertension in pregnancy", 2019),
    ],
    divergences: [
      "Seuils de traitement antihypertenseur en grossesse : positions de l'ISSHP, du NICE et de l'ESC différentes de celles de l'ACOG (comparaison publiée en 2022).",
      "L'ISSHP inclut la dysfonction utéro-placentaire dans la définition ; l'ACOG ne la retient pas.",
      "Thrombopénie : < 150 G/L (ISSHP) ; < 100 G/L (ACOG).",
      "Seuils chiffrés des critères de sévérité français : différents entre la RFE 2009 et son actualisation — vérifier la version en vigueur.",
    ],
    text: "DÉFINITION (ISSHP) : HTA apparue après 20 SA (PAS ≥ 140 et/ou PAD ≥ 90 mmHg, mesures répétées) associée à au moins un des éléments suivants :\n- protéinurie (rapport protéinurie/créatininurie ≥ 30 mg/mmol ou ≥ 0,3 g/24 h) ;\n- atteinte rénale (créatinine ≥ 90 µmol/L) ;\n- atteinte hépatique (transaminases élevées, douleur épigastrique ou de l'hypochondre droit) ;\n- atteinte neurologique (éclampsie, céphalées sévères persistantes, troubles visuels, clonus) ;\n- atteinte hématologique (plaquettes < 150 G/L, hémolyse, CIVD) ;\n- dysfonction utéro-placentaire (restriction de croissance, Doppler ombilical anormal, mort fœtale).\nLa protéinurie n'est pas indispensable au diagnostic. HTA sévère : PAS ≥ 160 et/ou PAD ≥ 110 mmHg.\n\nFORMES SÉVÈRES (critères utilisés en France, RFE SFAR/CNGOF) : HTA sévère ; atteinte rénale (oligurie, élévation de la créatinine, protéinurie massive) ; œdème aigu du poumon ; douleur épigastrique en barre persistante ; HELLP ; signes neurologiques persistants ou éclampsie ; hématome rétroplacentaire ; retentissement fœtal.\n\nHELLP : hémolyse (LDH élevées, schizocytes, haptoglobine effondrée) + cytolyse hépatique + thrombopénie < 100 G/L.\n\nLe risque de complications persiste dans le post-partum (HTA, éclampsie, HELLP).",
  },
  {
    id: "pe-severe-prise-en-charge",
    pathologyIds: ["OB-20", "OB-60", "OB-76"],
    source: "RFE SFAR/CNGOF · ISSHP 2021 · OMS 2011",
    domain: "OBST",
    topic: "PE",
    title: "Prééclampsie sévère — principes de prise en charge",
    year: 2022,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["prééclampsie", "PE", "sévère", "urgence", "MgSO4", "sulfate de magnésium", "nicardipine", "labétalol", "antihypertenseur", "extraction", "éclampsie", "antidote", "calcium", "corticothérapie"],
    references: [
      main("SFAR/CNGOF/SFMP/SFNN", "RFE Prise en charge multidisciplinaire des formes graves de prééclampsie", 2009),
      main("ISSHP", "2021 recommendations (Magee)", 2022),
      main("CNGOF", "RPC Urgences vitales maternelles", 2025, true),
      compl("OMS", "Recommendations for prevention and treatment of pre-eclampsia and eclampsia", 2011),
    ],
    divergences: [
      "Cible tensionnelle : PAD 85 mmHg (ISSHP) ; maintien sous les seuils de sévérité sans baisse brutale (pratique française).",
      "Sulfate de magnésium en prévention primaire : indication plus large pour l'OMS et l'ISSHP que dans les RFE françaises.",
    ],
    text: "PRÉÉCLAMPSIE SÉVÈRE — PRINCIPES (les posologies sont celles du protocole du service) :\n1. Hospitalisation en maternité de niveau adapté au terme ; surveillance maternelle rapprochée (PA, conscience, réflexes, diurèse, SpO2) ; bilan répété (NFS-plaquettes, transaminases, créatinine, hémostase, LDH/haptoglobine) ; RCF.\n2. HTA sévère (PAS ≥ 160 et/ou PAD ≥ 110 mmHg) : urgence thérapeutique. Antihypertenseur d'action rapide : nicardipine, labétalol ou urapidil IV en pratique française ; nifédipine orale, labétalol IV ou hydralazine selon l'ISSHP. Éviter une baisse brutale de la pression artérielle.\n3. Sulfate de magnésium (MgSO4) : traitement de la crise d'éclampsie et prévention de sa récidive ; prévention primaire en cas de PE sévère avec signes neurologiques. Schéma usuel : dose de charge 4 g IV en 20 minutes puis 1 g/h. Surveillance : réflexes ostéotendineux, fréquence respiratoire, diurèse. Antidote : gluconate de calcium IV.\n4. Corticothérapie anténatale si une naissance avant 34 SA est envisagée.\n5. Naissance = seul traitement étiologique. PE non sévère : naissance à partir de 37 SA. PE sévère à partir de 34 SA : naissance. PE sévère avant 34 SA : expectative possible sous surveillance stricte en l'absence de complication ; naissance sans délai en cas d'éclampsie, HRP, OAP, HTA non contrôlée, HELLP évolutif ou anomalies sévères du RCF.\n6. Remplissage vasculaire prudent (risque d'OAP). Surveillance poursuivie en post-partum.",
  },
  {
    id: "fmf-t21-algorithm",
    pathologyIds: ["OB-08", "EC-01"],
    source: "HAS 2017 · FMF · ACOG PB 226",
    domain: "OBST",
    topic: "T21",
    title: "Dépistage de la trisomie 21 — dépistage combiné du 1er trimestre et ADN libre circulant",
    year: 2020,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["T21", "trisomie 21", "dépistage", "NT", "clarté nucale", "PAPP-A", "hCG", "risque", "FMF", "os nasal", "DV", "ductus", "tricuspide", "ADN libre circulant", "cfDNA", "DPNI", "caryotype"],
    references: [
      main("HAS", "Place des tests ADN libre circulant dans le sang maternel dans le dépistage de la trisomie 21 fœtale", 2017),
      main("ABM", "Arrêtés et rapports annuels sur le diagnostic prénatal"),
      compl("ACOG", "PB 226 Screening for Fetal Chromosomal Abnormalities", 2020),
      compl("ISPD", "Position statements sur le cfDNA", 2023),
      compl("FMF", "Clarté nucale, dépistage combiné et algorithmes de risque"),
    ],
    divergences: ["Seuils d'orientation français (1/50 et 1/1000, HAS 2017) différents des stratégies ACOG/ISPD, qui proposent l'ADN libre circulant à toutes les patientes."],
    text: "DÉPISTAGE COMBINÉ DU 1ER TRIMESTRE (11+0 à 13+6 SA) : âge maternel + clarté nucale (LCC 45–84 mm) + PAPP-A et β-hCG libre exprimées en MoM. Le risque est calculé par un logiciel agréé avec les médianes du laboratoire ; il ne se reconstitue pas à la main.\nProfils évocateurs : T21 = clarté nucale augmentée, β-hCG libre élevée, PAPP-A basse ; T18/T13 = β-hCG libre et PAPP-A basses.\nMarqueurs échographiques additionnels (centres experts, FMF) : os nasal, flux du ductus venosus (DV), flux tricuspide.\n\nCONDUITE SELON LE RISQUE (HAS 2017, France) :\n- risque ≥ 1/50 : caryotype fœtal proposé d'emblée (un test ADN libre circulant reste possible si la patiente le préfère) ;\n- risque entre 1/51 et 1/1000 : test ADN libre circulant (DPNI) proposé ; s'il est positif, confirmation par caryotype fœtal indispensable ;\n- risque < 1/1000 : poursuite du suivi habituel.\nClarté nucale ≥ 3,5 mm ou anomalie morphologique : prélèvement invasif avec analyse chromosomique sur puce à ADN proposé, quel que soit le risque calculé.\n\nPERFORMANCES : dépistage combiné ≈ 85–90 % de détection de la T21 pour 5 % de faux positifs ; ADN libre circulant > 99 % de détection pour moins de 0,1 % de faux positifs, mais il reste un test de dépistage (échecs de test, faux positifs par mosaïque placentaire).",
  },
  {
    id: "rcog-vte-prophylaxie",
    pathologyIds: ["OB-26", "OB-79"],
    source: "RCOG GTG 37a (2015)",
    domain: "OBST",
    topic: "VTE",
    title: "Thromboprophylaxie pendant la grossesse et le post-partum — score RCOG GTG 37a",
    year: 2015,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["VTE", "MTEV", "TVP", "thrombose", "HBPM", "prophylaxie", "RCOG", "risque", "embolie", "score", "énoxaparine", "SAPL", "thrombophilie", "post-partum"],
    references: [
      main("RCOG", "GTG 37a Reducing the Risk of Venous Thromboembolism during Pregnancy and the Puerperium", 2015),
      compl("ASH", "Guidelines: venous thromboembolism in the context of pregnancy", 2018),
      compl("ACOG", "PB 196 Thromboembolism in Pregnancy", 2018),
      compl("ESC", "2025 Guidelines for the management of cardiovascular disease and pregnancy", 2025, true),
    ],
    divergences: ["Les recommandations françaises raisonnent par niveaux de risque et non avec ce score ; l'ASH est plus restrictive sur la prophylaxie anténatale. À confronter au protocole local."],
    text: "RCOG GTG 37a (2015) — ÉVALUATION DU RISQUE (à refaire en début de grossesse, à chaque hospitalisation, en per- et post-partum).\n\nFACTEURS PRÉEXISTANTS : antécédent de MTEV (hors épisode unique lié à une chirurgie majeure) 4 points ; antécédent de MTEV provoquée par une chirurgie majeure 3 ; thrombophilie à haut risque connue 3 ; comorbidité médicale (cancer, insuffisance cardiaque, lupus actif, maladie inflammatoire, syndrome néphrotique, diabète de type 1 avec néphropathie, drépanocytose…) 3 ; antécédent familial au 1er degré de MTEV non provoquée ou liée aux estrogènes 1 ; thrombophilie à bas risque sans MTEV 1 ; âge > 35 ans 1 ; IMC ≥ 30 : 1 ; IMC ≥ 40 : 2 ; parité ≥ 3 : 1 ; tabac 1 ; varices importantes 1.\nFACTEURS OBSTÉTRICAUX : prééclampsie en cours 1 ; AMP/FIV (anténatal seulement) 1 ; grossesse multiple 1 ; césarienne en cours de travail 2 ; césarienne programmée 1 ; extraction instrumentale à la partie moyenne ou avec rotation 1 ; travail > 24 h 1 ; hémorragie du post-partum > 1 L ou transfusion 1 ; accouchement avant 37 SA 1 ; mort fœtale in utero 1.\nFACTEURS TRANSITOIRES : chirurgie pendant la grossesse ou le post-partum 3 ; hyperémèse 3 ; syndrome d'hyperstimulation ovarienne (1er trimestre) 4 ; infection systémique 1 ; immobilisation ou déshydratation 1.\n\nSEUILS : total ≥ 4 en anténatal → HBPM dès le 1er trimestre ; total = 3 → HBPM à partir de 28 SA ; total ≥ 2 en post-partum → HBPM au moins 10 jours ; hospitalisation anténatale → envisager une thromboprophylaxie.\nAntécédent de MTEV, thrombophilie ou SAPL : avis spécialisé et schéma individualisé.\n\nDOSE PROPHYLACTIQUE D'ÉNOXAPARINE SELON LE POIDS (RCOG) : < 50 kg : 20 mg/j ; 50–90 kg : 40 mg/j ; 91–130 kg : 60 mg/j ; 131–170 kg : 80 mg/j ; > 170 kg : 0,6 mg/kg/j.\nAnesthésie périmédullaire : au moins 12 h après une dose prophylactique, 24 h après une dose curative.",
  },
  {
    id: "col-court-prematurite",
    pathologyIds: ["OB-58", "OB-57", "OB-60"],
    source: "CNGOF 2016 · ACOG PB 234 · ISUOG 2022",
    domain: "OBST",
    topic: "Prématurité",
    title: "Col court et menace d'accouchement prématuré — prévention, tocolyse, corticothérapie",
    year: 2022,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["col", "court", "cervical", "longueur", "prématurité", "MAP", "menace", "cerclage", "progestérone", "pessaire", "tocolyse", "atosiban", "nifédipine", "corticothérapie", "bétaméthasone", "sulfate de magnésium", "neuroprotection"],
    references: [
      main("CNGOF", "RPC Prévention de la prématurité spontanée et de ses conséquences (hors rupture des membranes)", 2016),
      main("ACOG", "PB 234 Prediction and Prevention of Spontaneous Preterm Birth", 2021),
      compl("ISUOG", "Practice Guidelines: role of ultrasound in the prediction of spontaneous preterm birth", 2022),
      compl("NICE", "NG25 Preterm labour and birth", 2019),
      compl("RCOG", "GTG 74 Antenatal Corticosteroids to Reduce Neonatal Morbidity", 2022),
    ],
    divergences: [
      "Seuil de col court pour la progestérone vaginale : < 20 mm (CNGOF 2016) ; ≤ 25 mm (ACOG PB 234).",
      "Borne supérieure de la corticothérapie : 34 SA (CNGOF) ; jusqu'à 34+6 SA, voire au-delà selon les cas (RCOG GTG 74, ACOG).",
    ],
    text: "LONGUEUR CERVICALE : mesure par échographie endovaginale. Col court au 2e trimestre : < 25 mm (seuil habituel).\n\nPRÉVENTION (grossesse unique) :\n- col court asymptomatique découvert au 2e trimestre : progestérone vaginale quotidienne jusqu'à 36 SA ;\n- antécédent d'accouchement prématuré spontané ou de fausse couche tardive et col < 25 mm avant 24 SA : cerclage écho-indiqué ;\n- au moins 3 antécédents de fausse couche tardive ou d'accouchement prématuré : cerclage sur antécédents (CNGOF 2016) ;\n- col ouvert avec membranes visibles au 2e trimestre : cerclage « à chaud » à discuter au cas par cas.\nGROSSESSE GÉMELLAIRE : ni progestérone, ni cerclage, ni pessaire en routine pour un col court isolé.\nLe repos strict au lit n'est pas recommandé.\n\nMENACE D'ACCOUCHEMENT PRÉMATURÉ (MAP, membranes intactes) :\n- tocolyse pour permettre la corticothérapie et le transfert in utero : atosiban ou nifédipine en première intention (CNGOF 2016) ; schéma de l'atosiban selon l'AMM : bolus 6,75 mg, puis 18 mg/h pendant 3 h, puis 6 mg/h jusqu'à 45 h ; pas de tocolyse d'entretien ;\n- corticothérapie anténatale avant 34 SA (bétaméthasone 12 mg IM, 2 injections à 24 h d'intervalle) ;\n- sulfate de magnésium à visée neuroprotectrice si naissance imminente avant 32 SA (dose de charge 4 g puis 1 g/h pendant 12 h au maximum, CNGOF 2016) ;\n- transfert in utero vers une maternité de niveau adapté.",
  },
  {
    id: "ohss-classification-prevention",
    pathologyIds: ["PM-09", "GY-42"],
    source: "RCOG GTG 5 (2016) · ESHRE stimulation ovarienne (2019 ; mise à jour 2025)",
    domain: "PMA",
    topic: "OHSS",
    title: "Syndrome d'hyperstimulation ovarienne — classification RCOG, prévention, prise en charge",
    year: 2025,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    reviewNote: "Rédigée d'après ESHRE 2019 ; à relire sur la mise à jour ESHRE 2025, version à privilégier selon le référentiel.",
    keywords: ["OHSS", "SHO", "hyperstimulation", "ovarienne", "CFA", "AMH", "agoniste", "antagoniste", "freeze-all", "cabergoline", "albumine", "coasting", "trigger", "déclenchement", "ascite"],
    references: [
      main("RCOG", "GTG 5 The Management of Ovarian Hyperstimulation Syndrome", 2016),
      main("ESHRE", "Ovarian stimulation for IVF/ICSI: guideline update 2025", 2025, true),
      compl("ASRM", "Prevention and treatment of moderate and severe ovarian hyperstimulation syndrome", 2016),
    ],
    text: "CLASSIFICATION (RCOG GTG 5, 2016) :\nLÉGER : ballonnement, douleur abdominale légère, ovaires en général < 8 cm.\nMODÉRÉ : douleur modérée, nausées ± vomissements, ascite échographique, ovaires en général de 8 à 12 cm.\nSÉVÈRE : ascite clinique (± hydrothorax), oligurie (< 300 mL/j ou < 30 mL/h), hématocrite > 0,45, hyponatrémie (< 135 mmol/L), hyperkaliémie (> 5 mmol/L), hypoprotidémie (albumine < 35 g/L), ovaires en général > 12 cm.\nCRITIQUE : ascite sous tension ou hydrothorax abondant, hématocrite > 0,55, leucocytes > 25 G/L, oligo-anurie, thrombose, SDRA.\n\nFACTEURS DE RISQUE : SOPK, AMH élevée, compte folliculaire antral (CFA) élevé, antécédent de SHO, grand nombre de follicules en fin de stimulation ou d'ovocytes recueillis, grossesse (forme tardive).\n\nPRÉVENTION (ESHRE) : protocole antagoniste de la GnRH chez les patientes à risque de forte réponse ; dose de gonadotrophines réduite ; déclenchement par agoniste de la GnRH avec congélation de tous les embryons (freeze-all) — possible uniquement si l'hypophyse n'est pas désensibilisée (protocole antagoniste ou sous progestatif) ; agoniste dopaminergique (cabergoline) autour du déclenchement. Le coasting et la perfusion d'albumine ne sont pas des mesures de prévention recommandées.\n\nPRISE EN CHARGE : formes légères et modérées en ambulatoire avec surveillance (poids, périmètre abdominal, diurèse, biologie) ; hospitalisation des formes sévères ; correction hydroélectrolytique ; thromboprophylaxie par HBPM ; ponction d'ascite en cas d'ascite sous tension, de gêne respiratoire ou d'oligurie persistante ; pas de diurétiques en cas d'hypovolémie.",
  },
  {
    id: "poseidon-classification",
    pathologyIds: ["PM-02", "PM-06"],
    source: "Groupe POSEIDON 2016 · ESHRE (critères de Bologne 2011 ; stimulation ovarienne)",
    domain: "PMA",
    topic: "POSEIDON",
    title: "POSEIDON et critères de Bologne — patientes à faible pronostic en FIV",
    year: 2016,
    evidence: "Classification de consensus d'experts",
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["POSEIDON", "POR", "mauvaise", "réponse", "faible pronostic", "Bologne", "ovocyte", "FIV", "AMH", "CFA", "DuoStim", "FSH", "DHEA", "réserve ovarienne"],
    references: [
      main("POSEIDON Group", "A new more detailed stratification of low responders to ovarian stimulation (Alviggi, Fertil Steril)", 2016),
      main("ESHRE", "Consensus on the definition of poor response to ovarian stimulation: the Bologna criteria (Ferraretti)", 2011),
      compl("ESHRE", "Ovarian stimulation for IVF/ICSI: guideline update 2025", 2025, true),
      compl("ASRM", "Testing and interpreting measures of ovarian reserve", 2015),
    ],
    text: "CLASSIFICATION POSEIDON (2016) — patientes à faible pronostic en FIV :\nGroupe 1 : < 35 ans, réserve ovarienne correcte (CFA ≥ 5 et AMH ≥ 1,2 ng/mL), réponse antérieure inattendue faible (< 4 ovocytes, sous-groupe 1a) ou sous-optimale (4 à 9 ovocytes, sous-groupe 1b).\nGroupe 2 : ≥ 35 ans, mêmes paramètres de réserve, réponse inattendue faible (2a) ou sous-optimale (2b).\nGroupe 3 : < 35 ans, réserve diminuée (CFA < 5, AMH < 1,2 ng/mL).\nGroupe 4 : ≥ 35 ans, réserve diminuée (CFA < 5, AMH < 1,2 ng/mL).\nLes groupes 1 et 2 supposent une stimulation antérieure ; sans cycle antérieur, seuls les groupes 3 et 4 peuvent être attribués.\n\nCRITÈRES DE BOLOGNE (ESHRE 2011) de mauvaise réponse ovarienne, au moins 2 sur 3 : âge ≥ 40 ans ou autre facteur de risque de mauvaise réponse ; antécédent de mauvaise réponse (≤ 3 ovocytes sous stimulation conventionnelle) ; bilan de réserve altéré (CFA < 5–7 ou AMH < 0,5–1,1 ng/mL). Le SOPK n'est pas un facteur de risque de mauvaise réponse.\n\nSTRATÉGIE : aucun protocole n'a démontré sa supériorité ; l'ESHRE ne recommande pas de dépasser 300 UI/j de gonadotrophines ni d'utiliser en routine des adjuvants (DHEA, testostérone, hormone de croissance). La double stimulation (DuoStim) est une option d'accumulation ovocytaire dans des situations sélectionnées.",
  },
  {
    id: "iota-adnex-malignite",
    pathologyIds: ["GY-19", "EC-07", "ON-06"],
    source: "IOTA (Timmerman 2008 ; Van Calster, BMJ 2014) · ESGO/ISUOG/IOTA/ESGE 2021",
    domain: "GYN",
    topic: "Masse annexielle",
    title: "IOTA — règles simples et modèle ADNEX pour les masses annexielles",
    year: 2021,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["ADNEX", "IOTA", "kyste", "ovarien", "malignité", "CA-125", "borderline", "bénin", "malin", "végétations", "papilles", "ascite", "règles simples", "simple rules", "masse annexielle", "uniloculaire", "Doppler", "ombres", "tissu solide"],
    references: [
      main("IOTA", "Simple Rules (Timmerman, Ultrasound Obstet Gynecol)", 2008),
      main("IOTA", "ADNEX model (Van Calster, BMJ)", 2014),
      main("ESGO/ISUOG/IOTA/ESGE", "Consensus statement on pre-operative diagnosis of ovarian tumors", 2021, true),
      compl("RCOG", "GTG 62 (2011) et GTG 34 (2016) — masses ovariennes", 2016),
    ],
    text: "RÈGLES SIMPLES IOTA (Timmerman 2008) :\nCritères B (bénins) : B1 kyste uniloculaire ; B2 composante solide de plus grand diamètre < 7 mm ; B3 cônes d'ombre acoustiques ; B4 tumeur multiloculaire lisse < 100 mm ; B5 absence de flux Doppler (score couleur 1).\nCritères M (malins) : M1 tumeur solide irrégulière ; M2 ascite ; M3 au moins 4 végétations (projections papillaires) ; M4 tumeur multiloculaire-solide irrégulière ≥ 100 mm ; M5 flux Doppler très abondant (score couleur 4).\nLecture : au moins un critère M sans critère B = malin ; au moins un critère B sans critère M = bénin ; critères B et M associés ou aucun critère = non concluant → modèle ADNEX ou échographie de référence.\n\nMODÈLE ADNEX (Van Calster 2014) — 9 variables : âge, CA-125 sérique, type de centre (oncologique ou non), diamètre maximal de la lésion, proportion de tissu solide, nombre de végétations (0, 1, 2, 3, plus de 3), plus de 10 logettes, cônes d'ombre, ascite.\nRésultat : probabilités de 5 catégories (bénin, borderline, cancer de stade I, cancer de stades II–IV, métastase ovarienne). Un risque total de malignité ≥ 10 % est le seuil le plus utilisé pour orienter vers un centre d'oncologie gynécologique.\nLe calcul se fait avec le calculateur officiel IOTA ; une formule simplifiée ne le remplace pas.\n\nORIENTATION (consensus ESGO/ISUOG/IOTA/ESGE 2021) : lésion bénigne → surveillance ou chirurgie conservatrice selon les symptômes ; lésion indéterminée → échographie de référence et/ou IRM ; suspicion de malignité → centre expert, en évitant la rupture et le morcellement.",
  },
  {
    id: "roma-score",
    pathologyIds: ["GY-19", "ON-06"],
    source: "Moore 2009 (Gynecol Oncol)",
    domain: "GYN",
    topic: "Cancer ovaire",
    title: "ROMA — Risk of Ovarian Malignancy Algorithm et seuils selon la technique de dosage",
    year: 2009,
    evidence: "Étude de développement et validations ultérieures",
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["ROMA", "HE4", "CA-125", "malignité", "cancer", "ovaire", "pré-ménopause", "post-ménopause", "seuil", "algorithme", "formule", "Elecsys", "Architect"],
    references: [
      main("Moore et al.", "A novel multiple marker bioassay utilizing HE4 and CA125 for the prediction of ovarian cancer in patients with a pelvic mass (Gynecol Oncol)", 2009),
      compl("ESGO/ISUOG/IOTA/ESGE", "Consensus statement on pre-operative diagnosis of ovarian tumors", 2021, true),
    ],
    text: "ROMA (Moore 2009) — combine HE4 (pmol/L) et CA-125 (U/mL) selon le statut ménopausique :\nPré-ménopause : IP = −12,0 + 2,38 × ln(HE4) + 0,0626 × ln(CA-125)\nPost-ménopause : IP = −8,09 + 1,04 × ln(HE4) + 0,732 × ln(CA-125)\nROMA (%) = exp(IP) / [1 + exp(IP)] × 100\n\nSEUILS DE HAUT RISQUE — ils dépendent de la technique de dosage et ne doivent pas être mélangés :\n- Roche Elecsys : ≥ 11,4 % en pré-ménopause ; ≥ 29,9 % en post-ménopause.\n- Abbott Architect : ≥ 7,4 % en pré-ménopause ; ≥ 25,3 % en post-ménopause.\n- Fujirebio (EIA manuel) : ≥ 13,1 % en pré-ménopause ; ≥ 27,7 % en post-ménopause.\n\nLIMITES : HE4 augmente avec l'âge, le tabac et l'insuffisance rénale ; ROMA n'est pas adapté aux tumeurs non épithéliales, borderline ou mucineuses ; il complète l'échographie (IOTA) sans la remplacer.",
  },
  {
    id: "eshre-endometriose-2022",
    pathologyIds: ["GY-16", "GY-17", "PM-12", "EC-07"],
    source: "ESHRE 2022 · CNGOF–HAS 2017",
    domain: "GYN",
    topic: "Endométriose",
    title: "Endométriose — diagnostic, classifications, traitement de la douleur et de l'infertilité",
    year: 2022,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["endométriose", "diagnostic", "échographie", "IRM", "cœlioscopie", "laparoscopie", "rASRM", "Enzian", "EFI", "diénogest", "chirurgie", "douleur", "infertilité", "endométriome", "AMH", "ESHRE"],
    references: [
      main("ESHRE", "Guideline Endometriosis", 2022, true),
      main("CNGOF–HAS", "RPC Prise en charge de l'endométriose", 2017),
      main("CNGOF", "RPC Imagerie de l'endométriose ; RPC Douleurs associées à l'endométriose", 2025, true),
      compl("NICE", "NG73 Endometriosis: diagnosis and management (actualisé novembre 2024)", 2024, true),
    ],
    text: "ENDOMÉTRIOSE (ESHRE 2022 ; CNGOF–HAS 2017) :\nSYMPTÔMES ÉVOCATEURS : dysménorrhée intense, dyspareunie profonde, douleurs pelviennes chroniques, dyschésie ou signes urinaires cataméniaux, infertilité.\n\nDIAGNOSTIC : examen clinique puis imagerie — échographie endovaginale en première intention, IRM pelvienne en seconde intention ou pour le bilan d'extension. La cœlioscopie diagnostique n'est plus l'examen de référence obligatoire ; elle est réservée aux cas où l'imagerie est négative et où le traitement empirique échoue ou est inadapté. Une imagerie normale n'exclut pas une endométriose superficielle. Aucun biomarqueur n'est recommandé.\n\nCLASSIFICATIONS : rASRM (stades I–IV, chirurgicale), #Enzian (endométriose profonde), EFI (pronostic de fertilité après chirurgie).\n\nDOULEUR — TRAITEMENT MÉDICAL : antalgiques et AINS ; traitements hormonaux : contraception estroprogestative, progestatifs (dont diénogest et SIU au lévonorgestrel) ; agonistes de la GnRH avec add-back therapy ou antagonistes de la GnRH en seconde intention.\n\nCHIRURGIE : option pour la douleur. Endométriome : kystectomie préférée au drainage ou à la coagulation, en tenant compte du risque pour la réserve ovarienne (évaluation avant chirurgie). Endométriose profonde : centre expert pluridisciplinaire.\n\nINFERTILITÉ : pas de traitement hormonal suppresseur dans le but d'améliorer la fertilité ; la cœlioscopie opératoire peut être proposée aux stades I–II ; AMP selon l'âge, la réserve ovarienne, la durée d'infertilité et les autres facteurs ; pas de chirurgie systématique de l'endométriome avant AMP.",
  },
  {
    id: "uterus-cicatriciel-tvbac",
    pathologyIds: ["OB-69", "OB-74"],
    source: "CNGOF 2012 · ACOG PB 205 · RCOG GTG 45",
    domain: "OBST",
    topic: "AVAC",
    title: "Utérus cicatriciel — tentative de voie basse (AVAC/TOLAC), scores, segment inférieur, rupture",
    year: 2019,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["AVAC", "TOLAC", "TVBAC", "utérus", "cicatriciel", "césarienne", "rupture", "Flamm", "Geiger", "MFMU", "Grobman", "LUS", "segment inférieur", "épaisseur", "éligibilité", "score", "déclenchement"],
    references: [
      main("CNGOF", "RPC Accouchement en cas d'utérus cicatriciel", 2012),
      main("ACOG", "PB 205 Vaginal Birth After Cesarean Delivery", 2019),
      main("RCOG", "GTG 45 Birth after Previous Caesarean Birth", 2015),
      compl("Flamm & Geiger", "Vaginal birth after cesarean delivery: an admission scoring system (Obstet Gynecol)", 1997),
      compl("Grobman et al.", "Development of a nomogram for prediction of vaginal birth after cesarean delivery (Obstet Gynecol)", 2007),
      compl("Rozenberg et al.", "Ultrasonographic measurement of lower uterine segment to assess risk of defects of scarred uterus (Lancet)", 1996),
    ],
    divergences: ["Utérus bicicatriciel : tentative de voie basse possible au cas par cas (CNGOF 2012, ACOG) ; attitudes locales variables."],
    text: "UTÉRUS CICATRICIEL (CNGOF 2012) :\nLa tentative de voie basse après césarienne est possible en cas d'utérus unicicatriciel avec cicatrice segmentaire transversale. Taux de succès de l'ordre de 75 % ; risque de rupture utérine de l'ordre de 0,2 à 0,8 % en travail spontané, augmenté en cas de déclenchement.\nCésarienne programmée recommandée : cicatrice corporéale, antécédent de rupture utérine, antécédent d'au moins 3 césariennes.\nFacteurs favorables : antécédent d'accouchement par voie basse (surtout après la césarienne), travail spontané, col favorable. Facteurs défavorables : obésité, âge maternel élevé, macrosomie, indication récurrente de la première césarienne, déclenchement.\nDéclenchement : ocytocine possible avec prudence ; le misoprostol est contre-indiqué sur utérus cicatriciel.\nConditions : information et accord de la patiente, RCF continu pendant le travail, accès immédiat à la césarienne.\n\nSCORE DE FLAMM & GEIGER (1997, à l'admission en travail) : âge < 40 ans 2 points ; antécédent de voie basse : avant et après la césarienne 4, après la césarienne 2, avant la césarienne 1, aucun 0 ; indication de la première césarienne autre que la stagnation de la dilatation 1 ; effacement du col > 75 % : 2, 25–75 % : 1, < 25 % : 0 ; dilatation ≥ 4 cm : 1. Total de 0 à 10. Taux de succès observés : 0–2 : 49 % ; 3 : 60 % ; 4 : 67 % ; 5 : 77 % ; 6 : 88 % ; 7 : 93 % ; 8–10 : 95 %.\nMODÈLE MFMU (Grobman 2007 ; actualisé en 2021 sans variable ethnique) : probabilité de succès estimée dès la première consultation prénatale.\n\nÉPAISSEUR DU SEGMENT INFÉRIEUR (LUS) : la mesure échographique est corrélée au risque de défect de la cicatrice (Rozenberg 1996 : risque faible au-delà de 3,5 mm), mais aucun seuil n'est validé ; le CNGOF 2012 ne recommande pas de fonder le choix de la voie d'accouchement sur cette mesure.\n\nRUPTURE UTÉRINE — signes d'alerte : anomalies brutales du RCF (bradycardie), douleur persistant entre les contractions, arrêt des contractions, métrorragies, ascension de la présentation, instabilité hémodynamique. Conduite : laparotomie en urgence.",
  },
  {
    id: "diabete-gestationnel-depistage",
    pathologyIds: ["OB-21"],
    source: "CNGOF/SFD 2010 · IADPSG 2010 · OMS 2013",
    domain: "OBST",
    topic: "GDM",
    title: "Diabète gestationnel — dépistage ciblé, critères IADPSG, prise en charge",
    year: 2013,
    evidence: NOT_GRADED,
    status: "en_revision",
    reviewStatus: "unreviewed",
    reviewNote: "Rédigée d'après la RPC CNGOF/SFD 2010. La RPC CNGOF « Diabète et grossesse » 2025 est la version à privilégier selon le référentiel : fiche à réviser sur ce texte.",
    keywords: ["GDM", "DG", "diabète", "gestationnel", "HGPO", "glycémie", "IADPSG", "insuline", "dépistage", "objectifs", "accouchement", "macrosomie", "post-partum"],
    references: [
      main("CNGOF", "RPC Diabète et grossesse", 2025, true),
      main("CNGOF/SFD", "RPC Le diabète gestationnel", 2010),
      main("IADPSG", "Recommendations on the diagnosis and classification of hyperglycemia in pregnancy", 2010),
      compl("OMS", "Diagnostic criteria and classification of hyperglycaemia first detected in pregnancy", 2013),
      compl("ADA", "Standards of Care in Diabetes — Management of Diabetes in Pregnancy (annuel)"),
    ],
    divergences: [
      "Dépistage ciblé sur facteurs de risque (France) ; universel en une étape (IADPSG/OMS) ; en deux étapes (ACOG).",
      "Seuil de la glycémie à jeun du 1er trimestre discuté ; position française actualisée dans la RPC CNGOF 2025.",
    ],
    text: "DIABÈTE GESTATIONNEL (RPC CNGOF/SFD 2010) :\nDÉPISTAGE CIBLÉ en présence d'au moins un facteur de risque : âge ≥ 35 ans, IMC ≥ 25 kg/m², antécédent de diabète gestationnel, antécédent de macrosomie, antécédent de diabète chez un apparenté au 1er degré.\n- 1er trimestre : glycémie à jeun. ≥ 0,92 g/L (5,1 mmol/L) = diabète gestationnel ; ≥ 1,26 g/L (7,0 mmol/L) = diabète de type 2 méconnu.\n- 24–28 SA (si non fait ou normal) : HGPO 75 g. Diabète gestationnel si au moins une valeur est atteinte : à jeun ≥ 0,92 g/L (5,1 mmol/L) ; à 1 h ≥ 1,80 g/L (10,0 mmol/L) ; à 2 h ≥ 1,53 g/L (8,5 mmol/L) — critères IADPSG/OMS.\n\nOBJECTIFS D'AUTOSURVEILLANCE : à jeun < 0,95 g/L (5,3 mmol/L) ; 2 h après le repas < 1,20 g/L (6,7 mmol/L).\n\nTRAITEMENT : mesures diététiques et activité physique ; insuline si les objectifs ne sont pas atteints après 7 à 10 jours. Les antidiabétiques oraux n'ont pas l'AMM pendant la grossesse en France.\n\nNAISSANCE : diabète équilibré sans retentissement fœtal → prise en charge habituelle ; diabète mal équilibré ou retentissement fœtal → déclenchement vers 39 SA ; césarienne proposée si le poids fœtal estimé dépasse 4 250–4 500 g.\n\nPOST-PARTUM : dépistage du diabète de type 2 à la consultation post-natale, avant une nouvelle grossesse, puis tous les 1 à 3 ans.",
  },
  {
    id: "prolapsus-popq",
    pathologyIds: ["GY-37", "OB-80"],
    source: "POP-Q (Bump 1996, ICS/IUGA) · HAS 2021 · NICE NG123",
    domain: "GYN",
    topic: "Prolapsus",
    title: "Prolapsus génital — classification POP-Q, PFDI-20, prise en charge",
    year: 2021,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["prolapsus", "POP-Q", "cystocèle", "rectocèle", "hystérocèle", "stade", "pessaire", "chirurgie", "promontofixation", "rééducation", "PFDI"],
    references: [
      main("IUGA/ICS", "Joint report on terminology for female pelvic floor dysfunction ; POP-Q (Bump 1996)", 2010),
      main("ANSM/HAS", "Prolapsus génital de la femme : prise en charge thérapeutique ; prothèses de renfort", 2021),
      main("NICE", "NG123 Urinary incontinence and pelvic organ prolapse in women: management", 2019),
      compl("ACOG", "PB 214 Pelvic Organ Prolapse", 2019),
    ],
    text: "POP-Q : points mesurés en centimètres par rapport à l'hymen (0), en poussée maximale ; valeurs négatives au-dessus de l'hymen, positives au-dessous. Paroi antérieure : Aa, Ba. Apex : C (col ou fond vaginal), D (cul-de-sac postérieur). Paroi postérieure : Ap, Bp. Mesures associées : hiatus génital, corps périnéal, longueur vaginale totale (LVT).\n\nSTADES : 0 = pas de prolapsus ; I = point le plus bas à plus de 1 cm au-dessus de l'hymen ; II = entre −1 et +1 cm ; III = à plus de 1 cm sous l'hymen sans éversion complète (< LVT − 2 cm) ; IV = éversion complète (≥ LVT − 2 cm).\n\nPFDI-20 (Barber 2005) : 3 sous-scores (POPDI-6, CRADI-8, UDI-6), total de 0 à 300 ; différence minimale cliniquement importante : 45 points.\n\nPRISE EN CHARGE (HAS 2021, NICE NG123) : ne traiter que les prolapsus symptomatiques. Première intention : mesures hygiéno-diététiques, rééducation périnéale, pessaire. Chirurgie en cas d'échec ou de refus du traitement conservateur : réparation par voie vaginale avec tissus autologues, ou promontofixation cœlioscopique pour l'étage apical ; l'usage des prothèses par voie vaginale est strictement encadré. Rechercher une incontinence urinaire associée ou masquée.",
  },
  {
    id: "minipiers-score",
    pathologyIds: ["OB-20"],
    source: "Payne et al. PLOS Medicine 2014",
    sourceUrl: "https://doi.org/10.1371/journal.pmed.1001589",
    reviewStatus: "source_checked",
    status: "en_vigueur",
    domain: "OBST",
    topic: "PE",
    title: "miniPIERS — pronostic maternel à 48 heures en cas de trouble hypertensif",
    year: 2014,
    evidence: "Étude de développement et validation ; applicabilité à vérifier",
    keywords: ["miniPIERS", "PIERS", "prééclampsie", "pronostic", "48h", "céphalées", "protéinurie"],
    references: [
      main("Payne et al.", "A risk prediction model for the assessment and triage of women with hypertensive disorders of pregnancy in low-resourced settings: the miniPIERS multi-country prospective cohort study (PLOS Medicine)", 2014),
    ],
    text: "Modèle miniPIERS de Payne et al. (2014) : estimation des complications maternelles dans les 48 heures suivant l'admission pour trouble hypertensif de la grossesse. Prédicteurs : parité, âge gestationnel, pression systolique, protéinurie à la bandelette, céphalées ou troubles visuels, douleur thoracique ou dyspnée, saignement vaginal avec douleur abdominale. Ne pas confondre avec fullPIERS, qui utilise des mesures biologiques et la saturation en oxygène. Un score inférieur au seuil de triage ne permet pas d'exclure une complication. La calibration et le contexte de mesure doivent être vérifiés avant utilisation locale.",
  },
  {
    id: "sopk-diagnostic-traitement",
    pathologyIds: ["GY-05", "PM-04"],
    source: "Recommandation internationale SOPK 2023 (Monash · ESHRE · ASRM · Endocrine Society)",
    domain: "GYN",
    topic: "SOPK",
    title: "SOPK — critères diagnostiques 2023, bilan, prise en charge et induction de l'ovulation",
    year: 2023,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["SOPK", "PCOS", "Rotterdam", "hyperandrogénie", "hirsutisme", "oligoménorrhée", "AMH", "CFA", "metformine", "létrozole", "clomifène", "induction", "ovulation", "anovulation"],
    references: [
      main("Monash/ESHRE/ASRM/Endocrine Society", "International evidence-based guideline for the assessment and management of polycystic ovary syndrome", 2023),
      compl("Endocrine Society", "Evaluation and treatment of hirsutism in premenopausal women", 2018),
      compl("NICE", "Polycystic ovary syndrome: assessment and management (en développement, attendu décembre 2026)", 2026, true),
    ],
    text: "SOPK — RECOMMANDATION INTERNATIONALE 2023 :\nDIAGNOSTIC CHEZ L'ADULTE (critères de Rotterdam actualisés), au moins 2 sur 3 après exclusion des autres causes :\n1. dysfonction ovulatoire (cycles de moins de 21 jours ou de plus de 35 jours, ou moins de 8 cycles par an) ;\n2. hyperandrogénie clinique (hirsutisme, acné, alopécie) ou biologique ;\n3. ovaires polykystiques à l'échographie (≥ 20 follicules par ovaire avec une sonde endovaginale haute fréquence, ou volume ovarien ≥ 10 mL) OU AMH élevée. Les seuils d'AMH dépendent de la technique de dosage : pas de seuil universel.\nSi cycles irréguliers et hyperandrogénie sont présents, ni l'échographie ni l'AMH ne sont nécessaires. Chez l'adolescente : cycles irréguliers ET hyperandrogénie sont requis ; ni échographie ni AMH.\n\nBILAN : testostérone totale et libre calculée ; exclusion des autres causes (TSH, prolactine, 17-OH-progestérone) ; évaluation métabolique : statut glycémique (HGPO 75 g de préférence), bilan lipidique, pression artérielle, IMC ; dépistage de l'anxiété et de la dépression. Le dosage de l'insulinémie n'est pas recommandé en routine.\n\nPRISE EN CHARGE : mode de vie ; contraception estroprogestative pour les troubles du cycle et l'hyperandrogénie ; metformine pour les anomalies métaboliques ; protection de l'endomètre en cas d'oligo-aménorrhée.\n\nINFERTILITÉ ANOVULATOIRE : létrozole en première intention (hors AMM selon les pays) ; clomifène ± metformine en alternative ; gonadotrophines ou drilling ovarien en deuxième intention ; FIV en troisième intention, avec protocole antagoniste et, en cas de risque de SHO, déclenchement par agoniste de la GnRH suivi d'une congélation embryonnaire.",
  },
  {
    id: "hrp-rupture-uterine",
    pathologyIds: ["OB-51", "OB-74"],
    source: "RCOG GTG 63 (2011) · CNGOF",
    domain: "OBST",
    topic: "Urgences obstétricales",
    title: "Hématome rétroplacentaire et rupture utérine — diagnostic et conduite en urgence",
    year: 2011,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["rupture", "utérine", "HRP", "hématome", "rétroplacentaire", "urgence", "placenta", "décollement", "CIVD", "fibrinogène", "hystérectomie", "choc", "métrorragies", "Sher"],
    references: [
      main("RCOG", "GTG 63 Antepartum Haemorrhage", 2011),
      main("CNGOF", "RPC Urgences vitales maternelles", 2025, true),
      compl("CNGOF/HAS", "RPC Hémorragies du post-partum", 2014),
      compl("OMS", "Managing Complications in Pregnancy and Childbirth (2e éd.)", 2017),
    ],
    text: "HÉMATOME RÉTROPLACENTAIRE (HRP) :\nTableau typique : douleur abdominale brutale, hypertonie utérine (« utérus de bois »), métrorragies noirâtres peu abondantes, anomalies du RCF ou mort fœtale. Le saignement peut être absent (hématome non extériorisé) et une échographie normale n'élimine pas le diagnostic.\nComplications : choc hémorragique, CIVD (fibrinogène < 2 g/L = signe de gravité), hémorragie du post-partum, insuffisance rénale.\nClassification de Sher : grade 1 = forme légère, souvent de diagnostic rétrospectif ; grade 2 = forme symptomatique avec fœtus vivant ; grade 3 = mort fœtale, sans (3a) ou avec (3b) coagulopathie.\nConduite : urgence. Fœtus vivant et viable : naissance rapide, le plus souvent par césarienne. Mort fœtale : voie basse privilégiée si l'état maternel le permet ; césarienne en cas d'instabilité maternelle ou d'hémorragie non contrôlée. Dans tous les cas : voies veineuses, bilan d'hémostase répété, correction de la coagulopathie (fibrinogène, plasma, plaquettes), prévention de l'hémorragie du post-partum, prévention de l'allo-immunisation Rh.\n\nRUPTURE UTÉRINE :\nFacteur de risque principal : utérus cicatriciel ; autres : déclenchement, grande multiparité, dystocie.\nSignes : anomalies brutales du RCF, douleur persistante, arrêt des contractions, métrorragies, ascension de la présentation, choc.\nConduite : laparotomie en urgence, extraction fœtale, suture utérine ou hystérectomie selon les lésions et l'état hémodynamique ; réanimation et transfusion.",
  },
  {
    id: "ctg-interpretation-figo2015",
    pathologyIds: ["OB-64"],
    source: "FIGO 2015 (Ayres-de-Campos) · CNGOF 2007",
    domain: "OBST",
    topic: "Monitoring fœtal",
    title: "CTG pendant le travail — classification FIGO 2015 et conduite à tenir",
    year: 2015,
    evidence: "Consensus d'experts FIGO",
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["CTG", "cardiotocographie", "monitoring", "rythme", "cardiaque", "fœtal", "RCF", "FCF", "décélération", "variabilité", "tachycardie", "bradycardie", "sinusoïdal", "FIGO"],
    references: [
      main("FIGO", "Consensus guidelines on intrapartum fetal monitoring: cardiotocography (Ayres-de-Campos)", 2015),
      main("CNGOF", "RPC Modalités de surveillance fœtale pendant le travail", 2007),
      main("NICE", "NG229 Fetal monitoring in labour", 2022),
      compl("NICHD", "Nomenclature du RCF", 2008),
    ],
    divergences: ["Trois classifications coexistent (FIGO 2015 à 3 niveaux, CNGOF 2007 à 5 niveaux de risque d'acidose, NICE NG229) : préciser celle qui est employée."],
    text: "CTG PENDANT LE TRAVAIL — CLASSIFICATION FIGO 2015 :\nNORMAL : rythme de base de 110 à 160 bpm ; variabilité de 5 à 25 bpm ; pas de décélérations répétées.\nSUSPECT : absence d'au moins un critère de normalité, sans critère pathologique.\nPATHOLOGIQUE : rythme de base < 100 bpm ; variabilité réduite (< 5 bpm) pendant plus de 50 minutes sur le rythme de base ou plus de 3 minutes pendant les décélérations ; variabilité augmentée (> 25 bpm) pendant plus de 30 minutes ; tracé sinusoïdal pendant plus de 30 minutes ; décélérations tardives ou prolongées répétées pendant plus de 30 minutes (plus de 20 minutes si la variabilité est réduite) ; ou une décélération prolongée de plus de 5 minutes.\nDécélérations « répétées » : associées à plus de 50 % des contractions. L'absence d'accélérations pendant le travail est de signification incertaine.\n\nCONDUITE (FIGO 2015) :\nSuspect : corriger les causes réversibles, surveillance rapprochée ou méthodes de seconde ligne.\nPathologique : action immédiate pour corriger les causes réversibles (hypercinésie → arrêt de l'ocytocine, tocolyse d'urgence ; compression aorto-cave → changement de position ; hypotension maternelle), méthodes de seconde ligne si elles sont disponibles, ou naissance rapide si la situation ne se corrige pas. Événement aigu (procidence du cordon, rupture utérine, HRP) : naissance immédiate.\nL'oxygénothérapie maternelle et le remplissage vasculaire ne sont pas recommandés en routine en l'absence d'hypoxie ou d'hypotension maternelle.",
  },
  {
    id: "fiv-stimulation-eshre",
    pathologyIds: ["PM-06", "PM-08", "PM-09"],
    source: "ESHRE stimulation ovarienne pour FIV/ICSI (2019 ; mise à jour 2025)",
    domain: "PMA",
    topic: "FIV",
    title: "FIV/ICSI — stimulation ovarienne, monitorage, déclenchement, ponction",
    year: 2025,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    reviewNote: "Rédigée d'après ESHRE 2019 ; à relire sur la mise à jour ESHRE 2025, version à privilégier selon le référentiel.",
    keywords: ["FIV", "ICSI", "stimulation", "FSH", "gonadotrophines", "antagoniste", "agoniste", "monitoring", "follicule", "trigger", "déclenchement", "hCG", "ponction", "freeze-all", "soutien lutéal", "progestérone"],
    references: [
      main("ESHRE", "Ovarian stimulation for IVF/ICSI: guideline update 2025", 2025, true),
      main("ABM", "Règles de bonnes pratiques cliniques et biologiques d'AMP"),
      compl("NICE", "NG257 Fertility problems: assessment and treatment", 2026, true),
      compl("ASRM", "Committee opinions (stimulation, antagonistes de la GnRH)"),
    ],
    text: "STIMULATION OVARIENNE POUR FIV/ICSI (ESHRE) :\nPRÉDICTION DE LA RÉPONSE : compte folliculaire antral ou AMH.\nPROTOCOLE : antagoniste de la GnRH en première intention (efficacité comparable au protocole agoniste long, moins de SHO), en particulier chez les patientes à risque de forte réponse (SOPK). L'antagoniste de la GnRH n'a pas sa place dans un protocole agoniste (long ou court).\nDOSE DE GONADOTROPHINES : forte réponse attendue → dose réduite ; réponse normale attendue → 150 à 225 UI/j ; faible réponse attendue → une dose supérieure à 150 UI/j peut être utilisée, sans bénéfice démontré au-delà de 300 UI/j (non recommandé).\nMONITORAGE : échographie folliculaire ± estradiol. Une progestérone élevée le jour du déclenchement fait discuter la congélation de tous les embryons (seuil dépendant du dosage).\nDÉCLENCHEMENT : hCG lorsque plusieurs follicules atteignent 16 à 22 mm. Déclenchement par agoniste de la GnRH : uniquement en protocole antagoniste ou sous progestatif (inefficace après désensibilisation hypophysaire par agoniste) ; recommandé en cas de risque de SHO, avec congélation de tous les embryons (freeze-all) ou soutien lutéal renforcé.\nPONCTION : environ 36 heures après le déclenchement.\nSOUTIEN LUTÉAL : progestérone débutée entre le soir de la ponction et le 3e jour suivant.",
  },
  {
    id: "fibromes-classification-figo",
    pathologyIds: ["GY-11", "GY-01", "PM-12"],
    source: "FIGO (Munro 2011, révision 2018) · ACOG PB 228 · ASRM 2017",
    domain: "GYN",
    topic: "Myomes",
    title: "Fibromes utérins — sous-classification FIGO (types 0 à 8), fertilité, traitement",
    year: 2021,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["myome", "fibrome", "léiomyome", "PALM-COEIN", "FIGO", "sous-muqueux", "intramural", "sous-séreux", "saignements", "ménorragies", "fertilité", "myomectomie", "résection", "embolisation"],
    references: [
      main("FIGO", "The two FIGO systems for normal and abnormal uterine bleeding symptoms and classification of causes of AUB (Munro)", 2018),
      main("ACOG", "PB 228 Management of Symptomatic Uterine Leiomyomas", 2021),
      compl("ASRM", "Removal of myomas in asymptomatic patients to improve fertility and/or reduce miscarriage rate", 2017),
      compl("NICE", "NG88 Heavy menstrual bleeding: assessment and management", 2018),
      compl("ANSM", "Morcellation utérine : recommandations", 2015),
    ],
    text: "SOUS-CLASSIFICATION FIGO DES LÉIOMYOMES (Munro 2011, révisée en 2018 ; composante « L » du système PALM-COEIN des saignements utérins anormaux) :\nType 0 : sous-muqueux pédiculé intracavitaire. Type 1 : sous-muqueux, < 50 % intramural. Type 2 : sous-muqueux, ≥ 50 % intramural. Type 3 : intramural au contact de l'endomètre. Type 4 : intramural. Type 5 : sous-séreux, ≥ 50 % intramural. Type 6 : sous-séreux, < 50 % intramural. Type 7 : sous-séreux pédiculé. Type 8 : autres (cervical, parasite). Formes hybrides : deux chiffres (par exemple 2-5).\n\nFERTILITÉ : les fibromes sous-muqueux (types 0 à 2) altèrent la fertilité et leur résection hystéroscopique est indiquée ; les fibromes sous-séreux n'ont pas d'effet démontré ; pour les fibromes intramuraux sans déformation de la cavité, le bénéfice de la myomectomie n'est pas établi (ASRM 2017).\n\nTRAITEMENT DES FORMES SYMPTOMATIQUES : médical (acide tranexamique, SIU au lévonorgestrel si la cavité n'est pas déformée, progestatifs, analogues de la GnRH en préopératoire) ; myomectomie hystéroscopique (types 0 à 2), cœlioscopique ou par laparotomie selon la taille et le nombre ; embolisation des artères utérines ; hystérectomie en l'absence de désir de conservation utérine. Pas de traitement pour un fibrome asymptomatique. Morcellement : information sur le risque de sarcome méconnu (ANSM).",
  },
  {
    id: "orads-acr-2022",
    pathologyIds: ["GY-19", "EC-07"],
    source: "ACR O-RADS US (2020, v2022)",
    domain: "GYN",
    topic: "Masse annexielle",
    title: "O-RADS échographie — catégories ACR v2022 et conduite",
    year: 2022,
    evidence: NOT_GRADED,
    status: "en_vigueur",
    reviewStatus: "unreviewed",
    keywords: ["ORADS", "O-RADS", "ACR", "kyste", "ovarien", "catégorie", "classification", "risque", "malignité", "suivi", "masse annexielle", "Doppler", "ascite", "solide"],
    references: [
      main("ACR", "O-RADS US risk stratification and management system (v2022)", 2022),
      compl("SRU", "Consensus: management of asymptomatic ovarian and other adnexal cysts (Levine)", 2010),
      compl("ESGO/ISUOG/IOTA/ESGE", "Consensus statement on pre-operative diagnosis of ovarian tumors", 2021, true),
    ],
    text: "O-RADS ÉCHOGRAPHIE (ACR 2020, version 2022) — catégories et risque de malignité :\n0 : évaluation incomplète.\n1 : ovaire normal (follicule ou corps jaune ≤ 3 cm en période d'activité génitale).\n2 : presque certainement bénin (< 1 %) — kyste simple, lésions bénignes classiques (kyste hémorragique typique, endométriome, kyste dermoïde) de moins de 10 cm.\n3 : risque faible (1 % à moins de 10 %).\n4 : risque intermédiaire (10 % à moins de 50 %).\n5 : risque élevé (≥ 50 %) — par exemple ascite ou nodules péritonéaux, lésion solide irrégulière, vascularisation très abondante.\n\nCONDUITE : O-RADS 2 → surveillance ou abstention selon la taille et le statut ménopausique ; O-RADS 3 → avis d'un échographiste référent ou IRM, prise en charge par un gynécologue ; O-RADS 4 → échographie de référence ou IRM, avis d'oncologie gynécologique ; O-RADS 5 → oncologue gynécologue.\nL'attribution de la catégorie repose sur le lexique O-RADS (type de lésion, taille, paroi, cloisons, portion solide, score couleur) : se reporter à la grille officielle.",
  },
];

/** Fiches de synthèse : fiches historiques corrigées + fiches des priorités 1, 2 et 3 du référentiel. */
export const SYNTHESIS_KB: RagChunk[] = [
  ...CORE_KB,
  ...P1_OBST_KB,
  ...P1_GYN_KB,
  ...P23_OBST_A_KB,
  ...P23_OBST_B_KB,
  ...P23_OBST_C_KB,
  ...P23_GYN_A_KB,
  ...P23_GYN_B_KB,
  ...P23_ONCO_PMA_KB,
];

/** Base complète : chaque pathologie du référentiel a une fiche de synthèse ou, à défaut, une fiche d'orientation. */
export const SEED_KB: RagChunk[] = [
  ...SYNTHESIS_KB,
  ...buildOrientationChunks(new Set<string>(SYNTHESIS_KB.flatMap((chunk) => chunk.pathologyIds))),
];
