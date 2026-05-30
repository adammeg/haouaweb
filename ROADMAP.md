# HawaeMD — Roadmap

> Plan de travail pour aligner l'application Next.js sur les fonctionnalités de la v50 (`hawaemd_v50.html`).
> Mis à jour le 30 mai 2026.

---

## Légende

| Symbole | Signification |
|---------|---------------|
| ✅ | Fait / porté |
| 🔶 | Partiel / WIP |
| ❌ | Manquant |
| 🚫 | Non prévu (obsolète / refusé) |

---

## 1. CŒUR DE L'APPLICATION

| Fonctionnalité | Statut | Notes |
|---|---|---|
| Authentification (auth, rôles) | ✅ | Sessions, middleware, login/signup |
| Multi-utilisateurs (chef, médecin, secrétaire, résident, interne) | ✅ | Store + UserSwitcher |
| Nav sidebar (espaces + outils) | ✅ | AppChrome + ToolsNavGroups |
| Sauvegarde locale + indicateur | ✅ | Storage banner + auto-save |
| Bridge DICOM | ✅ | Polling localhost:3847, indicator |
| 📷 Écho (OCR Camera) | ✅ | OcrCameraModal |
| Setup wizard (première connexion) | ❌ | v50 a 3-step onboarding |
| Mode hors-ligne / PWA | ✅ | PwaRegister |

---

## 2. SALLE D'ATTENTE (`/salle-attente`)

| Fonctionnalité | Statut | Notes |
|---|---|---|
| En-tête date + stats (total / attente / consult / terminés) | ✅ | Port v50 exact |
| File du jour (queue avec statuts) | ✅ | Port v50 exact |
| Formulaire ajout rapide (nom, prénom, tél, motif, heure) | ✅ | Crée dossier auto si inexistant |
| Cartes patient (avatar, infos, ⏱ attente, badge statut) | ✅ | Port v50 exact |
| Boutons ▶ Appeler / ✓ Terminer / ✕ Retirer | ✅ | |
| Onglet Agenda semaine intégré | ✅ | Grille complète avec navigation ‹ › |
| Sidebar RDV programmés du jour | ✅ | Avec bouton 🚪 Faire entrer |
| Sidebar Actions rapides | ✅ | Nouveau dossier / Dossier actif / Dashboard |
| Badge navigation (patients en cours) | ✅ | Sidebar + topbar |

---

## 3. DOSSIER PATIENT (`/dossier`)

### 3.1 Onglets du dossier

| Tab | Statut | Composant | Notes |
|-----|--------|-----------|-------|
| 📋 Anamnèse | ✅ | `AnamneseTab` | Gyn/Obst/Inf complets |
| 🩺 Examen clinique | ✅ | `ExamenCliniqueTab` | |
| 🔬 Examens & Bilans | ✅ | `ExamensBilansTab` | |
| 📊 Scores | 🔶 | `DossierScoresTab` | **Seul Bishop** — v50 en a 13 |
| 🌬️ Hawae | ✅ | `HawaeUnifiedPanel` | Scores + LLM + Q&A fusionné |
| ✅ Checklist | ✅ | `DossierChecklistTab` | |
| 🕐 Historique | ✅ | `DossierHistoriqueTab` | |
| 📄 Docs | 🔶 | Redirige vers `/documents` | v50 a 8 types de doc + galerie |
| 🧾 Certificat | 🔶 | Redirige vers `/certificats` | v50 a 9 modèles |
| 🧬 PMA / FIV | ✅ | `PmaClient` (embedded) | Uniquement si `specialite === "inf"` |
| 📚 Protocoles (in-dossier) | ❌ | — | v50 a 12 fiches + protocoles service |
| 🔔 Rappels (in-dossier) | ❌ | — | v50 a un onglet rappels |
| 📈 Partogramme (in-dossier) | ❌ | — | v50 a l'onglet + canvas OMS |

### 3.2 Scores manquants dans l'onglet dossier

| Score | v50 ID | Statut | Notes |
|-------|--------|--------|-------|
| Bishop | ✅ | `bishop` | Déjà présent |
| AVAC / MFMU | ❌ | `avac` | VBAC probability |
| Flamm & Geiger | ❌ | `flamm` | VBAC prediction |
| Manning (BPP) | ❌ | `manning` | Bien-être fœtal |
| Apgar | ❌ | `apgar` | Nouveau-né |
| Risque HPP | ❌ | `hpp` | Hémorragie post-partum |
| FIGO Col utérin | ❌ | `figo_col` | Cancer du col |
| FIGO Endomètre | ❌ | `figo_endo` | Cancer de l'endomètre |
| FIGO Ovaire | ❌ | `figo_ovaire` | Cancer de l'ovaire |
| rASRM Endométriose | ❌ | `rasrm` | Score d'endométriose |
| Ménopause (Greene + Kupperman) | ❌ | `menopause` | |
| Cancer du sein | ❌ | `sein` | Risque / staging |
| Croissance fœtale (RCIU) | ❌ | `rciu` | Courbes Hadlock |

