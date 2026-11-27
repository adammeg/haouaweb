# Refonte du dossier, étape 1 : le socle commun

Statut : **codé sur `feat/ux-refonte` le 26/11/2026, non commité**, testé sur dossiers fictifs uniquement.
Code : `src/lib/dossier/socle.ts`, `src/components/dossier/socle-card.tsx` ; tests : `tests/socle.test.mjs`.
Avant mise en ligne : vérifier la reprise sur une copie de la base réelle (section 5, point 6) et
trancher les questions de la section 7.
Date : 26/11/2026. Branche de travail : `feat/ux-refonte`.

## 1. Objectif

Ce qui est vrai pour la patiente quelle que soit la consultation se saisit **une seule fois**, dans un socle
commun affiché à l'identique en gynécologie, obstétrique et infertilité. Une patiente suivie en
gynécologie puis enceinte, puis en PMA, ne ressaisit rien.

Cette étape ne crée ni épisodes ni examens datés (étapes 2 et 3). Elle ne supprime aucune donnée.

## 2. Constat dans le code actuel

- Le même antécédent existe en 2 ou 3 champs selon la spécialité : G/P/A (`g_gest`, `o_gest`, `i_gest`
  et leurs `_par`, `_abort`), ménarche, durée et régularité du cycle, dysménorrhée, dyspareunie, IST,
  contraception.
- Plusieurs versions « infertilité » ne sont lues par **rien** : `i_gest`, `i_par`, `i_abort`,
  `i_menarche`, `i_dysmen`, `i_contra`, `i_ist`. Hawae, les alertes et le PDF ne voient donc pas
  l'histoire gynécologique d'une patiente en infertilité.
- Des antécédents valables à vie ne sont demandés qu'en obstétrique : thrombose, thrombophilie, lupus,
  SAPL, pré-éclampsie, prématurité, césariennes. Ils sont absents en gynécologie, où ils comptent pourtant
  (contraception œstroprogestative, THM).
- Le groupe sanguin existe deux fois : `o_grp` (lu par le bandeau, les alertes, la checklist, Hawae)
  et `bio_groupe` (lu par rien).
- **Conflit sur `imc`** : en gynécologie il est recalculé depuis le poids du jour ; en obstétrique le
  même champ est libellé « IMC pré-grossesse » et sert au score MFMU. Une valeur peut écraser l'autre.
- **Aucun champ d'antécédents familiaux** (cancer du sein ou de l'ovaire, diabète, thrombose, maladie
  génétique), alors que les fiches de Hawae y renvoient.

## 3. Contenu du socle

Colonne « Remplace » : champs actuels repris lors de la migration.

### 3.1 Identité
| Donnée | Remplace | Remarque |
|---|---|---|
| Nom, prénom, date de naissance, téléphone, CIN, profession | identiques | inchangé |
| Taille (cm) | `ec_taille` | stable chez l'adulte ; le poids reste à l'examen du jour |
| Origine | `ethnie` | utilisée par les calculs FMF et MFMU ; donnée sensible, l'écran dit pourquoi elle est demandée |

### 3.2 Antécédents médicaux et mode de vie
| Donnée | Remplace |
|---|---|
| HTA, diabète, thyroïde | `hta`, `diabete`, `thyroide` |
| Thrombose veineuse (TVP/EP) | `o_atcd_vte` |
| Thrombophilie, lupus, SAPL | `o_thrombophilie`, `o_led`, `o_apl` |
| Autres antécédents médicaux | `atcdMed` |
| Allergies | `allergies` (déjà conservées entre consultations) |
| Traitements en cours | `traitements` |
| Tabac | `tabac` |

### 3.3 Antécédents chirurgicaux
| Donnée | Remplace |
|---|---|
| Chirurgies (dont pelvienne) | `chir` |
| Cœlioscopie, hystéroscopie : date et résultat | `i_coelio`, `i_hystero` |

### 3.4 Antécédents familiaux (nouveau)
Cancer du sein ou de l'ovaire (lien de parenté, âge), diabète, thrombose, maladie génétique, autre.

### 3.5 Histoire gynécologique
| Donnée | Remplace |
|---|---|
| Âge de la ménarche | `g_menarche`, `i_menarche` |
| Cycle : durée, durée des règles, régularité, abondance | `g_cycle`/`i_cycle`, `g_regles`, `g_reg`/`i_reg`, `g_abond` |
| Dysménorrhée, dyspareunie | `g_dysmen`/`i_dysmen`, `g_dysp`/`i_dysp` |
| Ménopause (âge) | `g_meno` |
| Contraception actuelle | `g_contra` |
| Contraceptions antérieures | `i_contra` |
| Antécédents d'IST / salpingite | `g_ist`, `i_ist` |
| Dernier frottis : date et résultat | `g_fcv`, `g_fcv_res` |
| Pathologies gynécologiques connues, endométriose, contexte oncologique | `g_patho`, `g_endometriose`, `g_oncologie` |

### 3.6 Histoire obstétricale
| Donnée | Remplace |
|---|---|
| Gestité, parité, fausses couches/IVG | `g_*`, `o_*`, `i_*` (`_gest`, `_par`, `_abort`) |
| Nombre de césariennes et indication | `o_ncs`, `o_indcs` |
| Pré-éclampsie, prématurité spontanée | `o_atcd_pe`, `o_atcd_prematurite` |
| Complications et détail des grossesses précédentes | `o_complic`, `o_atcd_gross` |

À l'étape 3, G/P/A sera **calculé** à partir de la liste des grossesses antérieures au lieu d'être saisi.

