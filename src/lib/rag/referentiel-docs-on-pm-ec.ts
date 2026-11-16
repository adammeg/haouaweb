/** Référentiel v1.0 — détail des entrées ON-01 à ON-15, PM-01 à PM-18 et EC-01 à EC-08 (transcription du document source). */

import type { RefDetailTuple } from "./referentiel-docs-ob1";

export const REF_DETAILS_ON_PM_EC: Record<string, RefDetailTuple> = {
  "ON-01": [
    "frottis, test HPV, auto-prélèvement, vaccination, dépistage organisé",
    "ASCCP · ACS · ACOG",
    [
      "●HAS – Évaluation de la recherche des papillomavirus humains (HPV) en dépistage primaire des lésions précancéreuses et cancéreuses du col de l'utérus (2019)",
      "▲CNGOF – RPC Dépistage du cancer du col de l'utérus (2025)",
      "●HAS – Recommandations de vaccination contre les HPV (2019 ; élargissements)",
      "●OMS – Guideline for screening and treatment of cervical pre-cancer lesions for cervical cancer prevention (2021) ; stratégie d'élimination 90-70-90 (2020)",
      "▲ACOG – Screening for Cervical Cancer (2026)",
      "●ASCCP – Risk-based management consensus guidelines (2019)",
    ],
  ],
  "ON-02": [
    "CIN 1–3, AIS, conisation, suivi post-traitement, grossesse",
    "ESGO · OMS · INCa",
    [
      "●ASCCP – 2019 consensus guidelines for management of abnormal cervical cancer screening tests and cancer precursors (Perkins, 2020)",
      "●EFC/ESGO – European consensus statement on colposcopy (Redman, 2021)",
      "●OMS – Guideline for screening and treatment of cervical pre-cancer lesions (2021)",
      "▲CNGOF – RPC Dépistage du cancer du col de l'utérus (2025)",
    ],
  ],
  "ON-03": [
    "stadification FIGO 2018, chirurgie, radio-chimiothérapie, ganglion sentinelle, formes avancées",
    "ESMO · NCCN · INCa · ASCO",
    [
      "▲CNGOF et sociétés partenaires – RPC Le cancer du col de l'utérus (GOFS, 2025)",
      "▲ESGO/ESTRO/ESP – Guidelines for the management of patients with cervical cancer (update 2023)",
      "▲ESGO – Resource-stratified guidelines for cervical cancer",
      "●FIGO – Staging 2018 (Bhatla) ; FIGO Cancer Report 2021 : cervix uteri",
      "●ESGO/ESTRO – Quality indicators for radiation therapy of cervical cancer",
    ],
  ],
  "ON-04": [
    "classification moléculaire (POLE, MMR, p53), stades FIGO 2023, chirurgie, traitements adjuvants, préservation de la fertilité",
    "ESMO · NCCN · INCa",
    [
      "▲ESGO/ESTRO/ESP – Guidelines for the management of patients with endometrial carcinoma (update 2025, Lancet Oncology)",
      "▲CNGOF – RPC Cancer de l'endomètre (2025–2026)",
      "●FIGO – Staging of endometrial cancer 2023 (Berek)",
      "▲ESGO/ESHRE/ESGE – Guidelines for the fertility-sparing treatment of endometrial carcinoma and atypical hyperplasia",
      "●ESMO – Endometrial cancer : clinical practice guideline (2022)",
      "●ESGO – Quality indicators for surgical treatment of endometrial carcinoma",
    ],
  ],
  "ON-05": [
    "léiomyosarcome, sarcome du stroma endométrial, carcinosarcome, STUMP, morcellation",
    "ESMO · ANSM · NCCN",
    [
      "▲ESGO/EURACAN/GCIG – Guidelines for the management of patients with uterine sarcomas",
      "●ANSM – Morcellation utérine : recommandations (2014–2015)",
      "●ESMO/EURACAN – Clinical practice guidelines on soft tissue and visceral sarcomas",
    ],
  ],
  "ON-06": [
    "séreux de haut/bas grade, mucineux, endométrioïde, à cellules claires, BRCA/HRD, chirurgie, chimiothérapie, maintenance",
    "INCa · NCCN · ASCO",
    [
      "▲ESGO/ESMO/ESP – Consensus conference recommendations on ovarian cancer : pathology and molecular biology, early, advanced and recurrent disease",
      "▲ESGO – Guidelines on peri-operative management of advanced ovarian cancer patients undergoing debulking surgery",
      "●ESGO – Quality indicators for advanced ovarian cancer surgery",
      "●FIGO – Staging of ovarian, fallopian tube and peritoneal cancer (2014)",
      "▲ESGO/ISUOG/IOTA/ESGE – Pre-operative diagnosis of ovarian tumors (2021)",
    ],
  ],
  "ON-07": [
    "borderline, tumeurs germinales, tumeurs des cordons sexuels et du stroma, mucineux",
    "INCa",
    [
      "▲ESGO – Pocket guidelines : rare ovarian tumours (borderline, germ cell, sex cord-stromal)",
      "●INCa/TMRG – Réseau des tumeurs malignes rares gynécologiques (avis d'experts)",
      "●ESMO/EURACAN – Recommandations sur les tumeurs rares",
    ],
  ],
  "ON-08": [
    "VIN/VaIN, carcinome épidermoïde, mélanome vulvaire, Paget",
    "FIGO · NCCN · ISSVD",
    [
      "▲ESGO – Guidelines for the management of patients with vulvar cancer (update 2023)",
      "▲ESGO/ESTRO/SIOPe – Guidelines for the management of patients with vaginal cancer",
      "●FIGO – Cancer Report 2021 : vulva ; vagina",
      "●ISSVD – Terminology of vulvar squamous intraepithelial lesions (2015)",
    ],
  ],
  "ON-09": [
    "môle complète/partielle, néoplasie trophoblastique (choriocarcinome, PSTT, ETT), surveillance de l'hCG, chimiothérapie",
    "ESMO · RCOG",
    [
      "▲EOTTD/ESGO/GCIG/ISSTD – Guidelines for the treatment of gestational trophoblastic disease",
      "●FIGO – Cancer Report 2018 : update on gestational trophoblastic neoplasia (Ngan)",
      "●RCOG GTG 38 – The Management of Gestational Trophoblastic Disease (2010)",
      "●ESMO/EURACAN – Gestational trophoblastic disease : clinical practice guidelines (2013)",
      "●Centre de référence des maladies trophoblastiques (Lyon, France)",
    ],
  ],
  "ON-10": [
    "BRCA1/2, syndrome de Lynch, RAD51C/D, BRIP1, Li-Fraumeni, chirurgie de réduction de risque",
    "NCCN · ACOG · ACMG",
    [
      "●GGC (UNICANCER) – Recommandations de prise en charge des personnes à risque génétique",
      "●NCCN – Genetic/Familial High-Risk Assessment : Breast, Ovarian, Pancreatic (et Colorectal : Lynch)",
      "●ACOG PB 182 – Hereditary Breast and Ovarian Cancer Syndrome (2017)",
      "●Manchester International Consensus Group – Gynecological cancers in Lynch syndrome (Crosbie, 2019)",
    ],
  ],
  "ON-11": [
    "dépistage organisé et à risque élevé, BI-RADS, CCIS, cancer invasif, traitements systémiques, surveillance",
    "NCCN · ACRad",
    [
      "●ESMO – Early breast cancer : clinical practice guideline (2024) ; ESMO – Metastatic breast cancer",
      "●Recommandations de Saint-Paul-de-Vence (révision biennale, France)",
      "●ACR – BI-RADS Atlas (5e éd., 2013)",
      "●INCa/HAS – Dépistage organisé du cancer du sein",
      "●NCCN – Breast cancer ; consensus de St. Gallen/Vienne (biennal)",
    ],
  ],
  "ON-12": [
    "mastodynie, fibroadénome, kyste, écoulement mamelonnaire, mastite/abcès, ectasie",
    "ACRad · ABFM",
    [
      "●ACR – BI-RADS Atlas (5e éd.)",
      "●ACR – Appropriateness Criteria : Breast pain",
      "●Academy of Breastfeeding Medicine – Protocoles sur la mastite et la douleur à l'allaitement",
    ],
  ],
  "ON-13": [
    "sein, col, ovaire, lymphome, mélanome ; chimiothérapie, radiothérapie et chirurgie pendant la grossesse",
    "ACOG · CNGOF",
    [
      "▲ESGO/INCIP – Guidelines for the management of gynaecological cancers during pregnancy",
      "●ESMO – Cancer, fertility and pregnancy : clinical practice guidelines (2013 ; mise à jour à vérifier)",
      "▲ESGO/ESTRO/ESP – Cervical cancer guidelines (2023) : cancer du col pendant la grossesse",
    ],
  ],
  "ON-14": [
    "vitrification ovocytaire/embryonnaire, tissu ovarien, agonistes GnRH, transposition ovarienne, chirurgie conservatrice",
    "ISFP · ASRM · NICE · CNGOF",
    [
      "●ESHRE – Guideline on female fertility preservation (2020)",
      "●ASCO – Fertility preservation in patients with cancer (2018 ; actualisation à vérifier)",
      "▲NICE NG257 – Fertility problems (2026) : préservation de la fertilité",
      "▲ESGO/ESHRE/ESGE – Guidelines for fertility-sparing treatment in gynaecological cancers",
      "●ASRM – Fertility preservation in patients undergoing gonadotoxic therapy or gonadectomy (2019)",
    ],
  ],
  "ON-15": [
    "ménopause thérapeutique, sexualité, lymphœdème, suivi à long terme",
    "ASCO · IMS",
    [
      "●ESGO – Sections « follow-up » des guidelines par localisation",
      "●CNGOF/GEMVi – RPC Les femmes ménopausées (2021) : ménopause après cancer",
    ],
  ],
  "PM-01": [
    "âge, mode de vie, délai de conception, orientation vers l'AMP",
    "ASRM · ABM",
    [
      "▲OMS – Guideline for the prevention, diagnosis and treatment of infertility (28 novembre 2025 ; 40 recommandations)",
      "▲NICE NG257 – Fertility problems : assessment and treatment (31 mars 2026 ; remplace le CG156)",
      "●CNGOF – RPC Fertilité / infertilité du couple (2011 ; nouvelle version à vérifier)",
      "●ASRM – Definitions of infertility (committee opinion, 2023)",
      "●ICMART/OMS – International Glossary on Infertility and Fertility Care (2017)",
    ],
  ],
  "PM-02": [
    "réserve ovarienne (AMH, CFA), ovulation, perméabilité tubaire (HSG, HyCoSy), cavité utérine, bilan hormonal",
    "CNGOF · POSEIDON",
    [
      "▲NICE NG257 (2026)",
      "▲OMS – Guideline infertility (2025)",
      "●ASRM – Diagnostic evaluation of the infertile female (2015)",
      "●ASRM – Testing and interpreting measures of ovarian reserve (2015)",
      "●POSEIDON group – Stratification des patientes à faible pronostic en FIV (2016)",
    ],
  ],
  "PM-03": [
    "stratégie IIU vs FIV, âge, durée",
    "CNGOF · ASRM",
    [
      "▲ESHRE – Guideline Unexplained infertility (2023)",
      "▲NICE NG257 (2026) ; OMS (2025)",
      "●ASRM – Evidence-based treatments for couples with unexplained infertility (2020)",
    ],
  ],
  "PM-04": [
    "létrozole, clomifène, gonadotrophines, drilling ovarien, SOPK",
    "NICE · CNGOF",
    [
      "●International PCOS guideline (2023) : traitement de l'infertilité (létrozole en première intention)",
      "●ASRM – Use of clomiphene citrate in infertile women (2013)",
      "▲NICE NG257 (2026)",
    ],
  ],
  "PM-05": [
    "indications, stimulation, IAC/IAD, nombre de cycles",
    "CNGOF",
    [
      "▲ESHRE – Unexplained infertility (2023)",
      "▲NICE NG257 (2026)",
      "●ABM – Règles de bonnes pratiques cliniques et biologiques d'AMP (France)",
    ],
  ],
  "PM-06": [
    "indications, protocoles agoniste/antagoniste, déclenchement, réponse faible/forte, POSEIDON",
    "ASRM · NICE · POSEIDON",
    [
      "▲ESHRE – Ovarian stimulation for IVF/ICSI : guideline update 2025",
      "▲NICE NG257 (2026)",
      "●ABM – Règles de bonnes pratiques cliniques et biologiques d'AMP",
      "●ASRM – Committee opinions (stimulation, antagonistes de la GnRH)",
    ],
  ],
  "PM-07": [
    "ponction, préparation du sperme, culture embryonnaire, classement, biopsie, vitrification, contrôle qualité",
    "ASRM · OMS",
    [
      "▲ESHRE – Revised guidelines for good practice in IVF laboratories (2026)",
      "●ALPHA/ESHRE – Vienna consensus : ART laboratory performance indicators (2017)",
      "●ALPHA/ESHRE – Istanbul consensus : oocyte and embryo morphology (2011)",
      "●OMS – Laboratory manual for the examination and processing of human semen (6e éd., 2021)",
      "●BLEFCO – Recommandations de bonnes pratiques de biologie de la reproduction (France)",
    ],
  ],
  "PM-08": [
    "transfert frais/congelé, cycle naturel vs substitué, nombre d'embryons",
    "NICE · ABM",
    [
      "▲ESHRE – Ovarian stimulation : update 2025 (déclenchement, soutien lutéal)",
      "▲ESHRE – Good practice recommendations on add-ons in reproductive medicine (2023)",
      "●ASRM – Performing the embryo transfer : a guideline (2017)",
      "●ASRM – Guidance on the limits to the number of embryos to transfer (2021)",
    ],
  ],
  "PM-09": [
    "SHO, complications de la ponction, grossesses multiples, GEU/hétérotopique, risques obstétricaux après AMP",
    "ASRM · ACOG",
    [
      "●RCOG GTG 5 – The Management of Ovarian Hyperstimulation Syndrome (2016)",
      "▲ESHRE – Ovarian stimulation : update 2025 (prévention du SHO)",
      "●ASRM – Prevention and treatment of moderate and severe ovarian hyperstimulation syndrome (2016)",
      "●ESHRE – European IVF Monitoring (EIM) : rapports annuels",
    ],
  ],
  "PM-10": [
    "RIF, endométrite chronique, tests de réceptivité, grattage endométrial, immunologie",
    "ASRM",
    [
      "▲ESHRE – Good practice recommendations on recurrent implantation failure (2023)",
      "▲ESHRE – Good practice recommendations on add-ons in reproductive medicine (2023)",
    ],
  ],
  "PM-11": [
    "obstruction tubaire, salpingectomie, chirurgie tubaire, adhérences",
    "NICE",
    [
      "●ASRM – Role of tubal surgery in the era of assisted reproductive technology (2012)",
      "▲NICE NG257 (2026) : évaluation et chirurgie tubaires",
    ],
  ],
  "PM-12": [
    "fibromes, polypes, cloison, synéchies, adénomyose, endométriose",
    "NICE · CNGOF",
    [
      "●ASRM – Removal of myomas in asymptomatic patients to improve fertility (2017)",
      "●NICE HTG363 – Hysteroscopic metroplasty of a uterine septum for primary infertility (2015)",
      "▲ESHRE – Guideline Endometriosis (2022) : fertilité",
      "●AAGL/ESGE – Intrauterine adhesions (2017)",
    ],
  ],
  "PM-13": [
    "spermogramme, OAT, azoospermie, varicocèle, Klinefelter, microdélétions Y, CFTR, fragmentation de l'ADN",
    "ASRM · AUA · OMS · BLEFCO",
    [
      "●EAU – Guidelines on Sexual and Reproductive Health (infertilité masculine)",
      "●AUA/ASRM – Diagnosis and treatment of infertility in men (2020 ; amendement 2024)",
      "●OMS – Laboratory manual for human semen (6e éd., 2021)",
      "▲NICE NG257 (2026) ; OMS (2025)",
      "●BLEFCO – Recommandations sur l'analyse du sperme (France)",
    ],
  ],
  "PM-14": [
    "âge, endométriose, IOP, chirurgies ovariennes, autoconservation sociétale",
    "ASRM · ACOG",
    [
      "●ESHRE – Guideline on female fertility preservation (2020)",
      "▲ACOG – Committee Statement No. 22 : Anticipatory Counseling Regarding Ovarian Factor Fertility Decline (remplace le CO sur le déclin de fertilité lié à l'âge)",
      "●ASRM – Planned oocyte cryopreservation for women seeking to preserve future reproductive potential (2018)",
      "●Loi de bioéthique et décrets (France) ; ABM – cadre d'autorisation des centres",
    ],
  ],
  "PM-15": [
    "ovocytes, spermatozoïdes, accueil d'embryon, accès aux origines",
    "ASRM",
    [
      "●ESHRE – Good practice recommendations on gamete and embryo donation (2022)",
      "●ASRM – Recommendations for gamete and embryo donation (2021)",
      "●ABM/FFC (CECOS) – Cadre réglementaire et rapports annuels",
    ],
  ],
  "PM-16": [
    "PGT-A, PGT-M, PGT-SR, mosaïques",
    "ASRM · ACMG",
    [
      "●ESHRE PGT Consortium – Good practice recommendations for PGT (2020)",
      "●ASRM – Clinical use of preimplantation genetic testing for aneuploidy : committee opinion (2024)",
      "●ABM – Cadre du DPI (France)",
    ],
  ],
  "PM-17": [
    "sérodiscordance, prévention de la transmission, lavage du sperme",
    "ASRM · EASL",
    [
      "●ESHRE – Good practice recommendations on medically assisted reproduction in patients with a viral infection/disease (2021)",
      "●ANRS-MIE/CNS – Rapport d'experts VIH (chapitre procréation)",
    ],
  ],
  "PM-18": [
    "soutien psychosocial, couples de femmes, femmes seules, parentalité LGBTQ+, GPA à l'étranger",
    "ASRM",
    [
      "●ESHRE – Routine psychosocial care in infertility and medically assisted reproduction : a guide for fertility staff (2015)",
      "●CCNE – Avis 149 sur la baisse de la natalité et de la fertilité (2025)",
      "●Cadre légal local à intégrer séparément (France : lois de bioéthique ; Tunisie : loi n° 2001-93 sur la médecine de la reproduction — à vérifier)",
    ],
  ],
  "EC-01": [
    "datation, clarté nucale, morphologie précoce, localisation, grossesses multiples",
    "FMF · CNGOF",
    [
      "●ISUOG – Practice Guidelines : performance of first-trimester fetal ultrasound scan (2013 ; actualisations)",
      "●CTE/CFEF – Compte rendu standardisé et mesures de référence (France)",
      "●FMF – Clarté nucale, dépistage combiné et algorithmes de risque",
    ],
  ],
  "EC-02": [
    "22–24 SA, check-list, col utérin, placenta, liquide amniotique",
    "",
    [
      "●ISUOG – Practice Guidelines (updated) : performance of the routine mid-trimester fetal ultrasound scan (2022)",
      "▲ISUOG – « 20 + 2 planes » : méthode d'examen et guide pratique pour 65 anomalies (2025)",
      "●CTE/CFEF – Compte rendu standardisé (France)",
    ],
  ],
  "EC-03": [
    "croissance, présentation, liquide amniotique, placenta, estimation du poids",
    "FMF · FIGO",
    [
      "●ISUOG – Practice Guidelines : performance of third-trimester obstetric ultrasound scan (2024)",
      "●FIGO – Initiative on fetal growth (2021)",
      "●CFEF – Courbes de référence (France)",
    ],
  ],
  "EC-04": [
    "artères utérines, ombilicale, cérébrale moyenne, ductus venosus, rapport cérébro-placentaire, profil biophysique",
    "ACOG",
    [
      "●ISUOG – Practice Guidelines (updated) : use of Doppler velocimetry in obstetrics (2021)",
      "●ACOG PB 229 – Antepartum Fetal Surveillance (2021)",
      "▲ISUOG – Consensus statement on maternal hemodynamic assessment (2025)",
    ],
  ],
  "EC-05": [
    "dépistage des cardiopathies, plans de coupe, rythme fœtal",
    "CFEF",
    [
      "●ISUOG – Practice Guidelines : fetal cardiac screening examination (2013 ; actualisations)",
      "●AHA – Scientific Statement : Diagnosis and treatment of fetal cardiac disease (2014)",
    ],
  ],
  "EC-06": [
    "SNC, ventriculomégalie, malformations de la fosse postérieure, IRM",
    "",
    [
      "●ISUOG – Sonographic examination of the fetal CNS : Part 1 et Part 2 (2020–2021)",
      "●ISUOG – Practice Guidelines : performance of fetal magnetic resonance imaging (2017)",
    ],
  ],
  "EC-07": [
    "ovaires (IOTA/O-RADS), endomètre (IETA), myomètre (MUSA), endométriose profonde (IDEA), cicatrice de césarienne, grossesse précoce",
    "ESGO · ACRad",
    [
      "●IOTA – ADNEX et Simple Rules ; ACR – O-RADS US (v2022)",
      "●IDEA – Consensus opinion on ultrasound assessment of deep endometriosis (Guerriero, 2016)",
      "●IETA – Terms and definitions for the endometrium on ultrasound (Leone, 2010)",
      "●MUSA – Revised consensus (2022)",
      "▲ISUOG/ESGO – Consensus statement on ultrasound-guided biopsy in gynecological oncology (2025)",
      "▲ISUOG – Practice Guidelines : point-of-care ultrasound in obstetrics and gynecology (novembre 2025)",
    ],
  ],
  "EC-08": [
    "indications, protocoles, produits de contraste, grossesse",
    "ISUOG",
    [
      "●ACR – Appropriateness Criteria (gynécologie-obstétrique)",
      "●ACR – Manual on Contrast Media",
      "▲CNGOF – RPC Imagerie de l'endométriose (2025)",
    ],
  ],
};