### 3.3 Nouveau dossier (add patient)

| Fonctionnalité | Statut | Notes |
|---|---|---|
| Modal « Nouvelle patiente » | ✅ | Nom, prénom, DDN, tél, motif |
| Bouton header « Nouvelle » | ✅ | Ouvre le modal |
| Lien sidebar « Nouvelle patiente » | ✅ | Ouvre le modal |
| Lien `?new=1` settings | ✅ | Lien conservé |
| Bouton dossier list | ✅ | Ouvre le modal |
| Bouton 🚪 Attente (dossier ouvert) | ✅ | Envoie en salle d'attente |
| `createPatientFromForm()` | ✅ | Store |

---

## 4. SCORES CLINIQUES (`/scores`)

| Fonctionnalité | Statut | Notes |
|---|---|---|
| Page `/scores` standalone | ✅ | 16 outils interactifs |
| Hawae Assist Engine (16 scores auto) | ✅ | `lib/assist/` — moteur client-side |
| Fusion Assist + Hawae | ✅ | `HawaeUnifiedPanel` |
| Scores multiples dans dossier | 🔶 | Voir 3.2 |

---

## 5. PMA / FIV

| Section v50 | Statut | Notes |
|---|---|---|
| 👤 Profil patient | ✅ | `PmaClient` - profil |
| 🔬 Réserve ovarienne | ✅ | AMH, FSH, AFC |
| 🧪 Hormones | 🔶 | À vérifier vs v50 |
| 📂 Historique FIV | ✅ | Cycles |
| 🤖 Analyse Hawae | ✅ | Analyse IA |
| 💊 Protocole stimulation | ✅ | `ivf/protocol` |
| 📅 Calendrier traitement | ✅ | |
| 🔁 Adaptation protocole | ❌ | Section adaptation manquante |
| Page `/pma` → redirect dossier | ✅ | |

---

## 6. PARTOGRAMME

| Fonctionnalité | Statut | Notes |
|---|---|---|
| Page `/partogramme` standalone | ✅ | |
| Onglet in-dossier | ❌ | v50 a `tab-partogramme` |
| Courbe de dilatation OMS (canvas) | ❌ | v50 a alert line + action line |
| Saisie modal (dilatation, descente, BCF, LA, etc.) | ✅ | `parto-modal` |
| Issue de naissance (Apgar, poids, mode) | ✅ | `parto-outcome-modal` |
| Simulation clinique (6 scénarios) | ❌ | v50 a `sim-modal` |

---

## 7. CERTIFICATS (`/certificats`)

| Modèle v50 | Statut | Notes |
|---|---|---|
| ✅ Aptitude / Inaptitude | ❌ | Page actuelle redirige |
| Arrêt de travail prolongation | ❌ | |
| Certificat pour sport | ❌ | |
| Certificat pour voyage | ❌ | |
| Certificat pour assurance | ❌ | |
| Constatation de violences | ❌ | |
| Congé maternité | ❌ | |
| Scolarité | ❌ | |
| Suivi PMA | ❌ | |

---

## 8. PROTOCOLES / FICHES CLINIQUES (`/protocoles`)

| Fiche v50 | Statut | Notes |
|---|---|---|
| 🚨 MAP (Menace Accouchement Prématuré) | 🔶 | Page actuelle liste statique |
| 🔴 Pré-éclampsie sévère | 🔶 | |
| 💧 RPM (Rupture Prématurée Membranes) | 🔶 | |
| 🩸 HPP (Hémorragie Post-Partum) | 🔶 | |
| 🍬 Diabète Gestationnel | 🔶 | |
| ⚠️ GEU | 🔶 | |
| 🔵 SOPK | 🔶 | |
| 🌸 Endométriose | 🔶 | |
| 🟡 Cholestase Gravidique | 🔶 | |
| 🌀 Torsion d'annexe | 🔶 | |
| 💔 MFIU | 🔶 | |
| 🌿 FCS | 🔶 | |
| Protocoles du service (CRUD) | ❌ | v50 permet création/modification |

---

## 9. DOCUMENTS & GALERIE (`/documents`)

