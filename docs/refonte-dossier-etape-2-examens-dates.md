# Refonte du dossier, étape 2 : échographies et biologies datées

Statut au 26/11/2026 :
- **partie 1 commitée** (`f3481a3`) : biologie datée par bilan ;
- **partie 2 codée, non commitée** : échographies datées (datation précoce, croissance, Doppler et BPP,
  cervicométrie, pelvienne, bilan d'infertilité, monitorage folliculaire), sous-onglet « Écho & BPP »
  retiré, et **import d'un compte rendu** (PDF ou photo) : archivage dans les documents de la patiente,
  lecture du texte sur le poste, masquage de l'identité, classement par Hawae (ou lecture locale si l'IA
  n'est pas configurée), examen prérempli à vérifier par le médecin avant enregistrement.
- Restent : écho T1 + FMF et Morpho T2 en examens datés, Bridge échographe, reprise des consultations
  archivées, courbes.

## 1. Objectif

Une échographie ou un bilan biologique est un **examen fait à une date**, pas une case du dossier.
Chaque examen est conservé avec sa date et, pendant une grossesse, le terme à cette date. On peut
en faire plusieurs du même type (deux échos de croissance au T3, un monitorage folliculaire) sans
écraser le précédent, et suivre l'évolution en courbes.

## 2. Constat dans le code actuel

- **Les mesures sont des cases uniques.** Une deuxième écho de croissance écrase la première, sauf
  à créer une nouvelle consultation ; le monitorage folliculaire est impossible.
- **La même mesure existe deux fois, et les scores prennent la mauvaise.** Col, BIP, PC, CA, LF, PFE,
  Doppler ombilical et cérébral existent dans l'anamnèse obstétricale (`o_col`, `o_bip`…) et dans la
  Morpho T2 (`t2_col`, `t2_bip`…). Les calculs (`assist/profile`) prennent **toujours la valeur de
  l'anamnèse en premier**, même si celle de la Morpho est plus récente. Exemple : col à 35 mm saisi il
  y a 6 semaines dans l'anamnèse, 20 mm aujourd'hui dans la Morpho : le calcul utilise 35 mm.
  Même chose pour glycémie, HGPO et AMH entre anamnèse et Bilans.
- **Le Bridge échographe range toutes les biométries dans la Morpho T2**, y compris une écho de
  croissance du T3, et elles sont alors ignorées par les calculs si l'anamnèse contient une valeur.
- **Pas de datation échographique** : aucun champ LCC, alors que la LCC entre 11 SA et 13 SA + 6 j est
  la référence pour dater la grossesse.
- **Pas d'échographie gynécologique structurée** : seulement « masse ovarienne max » et un texte
  libre « Résultats échographie » dans les Bilans.
- **Une vingtaine de dosages des Bilans ne sont lus par rien** (CRP, transaminases, créatinine,
  ferritine, prolactine…) et sont présentés en une seule liste de ~40 cases.

## 3. Modèle proposé

Chaque examen est une entrée datée, rattachée à la patiente (comme l'anamnèse commune, il n'est
jamais vidé par une nouvelle consultation) :

```
Examen
  id, date, type, terme à la date (si grossesse), fœtus (A, B… en grossesse multiple, plus tard)
  valeurs : { mesure → valeur }       ex. { lcc: "62", cn: "1.8", papp_a_mom: "0.9" }
  conclusion (texte libre)
  origine : saisie | Bridge échographe | reprise d'un ancien dossier
  journal : créé / modifié le … par …
```

**Compatibilité** : à l'enregistrement, la valeur de chaque mesure issue de **l'examen le plus récent**
est recopiée dans le champ actuel correspondant. Les scores, alertes, Hawae, PDF et ordonnances
continuent de fonctionner sans être réécrits, et « la valeur la plus récente gagne » remplace la
priorité arbitraire actuelle.

## 4. Types d'examens

### Échographies
| Type | Spécialité, période | Contenu |
|---|---|---|
| Écho de datation précoce | grossesse < 11 SA | sac, embryon, LCC, activité cardiaque, nombre, localisation |
| Écho T1 et dépistage | 11 SA – 13 SA + 6 j | LCC (propose la datation), CN, os nasal, ductus venosus, IP utérines, PAM, **biologie du dépistage (PAPP-A, βhCG libre, PlGF en MoM)** et calcul FMF |
| Écho T2 morphologique | 20 – 25 SA | module Morpho T2 actuel, devenu un examen daté |
| Écho de croissance T3 | ≥ 26 SA | BIP, PC, CA, LF, PFE et percentile, liquide amniotique, placenta, présentation, col |
| Doppler et BPP | grossesse | IP ombilical, cérébral, utérines, ductus, score de Manning |
| Écho pelvienne | gynécologie | utérus, endomètre (mm), myomes (FIGO), ovaires, masse (taille, O-RADS) |
| Écho de bilan d'infertilité | infertilité | CFA par ovaire, endomètre, utérus, ovaires |
| Monitorage folliculaire | infertilité | jour de stimulation, follicules par ovaire (tailles), endomètre, E2/LH/P4 du jour |

### Biologies (saisies par bilan, seules les analyses du bilan s'affichent)
| Bilan | Analyses |
|---|---|
| Prénatal T1 | groupe/Rh, RAI, toxoplasmose, rubéole, AgHBs, VIH, syphilis, NFS, glycémie à jeun, ECBU |
| T2 / dépistage diabète | HGPO 75 g (0, 1 h, 2 h), NFS, RAI si Rh−, toxoplasmose si non immune |
| T3 | NFS, RAI si Rh−, toxoplasmose si non immune, prélèvement vaginal (strepto B) |
| Pré-éclampsie | NFS, plaquettes, ASAT/ALAT, créatinine, acide urique, protéinurie, sFlt-1/PlGF |
| Hormonal J2-J4 | FSH, LH, E2, AMH, prolactine, TSH, testostérone, DHEAS, progestérone |
| Thyroïde | TSH, T4L |
| Marqueurs tumoraux | CA-125, HE4 (calcul ROMA) |
| Préopératoire | NFS, TP, TCA, fibrinogène, groupe/RAI |
| Autre | analyse libre (nom, valeur, unité) |

Le groupe sanguin, la rubéole et la toxoplasmose restent dans l'anamnèse commune : un bilan qui les
contient met à jour l'anamnèse commune (dernier statut, avec sa date).

## 5. Écrans

- **Onglet « Examens »** (remplace « Examens et bilans ») : frise des examens du plus récent au plus
  ancien (date, terme, type, 2 ou 3 valeurs clés, conclusion), filtres Échographies / Biologie, et
  deux boutons « + Échographie » et « + Biologie ». Le type proposé par défaut dépend de la
  spécialité et du terme (ex. Écho T1 à 12 SA).
- **Courbes** : biométrie et PFE (percentiles), Hb, glycémie, AMH, endomètre et follicules.
- **Anamnèse obstétricale** : les sous-onglets T1 / FMF, Écho et BPP, Morpho T2 et Séro et bio
  disparaissent ; ils deviennent des examens. La consultation garde le motif, la grossesse en cours,
  la surveillance et le calendrier.
- **Anamnèse infertilité** : CFA, AMH et bilan hormonal passent dans les examens ; restent le motif,
  l'histoire du couple et les tentatives antérieures.
- **Bridge échographe** : crée un examen (croissance ou morpho selon le terme) au lieu d'écrire dans
  la Morpho T2.

## 6. Reprise des dossiers existants

1. Les consultations archivées contiennent les valeurs de l'époque avec leur date : chaque mesure
   qui change d'une consultation à l'autre devient un examen daté de cette consultation.
2. Les valeurs de la consultation en cours deviennent un examen daté de la dernière sauvegarde du
   dossier, marqué « date de reprise, à confirmer ».
3. Les doublons (`o_col` et `t2_col`…) sont fusionnés par date ; si deux valeurs différentes ont la
   même date, les deux sont montrées au médecin, comme à l'étape 1.
4. Rien n'est effacé ; reprise vérifiée sur une copie de la base réelle avant mise en ligne.

## 7. Questions à trancher par le médecin

1. La liste des types d'écho et des bilans (section 4) vous convient-elle ? Manque-t-il l'écho du
   post-partum, la cervicométrie isolée, l'hystérosonographie ?
2. La LCC du T1 doit-elle **proposer** de recaler la date de début de grossesse (le médecin valide),
   ou seulement l'afficher ?
3. Grossesses multiples (biométries par fœtus A, B) : dans cette étape ou plus tard ?
4. Faut-il signaler les valeurs hors normes (ex. Hb < 11 g/dL) dès cette étape ? Chaque seuil devra
   être validé et sourcé.
5. La secrétaire peut-elle saisir des résultats de biologie, ou seulement le médecin ?

## 8. Ordre de réalisation proposé

1. Modèle des examens, projection « valeur la plus récente », onglet Examens avec biologies par bilan.
2. Échographies obstétricales (datation, T1 + FMF, Morpho T2, croissance, Doppler/BPP), Bridge.
3. Échographies gynécologique et d'infertilité, monitorage folliculaire.
4. Reprise des dossiers et courbes.

Chaque partie est livrable seule, testée, et consignée comme écart avec la v51.