### 3.7 Groupe sanguin et immunités
| Donnée | Remplace |
|---|---|
| Groupe / Rhésus | `o_grp`, `bio_groupe` |
| Rubéole, toxoplasmose : dernier statut connu | `o_rubeo`/`bio_rubeole`, `o_toxo`/`bio_toxo` |

Les contrôles répétés (toxoplasmose mensuelle d'une patiente non immunisée) deviendront des résultats
datés à l'étape 2 ; le socle n'affiche alors que le dernier statut avec sa date.

## 3 bis. Fluidité : un socle qui revient à chaque consultation

Validé par le médecin le 26/11/2026 : le socle est une **anamnèse complète, saisie une fois, qui revient
identique à chaque consultation** ; elle ne change que si un événement ou une correction le justifie.

1. **Première consultation** : le socle se remplit comme une anamnèse classique, section par section.
2. **Consultations suivantes** : il s'affiche en **résumé lisible**, pas en formulaire, par exemple
   « G3P2 (1 césarienne), 1 FCS · HTA traitée · Allergie : pénicilline · Ménarche 12 ans, cycles
   réguliers 28 j ». Un seul bouton « Rien de nouveau » le confirme ; chaque section a « Modifier ».
3. **Événements en un geste** : un bouton « Nouvel événement » propose Accouchement, Fausse couche,
   IVG, Grossesse extra-utérine, Chirurgie, Nouveau diagnostic, Nouveau traitement, Nouvelle allergie,
   Ménopause. Chaque choix ouvre un mini-formulaire (2 à 4 champs) et met à jour le socle lui-même :
   un accouchement par césarienne ajoute une grossesse, une parité et une césarienne avec son indication.
4. **Traçabilité** : chaque modification du socle est datée et visible (« Modifié le 26/11/2026 :
   allergie ajoutée »). Rien n'est effacé sans trace.
5. **Fin de grossesse** (étape 3) : clôturer l'épisode grossesse avec son issue alimente
   automatiquement l'histoire obstétricale, sans ressaisie.
6. **Information à confirmer** : si une donnée du socle n'a pas été revue depuis longtemps (traitements,
   contraception, frottis), elle est signalée « à vérifier » sans bloquer la consultation.

## 4. Ce qui ne va pas dans le socle

| Donnée | Où elle va | Pourquoi |
|---|---|---|
| DDR | consultation (gynéco) ou grossesse (`o_ddr`) | elle change à chaque cycle ; la DDR de grossesse date l'épisode |
| Motif, symptômes, début | consultation | propres au jour |
| Poids, TA, examen | examen du jour | mesures |
| IMC pré-grossesse | grossesse | distinct de l'IMC du jour ; résout le conflit sur `imc` |
| Âge du conjoint, spermogramme, tentatives AMP, OHSS | projet PMA (dossier couple) | propres au parcours |
| Bilans et échographies | examens (étape 2) | résultats datés |

## 5. Reprise des dossiers existants

Règle : **aucune valeur clinique n'est choisie automatiquement quand deux sources se contredisent.**

1. Une seule source remplie : elle est reprise.
2. Plusieurs sources identiques après normalisation (espaces, casse, « A+ » et « A Rh+ ») : reprise.
3. Sources différentes : les deux valeurs sont conservées et le dossier affiche
   « 2 valeurs différentes pour le groupe sanguin : A+ (anamnèse obstétricale), A− (bilans). Choisir. »
   Le choix du médecin est enregistré avec sa date.
4. Les anciens champs ne sont pas effacés pendant la transition : ils restent en lecture, ce qui permet
   de revenir en arrière.
5. Les consultations archivées contiennent les anciens noms de champs : une seule fonction de lecture
   résout ancien et nouveau nom, pour que l'historique et le PDF restent justes.
6. La reprise est vérifiée sur une copie de la base réelle avant toute mise en ligne, avec le décompte
   des conflits par champ.

## 6. Ce qu'il faut modifier dans le code

Fonctions qui lisent aujourd'hui une des versions dupliquées et devront lire le socle :
`build-dossier-context` (Hawae), `build-context`, `checklists`, `ml-alerts`, `patient-banner`,
`patient-meta`, `dossier-pdf`, `clinical-sections`, `assist/profile`, `epid-analytics`, `mfmu-score`,
`ivf-profile-mapper`, `obst-calendrier-panel`, `obst-partogram-panel`, `authorized-patient-context`,
`learning-features`, `epidemiology`, `breast-cancer-score`, ainsi que `extractIdentitySnapshot`
et `emptyConsultFields`.

Tests à ajouter : un cas de reprise par règle de la section 5 ; tous les scores et alertes doivent
donner le même résultat avant et après la reprise, sur les mêmes dossiers de test.

## 7. Questions à trancher par le médecin

1. ~~Ajoute-t-on les antécédents familiaux ?~~ Oui : l'anamnèse doit être complète (26/11/2026).
   Reste à valider la liste de la section 3.4.
2. La contraception actuelle est-elle dans le socle ou revue à chaque consultation ?
3. Rubéole et toxoplasmose : un statut dans le socle suffit-il en attendant l'étape 2 ?
4. Cœlioscopie et hystéroscopie : antécédents chirurgicaux ou bilan PMA ?
5. Faut-il conserver « Origine », et sous quel libellé ?
6. Prolapsus génital (`g_prolapsus`) : antécédent ou problème suivi en gynécologie ?

## 8. Écart avec la v51

À consigner dans le journal des décisions du ROADMAP : socle commun aux trois spécialités, avec
responsable et justification clinique (suppression des ressaisies, antécédents vasculaires visibles en
gynécologie, données d'infertilité enfin lues par Hawae et les alertes).