| Fonctionnalité | Statut | Notes |
|---|---|---|
| Galerie par patiente | ❌ | v50 a `doc-gallery-modal` |
| CR de consultation | ✅ | via PDF |
| CR opératoire | ❌ | v50 a `op-modal` |
| Ordonnance | ✅ | `OrdonnanceModal` |
| Lettre de liaison | ❌ | |
| Bon d'examen | ❌ | |
| Plan de suivi | ❌ | |
| Dossier complet PDF | ✅ | `dossier-pdf.ts` |

---

## 10. DASHBOARD (`/dashboard`)

| Fonctionnalité | Statut | Notes |
|---|---|---|
| Vue Cabinet (RDV du jour, file attente, KPIs) | ❌ | v50 a `dv2-cabinet` |
| Vue Statistiques (10 modes d'analyse) | ❌ | v50 a `dv2-stats` |
| Pyramide des âges | ❌ | |
| Top pathologies (prévalence) | ❌ | |
| Âge × pathologie | ❌ | |
| Activité mensuelle | ❌ | |
| Par spécialité (donut) | ❌ | |
| IMC distribution | ❌ | |
| DG par terme | ❌ | |
| Distribution parité | ❌ | |
| HTA par âge | ❌ | |
| Tendances 12 mois | ❌ | |
| Export CSV / PDF / JSON | ❌ | |
| ClinicalDashboard (recharts) | 🔶 | Actuel a des graphs statiques |

---

## 11. ADMIN & SETTINGS

| Fonctionnalité | Statut | Notes |
|---|---|---|
| Profil médecin (nom, titre, spécialité, licence) | 🔶 | `/settings` actuel |
| Établissement (nom, service, adresse, CNAM) | 🔶 | |
| Apparence (thème, accent colors) | 🔶 | |
| Sécurité (PIN secrétaire, PIN admin) | ❌ | |
| Setup wizard (3-step) | ❌ | |
| Admin console (clinic, users, training) | ✅ | `/admin` |
| Multi-user profiles | ✅ | `UserSwitcher` |

---

## 12. COURBES BIOLOGIQUES

| Courbe v50 | Statut | Notes |
|---|--------|--------|
| 💉 TA systolique | ❌ | v50 a 5 courbes intéractives canvas |
| 🩸 Hémoglobine | ❌ | |
| 🍬 Glycémie | ❌ | |
| ⚖️ Poids | ❌ | |
| 📅 Terme (SA) | ❌ | |

---

## 13. RAPPELS (`/rappels`)

| Fonctionnalité | Statut | Notes |
|---|---|---|
| Page `/rappels` standalone | ✅ | |
| Onglet in-dossier | ❌ | v50 a `tab-rappels` |

---

## 14. BACKUP / DONNÉES

| Fonctionnalité | Statut | Notes |
|---|---|---|
| Export JSON des patients | ✅ | backup modal |
| Import JSON | ✅ | |
| Clinical data sync | ✅ | `clinical-data-sync` |
| Workspace sync | ✅ | `workspace-sync` |

---

## Priorités suggérées

### Phase 1 (immédiat) — Consolider le dossier
1. Scores manquants dans l'onglet dossier (13 scores à intégrer)
2. Onglet Partogramme in-dossier avec canvas OMS
3. Onglet Protocoles in-dossier (12 fiches)
4. Docs/Certificat : remplacer les redirects par le contenu réel

### Phase 2 — Dashboard & Statistiques
5. Vue Cabinet (aujourd'hui)
6. 10 modes d'analyse avec recharts
7. Export CSV/PDF/JSON

### Phase 3 — Fonctionnalités avancées
8. 9 modèles de certificats
7. 8 types de documents + galerie
8. CR opératoire modal
9. Adaptation protocole PMA
10. Simulation parto (6 scénarios)

### Phase 4 — Finition
11. Courbes biologiques (5 canvas)
12. Protocoles du service (CRUD)
13. Setup wizard
14. PIN sécurité

---

## Statistiques

| Métrique | v50 | Actuel |
|----------|-----|--------|
| Onglets dossier | 14 | 10 (+1 conditionnel PMA) |
| Scores dossier | 14 | 1 (Bishop) |
| Scores standalone | 14+ | 16 |
| Modèles certificat | 9 | 0 (redirect) |
| Types document | 8 | 2-3 |
| Modes analyse dashboard | 10 | 0 (stats simples) |
| Fiches protocoles | 12 | 0 (liste statique) |
| Courbes biologiques | 5 | 0 |
| PMA sub-sections | 8 | 6-7 |
| Certificats | ✅ 9 models | ❌ redirect |
| Partogramme in-dossier | ✅ | ❌ |
