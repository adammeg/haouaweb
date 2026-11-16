/**
 * Référentiel des pathologies et des sociétés savantes sources du RAG — version 1.0 (27 octobre 2026).
 * Carte du corpus : identifiant stable, section, priorité d'ingestion, sociétés sources principales.
 * Ce fichier ne contient aucune recommandation clinique.
 */

import { REF_DETAILS_GY } from "./referentiel-docs-gy";
import { REF_DETAILS_OB1, type RefDetailTuple } from "./referentiel-docs-ob1";
import { REF_DETAILS_OB2 } from "./referentiel-docs-ob2";
import { REF_DETAILS_ON_PM_EC } from "./referentiel-docs-on-pm-ec";

export const REFERENTIEL_VERSION ="1.0 · 2026-10-27";

export type RefPriority = "P1" | "P2" | "P3";

// [id, section, priorité, pathologie / thème, sociétés sources principales]
const RAW = [
  ["OB-01", "OB-A", "P2", "Consultation préconceptionnelle et prévention primaire", "HAS · CNGOF"],
  ["OB-02", "OB-A", "P1", "Suivi de la grossesse normale", "HAS · CNGOF · CNSF"],
  ["OB-03", "OB-A", "P2", "Grossesse après 35 ans (âge maternel avancé)", "ACOG · CNGOF"],
  ["OB-04", "OB-A", "P2", "Nutrition, prise de poids, supplémentation et activité physique", "HAS · CNGOF"],
  ["OB-05", "OB-A", "P2", "Vaccination et prévention des infections pendant la grossesse", "HAS · HCSP"],
  ["OB-06", "OB-A", "P2", "Tabac, alcool, cannabis, opioïdes et autres addictions", "HAS · SFT"],
  ["OB-07", "OB-A", "P1", "Médicaments, imagerie et chirurgie non obstétricale pendant la grossesse et l'allaitement", "CRAT · ANSM"],
  ["OB-08", "OB-B", "P1", "Dépistage de la trisomie 21 et des aneuploïdies", "HAS · CNGOF · ABM"],
  ["OB-09", "OB-B", "P2", "Diagnostic prénatal invasif et génétique fœtale", "CNGOF · ABM · CPDPN"],
  ["OB-10", "OB-B", "P2", "Conseil génétique, dépistage des porteurs et maladies héréditaires fréquentes", "ACMG · ESHG · ABM"],
  ["OB-11", "OB-B", "P1", "Malformations fœtales (pathologie structurelle)", "ISUOG · CFEF · CPDPN"],
  ["OB-12", "OB-B", "P3", "Thérapie et chirurgie fœtales", "CPDPN · ISUOG"],
  ["OB-13", "OB-B", "P3", "Interruption médicale de grossesse (IMG) et soins palliatifs périnataux", "CNGOF · CPDPN · ABM"],
  ["OB-14", "OB-C", "P1", "Fausse couche spontanée du premier trimestre", "CNGOF · ESHRE"],
  ["OB-15", "OB-C", "P1", "Fausses couches à répétition", "ESHRE · CNGOF"],
  ["OB-16", "OB-C", "P1", "Grossesse extra-utérine et grossesse de localisation indéterminée", "CNGOF · ESHRE"],
  ["OB-17", "OB-C", "P1", "Môle hydatiforme et néoplasie trophoblastique gestationnelle", "ESGO · FIGO"],
  ["OB-18", "OB-C", "P2", "Nausées et vomissements de la grossesse, hyperémèse gravidique", "CNGOF · RCOG"],
  ["OB-19", "OB-D", "P1", "HTA chronique et HTA gestationnelle", "ISSHP · CNGOF · SFHTA · ESC"],
  ["OB-20", "OB-D", "P1", "Prééclampsie, éclampsie et HELLP syndrome", "ISSHP · CNGOF · SFAR · FIGO"],
  ["OB-21", "OB-D", "P1", "Diabète gestationnel", "CNGOF · SFD · IADPSG · ADA"],
  ["OB-22", "OB-D", "P1", "Diabète prégestationnel (type 1 et type 2)", "SFD · ADA · CNGOF"],
  ["OB-23", "OB-D", "P2", "Dysthyroïdies et grossesse", "ATA · ETA · SFE"],
  ["OB-24", "OB-D", "P3", "Autres endocrinopathies maternelles", "SFE · Endocrine Society"],
  ["OB-25", "OB-D", "P1", "Cardiopathies et grossesse", "ESC · SFC"],
  ["OB-26", "OB-D", "P1", "Maladie thromboembolique veineuse et thrombophilies", "RCOG · CNGOF · GIHP · SFMV"],
  ["OB-27", "OB-D", "P2", "Syndrome des antiphospholipides, lupus et maladies auto-immunes", "EULAR · ACRheum · SNFMI"],
  ["OB-28", "OB-D", "P2", "Anémie ferriprive et carence martiale", "CNGOF · OMS · BSH"],
  ["OB-29", "OB-D", "P2", "Hémoglobinopathies : drépanocytose et thalassémies", "SFH · RCOG · TIF"],
  ["OB-30", "OB-D", "P3", "Thrombopénies et troubles de l'hémostase", "SFH · ASH · ISTH"],
  ["OB-31", "OB-D", "P2", "Infections urinaires et pathologies néphro-urologiques", "SPILF · AFU · CNGOF"],
  ["OB-32", "OB-D", "P2", "Hépatopathies de la grossesse", "EASL · CNGOF · AFEF"],
  ["OB-33", "OB-D", "P3", "Neurologie : épilepsie, migraine, sclérose en plaques, AVC", "AAN · ANSM"],
  ["OB-34", "OB-D", "P3", "Asthme et pathologies respiratoires", "GINA · SPLF"],
  ["OB-35", "OB-D", "P3", "Pathologies digestives et chirurgicales pendant la grossesse", "SNFGE · ECCO · SAGES"],
  ["OB-36", "OB-D", "P2", "Obésité et chirurgie bariatrique", "HAS · CNGOF"],
  ["OB-37", "OB-D", "P1", "Santé mentale périnatale", "HAS · SMF · CNGOF"],
  ["OB-38", "OB-D", "P2", "Violences, précarité et vulnérabilités", "HAS · CNGOF · OMS"],
  ["OB-39", "OB-D", "P3", "Dermatoses de la grossesse", "Soc. fr. dermatologie"],
  ["OB-40", "OB-E", "P1", "Infection à cytomégalovirus (CMV)", "HAS · CNGOF"],
  ["OB-41", "OB-E", "P2", "Toxoplasmose", "CNR · HAS · CNGOF"],
  ["OB-42", "OB-E", "P2", "Varicelle, rubéole, parvovirus B19, rougeole", "HCSP · CNGOF · SPILF"],
  ["OB-43", "OB-E", "P2", "Herpès génital et herpès néonatal", "CNGOF · ACOG · RCOG"],
  ["OB-44", "OB-E", "P1", "Syphilis et grossesse", "CNGOF · HAS · SPILF"],
  ["OB-45", "OB-E", "P2", "Infection par le VIH et grossesse", "ANRS-MIE · EACS · BHIVA"],
  ["OB-46", "OB-E", "P2", "Hépatites B et C", "EASL · AFEF · OMS"],
  ["OB-47", "OB-E", "P1", "Streptocoque B, infection intra-amniotique et infections néonatales précoces", "CNGOF · HAS · SFN"],
  ["OB-48", "OB-E", "P1", "Sepsis maternel et infections puerpérales", "SFAR · CNGOF · OMS"],
  ["OB-49", "OB-E", "P3", "Paludisme, Zika et infections tropicales (voyage)", "HCSP · OMS · SPILF"],
  ["OB-50", "OB-F", "P1", "Placenta praevia, placenta accreta spectrum (PAS), vasa praevia", "CNGOF · FIGO · ACOG · SMFM"],
  ["OB-51", "OB-F", "P2", "Hématome rétroplacentaire et hémorragies du 2e/3e trimestre", "CNGOF · RCOG"],
  ["OB-52", "OB-F", "P1", "Restriction de croissance fœtale et petit pour l'âge gestationnel", "ISUOG · FIGO · CNGOF"],
  ["OB-53", "OB-F", "P3", "Macrosomie, hydramnios et oligoamnios", "CNGOF · ACOG"],
  ["OB-54", "OB-F", "P2", "Grossesse prolongée et terme de la naissance", "CNGOF · HAS"],
  ["OB-55", "OB-F", "P1", "Grossesse gémellaire et multiple", "CNGOF · ISUOG · FMF"],
  ["OB-56", "OB-F", "P2", "Allo-immunisation et anémie fœtale", "CNGOF · RCOG"],
  ["OB-57", "OB-G", "P1", "Menace d'accouchement prématuré", "CNGOF · HAS"],
  ["OB-58", "OB-G", "P1", "Prévention de l'accouchement prématuré", "CNGOF · ACOG · SMFM"],
  ["OB-59", "OB-G", "P1", "Rupture prématurée des membranes", "CNGOF · RCOG · ACOG"],
  ["OB-60", "OB-G", "P1", "Corticothérapie anténatale, neuroprotection par sulfate de magnésium, naissance périviable", "CNGOF · RCOG · SFN"],
  ["OB-61", "OB-H", "P1", "Travail et accouchement normal", "HAS · CNGOF · CNSF · OMS"],
  ["OB-62", "OB-H", "P2", "Dystocies du travail", "CNGOF · ACOG"],
  ["OB-63", "OB-H", "P1", "Déclenchement du travail", "HAS · CNGOF · NICE · OMS"],
  ["OB-64", "OB-H", "P1", "Rythme cardiaque fœtal, asphyxie et encéphalopathie néonatale", "CNGOF · FIGO · NICE"],
  ["OB-65", "OB-H", "P2", "Présentation du siège et présentations dystociques", "CNGOF · RCOG"],
  ["OB-66", "OB-H", "P1", "Dystocie des épaules", "CNGOF · RCOG"],
  ["OB-67", "OB-H", "P2", "Extractions instrumentales", "CNGOF · RCOG"],
  ["OB-68", "OB-H", "P1", "Césarienne", "HAS · CNGOF · SFAR"],
  ["OB-69", "OB-H", "P2", "Accouchement après césarienne (AVAC/TOLAC) et rupture utérine", "CNGOF · ACOG · RCOG"],
  ["OB-70", "OB-H", "P1", "Lésions obstétricales du périnée et épisiotomie", "CNGOF · RCOG"],
  ["OB-71", "OB-H", "P3", "Procidence et anomalies du cordon", "CNGOF · RCOG"],
  ["OB-72", "OB-H", "P2", "Analgésie et anesthésie obstétricales", "SFAR · OAA"],
  ["OB-73", "OB-I", "P1", "Hémorragie du post-partum", "CNGOF · OMS · FIGO · SFAR"],
  ["OB-74", "OB-I", "P2", "Rétention placentaire, inversion utérine, rupture utérine", "CNGOF · RCOG"],
  ["OB-75", "OB-I", "P1", "Embolie amniotique, collapsus maternel et arrêt cardiaque", "SMFM · SFAR · ERC"],
  ["OB-76", "OB-I", "P2", "Réanimation maternelle, near-miss et mortalité maternelle", "SFAR · CNGOF · OMS"],
  ["OB-77", "OB-J", "P2", "Suites de couches et sortie de maternité", "HAS · CNSF"],
  ["OB-78", "OB-J", "P2", "Allaitement maternel", "HAS · CoFAM · OMS"],
  ["OB-79", "OB-J", "P2", "Complications du post-partum", "CNGOF · ISSHP · ESC"],
  ["OB-80", "OB-J", "P3", "Rééducation périnéale et plancher pelvien du post-partum", "HAS · CNGOF · SIFUD-PP"],
  ["OB-81", "OB-J", "P2", "Réanimation du nouveau-né en salle de naissance", "SFN · ERC · ILCOR"],
  ["OB-82", "OB-J", "P3", "Nouveau-né à risque en suites de naissance", "SFN · HAS"],
  ["OB-83", "OB-J", "P2", "Mort fœtale in utero et deuil périnatal", "CNGOF · HAS"],
  ["OB-84", "OB-J", "P3", "Organisation des soins périnatals", "HAS · CNGOF"],
  ["GY-01", "GY-A", "P1", "Saignements utérins anormaux (SUA)", "FIGO · CNGOF · NICE"],
  ["GY-02", "GY-A", "P2", "Aménorrhées et oligo-aménorrhées", "Endocrine Society · SFE · ASRM"],
  ["GY-03", "GY-A", "P2", "Dysménorrhée, syndrome prémenstruel et TDPM", "CNGOF · RCOG · ACOG"],
  ["GY-04", "GY-A", "P3", "Hyperprolactinémie et adénomes hypophysaires", "SFE · Endocrine Society"],
  ["GY-05", "GY-A", "P1", "Syndrome des ovaires polykystiques (SOPK)", "ESHRE · ASRM · SFE · CNGOF"],
  ["GY-06", "GY-A", "P3", "Hyperandrogénie, hirsutisme et hyperplasie congénitale des surrénales", "Endocrine Society · SFE"],
  ["GY-07", "GY-A", "P2", "Insuffisance ovarienne prématurée (IOP) et ménopause précoce", "ESHRE · IMS · CNGOF"],
  ["GY-08", "GY-A", "P3", "Syndrome de Turner, dysgénésies gonadiques et variations du développement sexuel (DSD)", "ESE · SFEDP · ESPE"],
  ["GY-09", "GY-A", "P2", "Puberté précoce/retardée et gynécologie de l'enfant et de l'adolescente", "SFEDP · ESPE · ACOG"],
  ["GY-10", "GY-A", "P2", "Malformations müllériennes et anomalies congénitales de l'appareil génital", "ESHRE · ESGE · ASRM"],
  ["GY-11", "GY-B", "P1", "Fibromes utérins", "CNGOF · FIGO · ACOG"],
  ["GY-12", "GY-B", "P2", "Adénomyose", "MUSA · CNGOF"],
  ["GY-13", "GY-B", "P2", "Polypes et hyperplasie de l'endomètre", "ESGO · ESHRE · ESGE · RCOG · BSGE"],
  ["GY-14", "GY-B", "P3", "Synéchies utérines, endométrite chronique et cicatrice de césarienne (niche)", "AAGL · ESGE · ESHRE"],
  ["GY-15", "GY-B", "P2", "Hystéroscopie et hystérectomie", "CNGOF · ESGE · ACOG"],
  ["GY-16", "GY-B", "P1", "Endométriose", "CNGOF · ESHRE · HAS"],
  ["GY-17", "GY-B", "P2", "Douleurs pelviennes chroniques et dyspareunie", "EAU · CNGOF · RCOG"],
  ["GY-18", "GY-B", "P3", "Vulvodynie, vestibulodynie et vaginisme", "ISSVD · ISSWSH · IPPS"],
  ["GY-19", "GY-B", "P1", "Kystes ovariens et masses annexielles", "IOTA · ACRad · ESGO · ISUOG · CNGOF"],
  ["GY-20", "GY-C", "P1", "Vulvovaginites, cervicites, vaginose bactérienne, candidoses et trichomonase", "CNGOF · IUSTI · CDC"],
  ["GY-21", "GY-C", "P2", "Infections génitales hautes et abcès tubo-ovarien", "CDC · IUSTI · BASHH"],
  ["GY-22", "GY-C", "P1", "Infections sexuellement transmissibles : dépistage, diagnostic, traitement", "HAS · SPILF · CDC · OMS"],
  ["GY-23", "GY-C", "P2", "Infection à HPV, condylomes et lésions associées", "HAS · CNGOF · OMS"],
  ["GY-24", "GY-C", "P3", "Dermatoses vulvaires", "ISSVD · EDF · Soc. fr. dermatologie"],
  ["GY-25", "GY-D", "P1", "Contraception hormonale", "CNGOF · HAS · OMS"],
  ["GY-26", "GY-D", "P2", "Contraception intra-utérine et implants (LARC)", "CNGOF · HAS"],
  ["GY-27", "GY-D", "P2", "Contraception d'urgence et situations particulières", "CNGOF · HAS · OMS"],
  ["GY-28", "GY-D", "P3", "Stérilisation et contraception définitive", "HAS · CNGOF · AFU"],
  ["GY-29", "GY-D", "P1", "Interruption volontaire de grossesse (IVG)", "HAS · CNGOF · OMS"],
  ["GY-30", "GY-D", "P3", "Dysfonctions sexuelles féminines", "ISSWSH · ESSM · SFSC"],
  ["GY-31", "GY-D", "P2", "Violences sexuelles et mutilations sexuelles féminines (MSF)", "HAS · OMS · CNGOF"],
  ["GY-32", "GY-E", "P1", "Ménopause, périménopause et traitement hormonal", "CNGOF · GEMVi · IMS · NICE"],
  ["GY-33", "GY-E", "P2", "Syndrome génito-urinaire de la ménopause", "CNGOF · GEMVi · ISSWSH"],
  ["GY-34", "GY-E", "P2", "Ostéoporose postménopausique", "GRIO · SFR · ESCEO · IOF"],
  ["GY-35", "GY-E", "P1", "Saignements postménopausiques et endomètre épaissi", "CNGOF · ESGO"],
  ["GY-36", "GY-F", "P1", "Incontinence urinaire d'effort, d'urgence et mixte", "AFU · CNGOF · SIFUD-PP · EAU"],
  ["GY-37", "GY-F", "P1", "Prolapsus des organes pelviens", "CNGOF · SIFUD-PP · IUGA"],
  ["GY-38", "GY-F", "P3", "Fistules uro-génitales et obstétricales", "OMS · FIGO"],
  ["GY-39", "GY-F", "P2", "Infections urinaires récidivantes, cystites et syndrome de la vessie douloureuse", "SPILF · AFU · EAU"],
  ["GY-40", "GY-F", "P3", "Incontinence anale et troubles ano-rectaux", "SNFCP"],
  ["GY-41", "GY-G", "P2", "Consultation gynécologique, examen pelvien et bientraitance", "CNGOF"],
  ["GY-42", "GY-G", "P2", "Douleur pelvienne aiguë et urgences gynécologiques", "CNGOF · ACRad · ESGE"],
  ["GY-43", "GY-G", "P3", "Chirurgie gynécologique : prise en charge périopératoire", "CNGOF · SFAR · ESGE"],
  ["GY-44", "GY-G", "P3", "Santé gynécologique des personnes transgenres et non binaires", "WPATH · Endocrine Society"],
  ["ON-01", "ON-A", "P1", "Dépistage du cancer du col et vaccination HPV", "HAS · INCa · CNGOF · OMS"],
  ["ON-02", "ON-A", "P1", "Lésions précancéreuses du col (CIN, AIS) et colposcopie", "CNGOF · SFCPCV · EFC · ASCCP"],
  ["ON-03", "ON-A", "P1", "Cancer du col de l'utérus", "CNGOF · ESGO · ESTRO · ESP · FIGO"],
  ["ON-04", "ON-A", "P1", "Cancer de l'endomètre", "ESGO · ESTRO · ESP · CNGOF · FIGO"],
  ["ON-05", "ON-A", "P2", "Sarcomes utérins et tumeurs mésenchymateuses", "ESGO · EURACAN · GCIG"],
  ["ON-06", "ON-A", "P1", "Cancer de l'ovaire, de la trompe et du péritoine", "ESGO · ESMO · ESP · FIGO"],
  ["ON-07", "ON-A", "P2", "Tumeurs ovariennes borderline, germinales et des cordons sexuels (tumeurs rares)", "ESGO · EURACAN · TMRG"],
  ["ON-08", "ON-A", "P2", "Cancers de la vulve et du vagin", "ESGO · ESTRO · SIOPe"],
  ["ON-09", "ON-A", "P1", "Maladie trophoblastique gestationnelle", "ESGO · EOTTD · GCIG · ISSTD · FIGO · CNGOF"],
  ["ON-10", "ON-A", "P2", "Prédispositions génétiques aux cancers gynécologiques et mammaires", "GGC · INCa · ESGO · ESMO"],
  ["ON-11", "ON-B", "P1", "Cancer du sein : dépistage, diagnostic, traitement et surveillance", "INCa · SFSPM · ESMO · HAS"],
  ["ON-12", "ON-B", "P3", "Pathologie mammaire bénigne", "SFSPM · CNGOF"],
  ["ON-13", "ON-C", "P2", "Cancer et grossesse", "ESGO · INCIP · ESMO"],
  ["ON-14", "ON-C", "P1", "Préservation de la fertilité en oncologie (onco-fertilité)", "ESHRE · ASCO · ESMO · ABM"],
  ["ON-15", "ON-C", "P3", "Suites de cancer, soins de support et ménopause induite", "ESGO · CNGOF · GEMVi"],
  ["PM-01", "PM", "P1", "Infertilité du couple : définitions, bilan initial et orientation", "OMS · ESHRE · CNGOF · NICE"],
  ["PM-02", "PM", "P1", "Bilan d'infertilité féminine", "ESHRE · ASRM · NICE · OMS"],
  ["PM-03", "PM", "P1", "Infertilité inexpliquée", "ESHRE · NICE · OMS"],
  ["PM-04", "PM", "P1", "Anovulation et induction de l'ovulation", "ESHRE · ASRM · SFE"],
  ["PM-05", "PM", "P2", "Insémination intra-utérine (IIU)", "ESHRE · NICE · ABM"],
  ["PM-06", "PM", "P1", "FIV/ICSI et stimulation ovarienne", "ESHRE · ABM · CNGOF"],
  ["PM-07", "PM", "P2", "Laboratoire de FIV/ICSI et cryoconservation", "ESHRE · ALPHA · BLEFCO"],
  ["PM-08", "PM", "P2", "Transfert embryonnaire, préparation endométriale et soutien lutéal", "ESHRE · ASRM"],
  ["PM-09", "PM", "P1", "Complications de l'AMP", "ESHRE · RCOG"],
  ["PM-10", "PM", "P2", "Échecs d'implantation répétés et add-ons", "ESHRE"],
  ["PM-11", "PM", "P3", "Facteur tubaire et hydrosalpinx", "ESHRE · ASRM · CNGOF"],
  ["PM-12", "PM", "P2", "Facteur utérin et chirurgie de la fertilité", "ESHRE · ESGE · ASRM"],
  ["PM-13", "PM", "P1", "Infertilité masculine", "EAU · ESHRE · AFU · SALF"],
  ["PM-14", "PM", "P2", "Préservation de la fertilité non oncologique et autoconservation ovocytaire", "ABM · CNGOF · ESHRE"],
  ["PM-15", "PM", "P2", "Don de gamètes et d'embryons", "ABM · ESHRE · FFC"],
  ["PM-16", "PM", "P2", "Diagnostic génétique préimplantatoire (PGT)", "ESHRE · ABM"],
  ["PM-17", "PM", "P3", "AMP et infections virales (VIH, VHB, VHC)", "ESHRE · ANRS-MIE"],
  ["PM-18", "PM", "P3", "Psychologie, éthique et droit de la PMA", "ESHRE · CCNE · CNGOF"],
  ["EC-01", "EC", "P1", "Échographie du premier trimestre", "ISUOG · CFEF · CTE"],
  ["EC-02", "EC", "P1", "Échographie morphologique du deuxième trimestre", "ISUOG · CFEF · CTE"],
  ["EC-03", "EC", "P1", "Échographie du troisième trimestre et biométrie", "ISUOG · CFEF"],
  ["EC-04", "EC", "P2", "Doppler obstétrical et surveillance fœtale", "ISUOG · SMFM · CNGOF"],
  ["EC-05", "EC", "P2", "Échocardiographie fœtale", "ISUOG · AHA"],
  ["EC-06", "EC", "P2", "Neurosonographie et IRM fœtales", "ISUOG · CFEF"],
  ["EC-07", "EC", "P1", "Échographie gynécologique", "ISUOG · IOTA · IETA · MUSA · IDEA"],
  ["EC-08", "EC", "P3", "Imagerie pelvienne (IRM, scanner) en gynécologie-obstétrique", "ACRad · CNGOF"],
] as const;

