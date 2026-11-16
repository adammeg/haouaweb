/**
 * Référentiel v1.0 — détail des entrées OB-01 à OB-39 (transcription du document source).
 * Format : [sous-entités, sociétés complémentaires, documents de référence dans l'ordre d'ingestion].
 * Préfixe d'un document : "▲" = publié ou mis à jour en 2024–2026 et vérifié dans le référentiel ;
 * "●" = référence classique, version à reconfirmer.
 */

export type RefDetailTuple = readonly [sub: string, compl: string, docs: readonly string[]];

export const REF_DETAILS_OB1: Record<string, RefDetailTuple> = {
  "OB-01": [
    "acide folique, vaccins, médicaments, maladies chroniques, mode de vie",
    "ACOG · NICE · OMS",
    [
      "●HAS – Suivi et orientation des femmes enceintes en fonction des situations à risque identifiées (2007, actualisations)",
      "●ACOG CO 762 – Prepregnancy Counseling (2019)",
      "●NICE NG201 – Antenatal care (2021)",
    ],
  ],
  "OB-02": [
    "calendrier des consultations, bilans biologiques, entretien prénatal précoce, préparation à la naissance",
    "NICE · OMS",
    [
      "●HAS – Suivi et orientation des femmes enceintes en fonction des situations à risque identifiées (2007)",
      "●HAS – Préparation à la naissance et à la parentalité (2005)",
      "▲HAS – RBP Situations de vulnérabilité pendant la grossesse et en post-partum (2024)",
      "●NICE NG201 – Antenatal care (2021)",
      "●OMS – Recommendations on antenatal care for a positive pregnancy experience (2016)",
      "●CNSF – Recommandations pour la pratique clinique (édition 2021)",
    ],
  ],
  "OB-03": [
    "risques obstétricaux, dépistage, surveillance, terme d'accouchement",
    "RCOG · ESHRE",
    [
      "●ACOG/SMFM – Obstetric Care Consensus No. 11: Pregnancy at Age 35 Years or Older (2022)",
      "●RCOG – Scientific Impact Paper : Induction of labour at term in older mothers (2013)",
      "●CNGOF – Mises à jour en gynécologie-obstétrique (volumes annuels)",
    ],
  ],
  "OB-04": [
    "folates, fer, vitamine D, iode, régimes, sport, voyage",
    "ACOG · OMS · NICE",
    [
      "▲HAS – Recommandations sur le surpoids et l'obésité chez la femme (volet préconception/grossesse)",
      "●ACOG PB 230 – Obesity in Pregnancy (2021)",
      "●ACOG CO 804 – Physical Activity and Exercise During Pregnancy and the Postpartum Period (2020)",
      "●NAM/IOM – Weight Gain During Pregnancy: Reexamining the Guidelines (2009)",
      "●OMS – Recommendations on antenatal care (2016) : suppléments nutritionnels",
    ],
  ],
  "OB-05": [
    "grippe, coqueluche, COVID-19, VRS, hépatite B",
    "ACOG · OMS · CDC",
    [
      "●HAS – Recommandations vaccinales de la femme enceinte (coqueluche, grippe, COVID-19, VRS)",
      "▲ACOG – Maternal Immunization (document 2026)",
      "●OMS – Position papers vaccins (SAGE)",
      "●CDC/ACIP – Vaccination during pregnancy",
    ],
  ],
  "OB-06": [
    "syndrome d'alcoolisation fœtale, sevrage, traitements de substitution",
    "SFA · ACOG",
    [
      "●HAS – Arrêt de la consommation de tabac : du dépistage individuel au maintien de l'abstinence en premier recours (2014)",
      "●ACOG CO 807 – Tobacco and Nicotine Cessation During Pregnancy (2020)",
      "▲ACOG – Clinical Consensus No. 10 : Cannabis Use During Pregnancy and Lactation (remplace le CO 722)",
      "●ACOG CO 711 – Opioid Use and Opioid Use Disorder in Pregnancy (2017)",
    ],
  ],
  "OB-07": [
    "tératogénicité, antalgiques, antibiotiques, psychotropes, radiologie, appendicectomie",
    "EMA · ENTIS · ACOG · SAGES",
    [
      "●CRAT – Fiches « grossesse » et « allaitement » (lecrat.fr)",
      "●ANSM – Programmes de prévention des grossesses (valproate, topiramate, rétinoïdes…)",
      "●LactMed (NLM) – Base de données médicaments et allaitement",
      "●ACOG CO 723 – Guidelines for Diagnostic Imaging During Pregnancy and Lactation (2017)",
      "●ACOG CO 775 – Nonobstetric Surgery During Pregnancy (2019)",
      "●SAGES – Guidelines for the use of laparoscopy during pregnancy (2017)",
    ],
  ],
  "OB-08": [
    "marqueurs sériques, clarté nucale, ADN libre circulant (DPNI), stratégies combinées",
    "ISPD · ACOG · ACMG · FMF",
    [
      "●HAS – Place des tests ADN libre circulant dans le dépistage de la trisomie 21 fœtale (2017)",
      "●ABM – Arrêtés et rapports annuels sur le diagnostic prénatal",
      "●ACOG PB 226 – Screening for Fetal Chromosomal Abnormalities (2020)",
      "●ACMG – Noninvasive prenatal screening : evidence-based clinical guideline (2023)",
      "●ISPD – Position statements sur le cfDNA (2021–2023)",
    ],
  ],
  "OB-09": [
    "amniocentèse, biopsie de trophoblaste, cordocentèse, caryotype, ACPA, exome",
    "RCOG · ISPD · ACOG",
    [
      "●RCOG GTG 8 – Amniocentesis and Chorionic Villus Sampling (2010)",
      "●ISPD – Position statement on exome and genome sequencing in prenatal diagnosis (2022)",
      "●ACOG CO 682 – Microarrays and Next-Generation Sequencing in Obstetrics and Gynecology (2016)",
      "●ABM – Cadre réglementaire du DPN et rapports d'activité des CPDPN",
    ],
  ],
  "OB-10": [
    "hémoglobinopathies, mucoviscidose, X fragile, SMA, consanguinité",
    "ACOG · TIF",
    [
      "●ACMG – Screening for autosomal recessive and X-linked conditions during pregnancy and preconception : practice resource (2021)",
      "●ACOG CO 690 – Carrier Screening in the Age of Genomic Medicine (2017)",
      "●ESHG – Recommendations on carrier screening (Henneman, 2016)",
      "●TIF – Guidelines for the management of transfusion-dependent thalassaemia (4e éd., 2021)",
    ],
  ],
  "OB-11": [
    "SNC (spina bifida, ventriculomégalie, agénésie du corps calleux), cardiopathies, fentes, laparoschisis/omphalocèle, uro-néphro, squelette, hernie diaphragmatique, hydrops",
    "SMFM · AHA",
    [
      "●ISUOG – Sonographic examination of the fetal CNS : Part 1 et Part 2 (2020–2021)",
      "●ISUOG – Fetal cardiac screening examination (2013 ; actualisations)",
      "●ISUOG – Routine mid-trimester fetal ultrasound scan (update 2022)",
      "●AHA – Scientific Statement : Diagnosis and treatment of fetal cardiac disease (2014)",
      "●CDH EURO Consortium – Consensus de prise en charge de la hernie diaphragmatique congénitale",
    ],
  ],
  "OB-12": [
    "laser (STT), spina bifida in utero, FETO, transfusion in utero, shunts",
    "SMFM · FMF",
    [
      "●SMFM – Twin–twin transfusion syndrome (Clinical Guideline, 2013)",
      "▲ISUOG – Practice Guidelines (updated) : role of ultrasound in twin pregnancy (2025)",
      "●CDH EURO Consortium – Recommandations FETO",
      "●Centres de référence en médecine fœtale (réseaux de CPDPN)",
    ],
  ],
  "OB-13": [
    "décision collégiale, techniques, accompagnement, autopsie, cadre légal",
    "RCOG · FIGO · STGO",
    [
      "●Code de la santé publique – IMG (art. L2213-1 et suivants)",
      "●RCOG – Termination of Pregnancy for Fetal Abnormality in England, Scotland and Wales (2010)",
      "●ABM – Rapport annuel du diagnostic prénatal (CPDPN)",
      "●CNGOF – Mises à jour (IMG, accompagnement) ; cadre légal tunisien à intégrer (Code pénal, art. 214 — à vérifier)",
    ],
  ],
  "OB-14": [
    "menace, FCS incomplète/retenue, œuf clair, hématome décidual, traitement médical (mifépristone–misoprostol), aspiration",
    "NICE · ACOG · RCOG · SRU",
    [
      "●NICE NG126 – Ectopic pregnancy and miscarriage : diagnosis and initial management (2019)",
      "●ACOG PB 200 – Early Pregnancy Loss (2018)",
      "●SRU – Consensus : diagnostic criteria for nonviable pregnancy early in the first trimester (Doubilet, 2013)",
      "●CNGOF – Mises à jour / RPC sur les fausses couches du 1er trimestre",
    ],
  ],
  "OB-15": [
    "bilan utérin, génétique, SAPL, thrombophilies, endocrinien ; traitement ; soutien psychologique",
    "RCOG · ASRM · EULAR",
    [
      "●ESHRE – Guideline Recurrent Pregnancy Loss (update 2022)",
      "●RCOG GTG 17 – Recurrent Miscarriage (2023)",
      "●ASRM – Evaluation and treatment of recurrent pregnancy loss (committee opinion)",
      "●EULAR – Recommendations for women's health and management of family planning, ART, pregnancy and menopause in SLE/APS (2017)",
    ],
  ],
  "OB-16": [
    "tubaire, cicatrice de césarienne, interstitielle/cornuale, cervicale, ovarienne, hétérotopique ; méthotrexate, chirurgie, expectative",
    "RCOG · NICE · ACOG",
    [
      "▲CNGOF – RPC Grossesse extra-utérine tubaire (mise à jour 2024)",
      "▲CNGOF – RPC Grossesses extra-utérines non tubaires (2025)",
      "▲ESHRE – Guideline Ectopic pregnancy ; ESHRE – Terminology for normally sited and ectopic pregnancies on ultrasound (2020)",
      "●RCOG GTG 21 – Diagnosis and Management of Ectopic Pregnancy (2016)",
      "●NICE NG126 (2019) ; ACOG PB 193 – Tubal Ectopic Pregnancy (2018)",
    ],
  ],
  "OB-17": [
    "môle complète/partielle, tumeurs trophoblastiques",
    "",
    ["●Fiche détaillée : voir ON-09 (Maladie trophoblastique gestationnelle)"],
  ],
  "OB-18": [
    "réhydratation, antiémétiques, thiamine, formes sévères, nutrition entérale",
    "ACOG · SOGC",
    [
      "●RCOG GTG 69 – Management of Nausea and Vomiting in Pregnancy and Hyperemesis Gravidarum (2016)",
      "●ACOG PB 189 – Nausea and Vomiting of Pregnancy (2018)",
      "●SOGC – Guideline on nausea and vomiting of pregnancy (2016)",
      "●CRAT – Fiches antiémétiques et grossesse",
    ],
  ],
  "OB-19": [
    "seuils de traitement, auto-mesure, surveillance fœtale, terme d'accouchement",
    "ACOG · NICE · SOGC",
    [
      "●ISSHP – Classification, diagnosis and management of hypertensive disorders of pregnancy (2021 ; Magee, 2022)",
      "▲ESC – Guidelines for the management of cardiovascular disease and pregnancy (2025)",
      "●NICE NG133 – Hypertension in pregnancy (2019, actualisé 2023)",
      "▲ACOG – Clinical guidance CHAP (2022, réaffirmé 2025)",
      "●SOGC – Clinical Practice Guideline No. 426 : Hypertensive disorders of pregnancy (2022)",
      "▲AHA/ACC – Guideline for the prevention, detection, evaluation and management of high blood pressure in adults (2025)",
    ],
  ],
  "OB-20": [
    "prédiction (FMF), prévention (aspirine, calcium), sulfate de magnésium, terme d'extraction, post-partum",
    "ACOG · NICE · FMF · OMS · ISUOG",
    [
      "●ISSHP – 2021 recommendations (Magee, 2022)",
      "●ACOG PB 222 – Gestational Hypertension and Preeclampsia (2020, réaffirmé 2026)",
      "●FIGO – Initiative on pre-eclampsia : first-trimester screening and prevention (Poon, 2019)",
      "●RFE SFAR/CNGOF/SFMP/SFNN – Prise en charge multidisciplinaire des formes graves de prééclampsie (2009)",
      "●OMS – Recommendations for prevention and treatment of pre-eclampsia and eclampsia (2011)",
      "▲ISUOG – Consensus statement on maternal hemodynamic assessment (2025)",
    ],
  ],
  "OB-21": [
    "dépistage, diagnostic (IADPSG/OMS), diététique, insuline/metformine, accouchement, suivi post-partum",
    "OMS · FIGO · ACOG · NICE",
    [
      "▲CNGOF – RPC Diabète et grossesse (2025)",
      "●CNGOF/SFD – RPC Le diabète gestationnel (2010)",
      "●IADPSG – Recommendations on the diagnosis and classification of hyperglycemia in pregnancy (2010)",
      "●OMS – Diagnostic criteria and classification of hyperglycaemia first detected in pregnancy (2013)",
      "●ADA – Standards of Care in Diabetes : section « Management of Diabetes in Pregnancy » (annuel)",
      "●FIGO – Initiative on gestational diabetes mellitus (Hod, 2015)",
      "●NICE NG3 – Diabetes in pregnancy (2015, actualisé 2020) ; ACOG PB 190 – Gestational Diabetes Mellitus (2018)",
    ],
  ],
  "OB-22": [
    "préconception, rétinopathie/néphropathie, pompe à insuline, boucle fermée, surveillance fœtale",
    "ACOG · NICE",
    [
      "●ADA – Standards of Care in Diabetes : section grossesse (annuel)",
      "▲CNGOF – RPC Diabète et grossesse (2025)",
      "●NICE NG3 – Diabetes in pregnancy (2015, actualisé 2020)",
      "●ACOG PB 201 – Pregestational Diabetes Mellitus (2018)",
    ],
  ],
  "OB-23": [
    "hypothyroïdie, hyperthyroïdie/Basedow, nodules, thyroïdite du post-partum, anticorps anti-TPO",
    "Endocrine Society · ACOG",
    [
      "▲ATA – Guidelines for thyroid disease in preconception, pregnancy and postpartum (2026 ; remplace la version 2017)",
      "●ETA – Guidelines on subclinical hypothyroidism in pregnancy and in children (2014)",
      "●ACOG PB 223 – Thyroid Disease in Pregnancy (2020)",
      "●Endocrine Society – Management of thyroid dysfunction during pregnancy and postpartum (2012)",
    ],
  ],
  "OB-24": [
    "prolactinome (voir GY-04), Cushing, phéochromocytome, insuffisance surrénale, hyperparathyroïdie, HCS",
    "ESE",
    [
      "●Endocrine Society – Pheochromocytoma and paraganglioma (2014) ; Cushing's syndrome (2015) ; CAH (2018)",
      "●ESE – Clinical practice guidelines (hypophyse, surrénale, parathyroïdes)",
    ],
  ],
  "OB-25": [
    "valvulopathies, prothèses mécaniques, cardiopathies congénitales, cardiomyopathie du péripartum, HTAP, aorte/Marfan, arythmies, SCA, classification mWHO",
    "HFA · AHA · ACC",
    [
      "▲ESC – 2025 Guidelines for the management of cardiovascular disease and pregnancy (mWHO 2.0, Pregnancy Heart Team)",
      "●HFA/ESC – Position statement on peripartum cardiomyopathy (2019)",
      "●ESC – Guidelines for the management of adult congenital heart disease (2020)",
      "●AHA – Scientific Statement : Cardiac arrest in pregnancy (2015)",
    ],
  ],
  "OB-26": [
    "prophylaxie anté/post-partum, TVP/EP, HBPM, thrombophilies héréditaires, antécédent de MTEV",
    "ASH · ACOG · ESC · ISTH",
    [
      "●RCOG GTG 37a – Reducing the Risk of Venous Thromboembolism during Pregnancy and the Puerperium (2015)",
      "●RCOG GTG 37b – Thromboembolic Disease in Pregnancy and the Puerperium : Acute Management (2015)",
      "●ASH – Guidelines : venous thromboembolism in the context of pregnancy (2018)",
      "●ACOG PB 196 – Thromboembolism in Pregnancy (2018)",
      "▲ESC – 2025 Guidelines CVD and pregnancy ; ESC – Acute pulmonary embolism (2019)",
    ],
  ],
  "OB-27": [
    "SAPL obstétrical, lupus, polyarthrite, spondyloarthrites, Sjögren/anti-SSA, sclérodermie, Behçet, médicaments",
    "BSR · ACOG",
    [
      "●EULAR – Recommendations for women's health, family planning, ART, pregnancy and menopause in SLE/APS (2017)",
      "●ACR – Guideline for the management of reproductive health in rheumatic and musculoskeletal diseases (2020)",
      "●ACR/EULAR – Classification criteria for antiphospholipid syndrome (2023)",
      "●EULAR – Points to consider : antirheumatic drugs before and during pregnancy and lactation (2016)",
      "●BSR – Guideline on prescribing drugs in pregnancy and breastfeeding (2016)",
    ],
  ],
  "OB-28": [
    "diagnostic, fer oral/intraveineux, post-partum, préparation à l'accouchement",
    "ACOG · FIGO",
    [
      "●ACOG PB 233 – Anemia in Pregnancy (2021)",
      "●BSH – UK guidelines on the management of iron deficiency in pregnancy (2019)",
      "●OMS – Guideline on haemoglobin cutoffs to define anaemia (2024)",
      "●OMS – Daily iron and folic acid supplementation in pregnant women (2012)",
    ],
  ],
  "OB-29": [
    "grossesse, transfusion, crises vaso-occlusives, chélation",
    "ASH · CNGOF",
    [
      "●RCOG GTG 61 – Management of Sickle Cell Disease in Pregnancy (2011)",
      "●RCOG GTG 66 – Management of Beta Thalassaemia in Pregnancy (2014)",
      "●TIF – Guidelines for the management of transfusion-dependent thalassaemia (4e éd., 2021)",
    ],
  ],
  "OB-30": [
    "PTI, thrombopénie gestationnelle, SHU/PTT, maladie de Willebrand, hémophilie (porteuses)",
    "WFH · CNGOF",
    [
      "●ASH – Guidelines for immune thrombocytopenia (2019)",
      "●International consensus report on the investigation and management of primary ITP (Provan, 2019)",
      "●WFH – Guidelines for the management of hemophilia (3e éd., 2020)",
      "●ASH/ISTH/NHF/WFH – Guidelines on von Willebrand disease (2021)",
    ],
  ],
  "OB-31": [
    "bactériurie asymptomatique, cystite, pyélonéphrite, lithiase, maladie rénale chronique, dialyse, transplantation",
    "EAU · IDSA · KDIGO",
    [
      "●SPILF/AFU – Recommandations sur les infections urinaires communautaires : cystite, pyélonéphrite (2015–2018)",
      "●EAU – Guidelines on Urological Infections",
      "●IDSA – Clinical practice guideline for the management of asymptomatic bacteriuria (2019)",
      "●KDIGO – Clinical practice guideline for the evaluation and management of CKD (2024)",
    ],
  ],
  "OB-32": [
    "cholestase intrahépatique, stéatose aiguë gravidique, HELLP, hépatites, cirrhose, maladie de Wilson",
    "SMFM · RCOG · AASLD",
    [
      "●EASL – Clinical practice guidelines on the management of liver diseases in pregnancy (2023)",
      "●RCOG GTG 43 – Intrahepatic Cholestasis of Pregnancy (2022)",
      "●SMFM Consult Series #53 – Intrahepatic cholestasis of pregnancy (2021)",
      "●AASLD – Guidance on hepatitis B (2018)",
    ],
  ],
  "OB-33": [
    "antiépileptiques, valproate, accouchement, allaitement",
    "LFCE · SMFM",
    [
      "●AAN/AES/SMFM – Practice guideline update : management issues for women with epilepsy, focus on pregnancy (2024)",
      "●ANSM – Valproate et dérivés : programme de prévention des grossesses",
    ],
  ],
  "OB-34": [
    "asthme, apnée du sommeil, mucoviscidose, tuberculose, pneumopathies",
    "ACOG · OMS",
    [
      "●GINA – Global Strategy for Asthma Management and Prevention : section grossesse (annuel)",
      "●ACOG PB 90 – Asthma in Pregnancy (2008, réaffirmé)",
      "●OMS – Guidelines on tuberculosis treatment (grossesse)",
    ],
  ],
  "OB-35": [
    "appendicite, cholécystite/lithiase, pancréatite, MICI, occlusion",
    "ACOG",
    [
      "●SAGES – Guidelines for the use of laparoscopy during pregnancy (2017)",
      "●ECCO – Topical review on reproduction and pregnancy in IBD",
      "●ACOG CO 775 – Nonobstetric Surgery During Pregnancy (2019)",
    ],
  ],
  "OB-36": [
    "préconception, diabète/prééclampsie, accouchement, grossesse après bypass/sleeve",
    "ACOG",
    [
      "▲HAS – Recommandations sur le surpoids et l'obésité chez la femme (grossesse, chirurgie bariatrique)",
      "●ACOG PB 230 – Obesity in Pregnancy (2021)",
      "●ACOG PB 105 – Bariatric Surgery and Pregnancy (2009, statut à vérifier)",
    ],
  ],
  "OB-37": [
    "dépression/anxiété anté- et post-natale, psychose puerpérale, bipolarité, TSPT, suicide maternel",
    "NICE · ACOG",
    [
      "●NICE CG192 – Antenatal and postnatal mental health : clinical management and service guidance (2014, actualisé 2020)",
      "●ACOG CPG No. 5 – Treatment and Management of Mental Health Conditions During Pregnancy and Postpartum (2023)",
      "●ACOG CO 757 – Screening for Perinatal Depression (2018)",
      "▲HAS – RBP Situations de vulnérabilité pendant la grossesse et en post-partum (2024)",
    ],
  ],
  "OB-38": [
    "violences conjugales, précarité, grossesse de l'adolescente, migrantes, handicap",
    "ACOG",
    [
      "▲HAS – RBP Situations de vulnérabilité pendant la grossesse et en post-partum (2024)",
      "●HAS – Repérage des femmes victimes de violences au sein du couple (2019)",
      "●OMS – Responding to intimate partner violence and sexual violence against women (2013)",
      "●ACOG CO 518 – Intimate Partner Violence (2012, réaffirmé)",
    ],
  ],
  "OB-39": [
    "éruption polymorphe, pemphigoïde gestationnelle, prurigo, cholestase (voir OB-32)",
    "EADV · RCOG",
    [
      "●Classification des dermatoses spécifiques de la grossesse (Ambros-Rudolph, 2006)",
      "●RCOG GTG 43 – Intrahepatic Cholestasis of Pregnancy (2022)",
    ],
  ],
};