export type PathologyId = (typeof RAW)[number][0];

export type RefDocument = {
  title: string;
  /** true = publié ou mis à jour en 2024–2026 et vérifié dans le référentiel ; false = référence classique à reconfirmer. */
  verified: boolean;
};

export type RefPathology = {
  id: PathologyId;
  section: string;
  sectionTitle: string;
  priority: RefPriority;
  title: string;
  /** Sous-entités que la fiche doit couvrir. */
  scope: string;
  /** Sociétés sources principales. */
  societies: string[];
  /** Sociétés complémentaires ou de comparaison. */
  complementary: string[];
  /** Documents de référence, dans l'ordre d'ingestion recommandé. */
  documents: RefDocument[];
};

export const SECTION_TITLES: Record<string, string> = {
  "OB-A": "Obstétrique — Suivi prénatal, prévention et situations de vulnérabilité",
  "OB-B": "Obstétrique — Dépistage prénatal, diagnostic prénatal et génétique",
  "OB-C": "Obstétrique — Début de grossesse",
  "OB-D": "Obstétrique — Pathologies maternelles médicales et grossesse",
  "OB-E": "Obstétrique — Infections et grossesse",
  "OB-F": "Obstétrique — Placenta, croissance fœtale, liquide amniotique, grossesses multiples",
  "OB-G": "Obstétrique — Prématurité",
  "OB-H": "Obstétrique — Accouchement",
  "OB-I": "Obstétrique — Urgences obstétricales et réanimation maternelle",
  "OB-J": "Obstétrique — Post-partum, allaitement, nouveau-né et deuil périnatal",
  "GY-A": "Gynécologie — Troubles menstruels et endocrinologie gynécologique",
  "GY-B": "Gynécologie — Pathologie utérine, ovarienne et douleur pelvienne",
  "GY-C": "Gynécologie — Infections génitales, IST et dermatoses vulvaires",
  "GY-D": "Gynécologie — Contraception, IVG et santé sexuelle",
  "GY-E": "Gynécologie — Ménopause et vieillissement",
  "GY-F": "Gynécologie — Urogynécologie et plancher pelvien",
  "GY-G": "Gynécologie — Consultation, urgences, chirurgie et populations particulières",
  "ON-A": "Oncologie gynécologique",
  "ON-B": "Sénologie",
  "ON-C": "Cancer, grossesse et fertilité",
  PM: "PMA et médecine de la reproduction",
  EC: "Échographie et imagerie",
};

const DETAILS: Record<string, RefDetailTuple> = {
  ...REF_DETAILS_OB1,
  ...REF_DETAILS_OB2,
  ...REF_DETAILS_GY,
  ...REF_DETAILS_ON_PM_EC,
};

function splitList(value: string): string[] {
  return value ? value.split(" · ") : [];
}

export const REFERENTIEL: RefPathology[] = RAW.map(([id, section, priority, title, societies]) => {
  const [scope, compl, docs] = DETAILS[id] ?? ["", "", []];
  return {
    id,
    section,
    sectionTitle: SECTION_TITLES[section] ?? section,
    priority,
    title,
    scope,
    societies: splitList(societies),
    complementary: splitList(compl),
    documents: docs.map((d) => ({ title: d.slice(1), verified: d.startsWith("▲") })),
  };
});

const BY_ID = new Map<string, RefPathology>(REFERENTIEL.map((p) => [p.id, p]));

export function getPathology(id: PathologyId): RefPathology {
  return BY_ID.get(id)!;
}

/**
 * Droits de réutilisation (annexe D du référentiel) — constats à la date du référentiel, à revérifier.
 * La base actuelle ne contient que des fiches de synthèse rédigées en interne avec citation de la source,
 * pas de texte intégral : c'est la pratique conseillée tant qu'aucune autorisation écrite n'est obtenue.
 */
export const SOURCE_REUSE_NOTES: Record<string, string> = {
  ESC: "Usage personnel et pédagogique ; toute reproduction nécessite une autorisation.",
  ACOG: "Practice Bulletins sous abonnement ; droits d'auteur réservés.",
  ISUOG: "Certaines Practice Guidelines en accès libre, sans licence de réutilisation commerciale.",
  CNGOF: "RPC publiées dans GOFS (Elsevier) : conditions à vérifier avec le Collège et l'éditeur.",
  OMS: "En général CC BY-NC-SA 3.0 IGO : usage non commercial.",
  NICE: "Licence de réutilisation propre, à lire avant un usage commercial.",
  HAS: "Licence de réutilisation propre, à lire avant un usage commercial.",
};

/** Avant d'indexer le texte complet d'un document : autorisation écrite de la société ou de l'éditeur requise. */
export const FULL_TEXT_INGESTION_REQUIRES_WRITTEN_PERMISSION = true;
