# HawaeMD — MVP Roadmap

> Product target: turn the `hawaemd_v51 (1).html` proof of concept into a production-ready Next.js application without losing the POC's clinical workflows, calculations, content, or visual identity.
>
> Source of truth for parity: `../hawaemd_v51 (1).html`.
>
> Last updated: 2026-07-12.

## 1. MVP outcome

The MVP is complete when a practitioner can run a full consultation—from patient arrival to clinical record, decision support, documents, follow-up, and backup—with the same useful behavior as the v51 POC, in a secure and maintainable multi-tenant application.

The Next.js product may improve the POC with authentication, MongoDB persistence, mobile access, and better offline support. These additions are welcome, but they must not remove, rename, simplify, or silently change a v51 clinical workflow.

The MVP must be:

- clinically exact: identical inputs produce identical scores, alerts, percentiles, and recommendations;
- visually faithful: the final v51 design layer is reproduced across desktop and mobile;
- workflow complete: every critical POC journey works end to end with real persistence;
- safe: no fabricated clinical values, no silent data loss, and no cross-patient or cross-clinic data leakage;
- testable: parity is demonstrated with fixtures and acceptance tests, not visual inspection alone;
- deployable: production build, environment validation, backups, error states, and release checks are documented.

## 2. Product rules

1. **v51 is the parity contract.** When current code and the POC differ, reproduce v51 unless this roadmap explicitly marks the new behavior as an intentional improvement.
2. **Clinical safety comes before new features.** A score or alert that returns a different result blocks release.
3. **No dead or duplicate product paths.** Consolidate parallel document, certificate, score, and modal implementations.
4. **One patient context everywhere.** Documents, history, reminders, partograms, PMA data, and exports must always be scoped to the selected patient and clinic.
5. **No placeholder completion.** A screen is not complete until its save, reload, edit, delete, empty, loading, error, print/export, and permission behavior works where applicable.
6. **Responsive parity.** Desktop is the primary clinical workspace; tablet and mobile must remain usable without clipped actions or inaccessible dialogs.

## 3. Release gates

The MVP cannot ship unless all gates are green.

| Gate | Required result |
|---|---|
| Clinical parity | Golden fixtures pass for all scores, percentiles, alerts, and partogram rules |
| Critical journeys | All journeys in section 5 pass end to end |
| Data safety | Backup/restore round-trip loses no supported data; patient and tenant isolation tests pass |
| POC parity | Every P0/P1 item in the parity matrix is accepted or explicitly waived by the product owner |
| UI quality | v51 tokens, typography, layout, states, and responsive behavior pass visual review |
| Accessibility | Keyboard navigation, focus handling, labels, contrast, and reduced-motion behavior pass review |
| Engineering | TypeScript, lint, automated tests, and `npm run build` pass with no release-blocking warnings |
| Operations | Environment variables, database indexes, logs, health checks, migration/seed steps, and rollback are documented |

## 4. Priority model

- **P0 — release blocker:** clinical correctness, data loss, privacy, authentication, broken primary journey.
- **P1 — MVP parity:** visible or functional v51 behavior needed for a complete daily workflow.
- **P2 — post-MVP:** useful enhancement that does not block safe daily use.

Work is executed in dependency order. A later phase must not hide unfinished P0 work in an earlier phase.

## 5. Critical user journeys

Each journey needs an automated happy-path test and a manual failure/edge-case review.

1. **First launch:** create clinic → create practitioner → complete three-step setup → configure practitioner and establishment → choose user → enter workspace.
2. **Patient arrival:** create/find patient → book or check in appointment → move through waiting room → open the correct record.
3. **Gynaecology consultation:** anamnesis → examination → investigations → scores/Hawae → checklist → save → archive consultation → generate documents.
4. **Obstetric consultation:** pregnancy data → clinical exam → T2 morphology/biometry → percentiles and alerts → pregnancy follow-up entry → plan and export.
5. **Labour:** open patient partogram → record observations over time → receive live alerts → document birth outcome → export PDF → reopen saved session.
6. **PMA/FIV:** complete profile and reserve/hormonal history → analyse → select stimulation protocol → adjust from monitoring → persist cycle → export PDF.
7. **Clinical document:** create prescription/certificate/letter/report → use practitioner header and patient data → preview → export/print → find it in patient history.
8. **Clinical reference:** open emergency sheet → print it → create/edit a clinic protocol → verify persistence and permissions.
9. **Continuity:** create appointments, reminders, consultations, documents, settings, and PMA data → backup → restore on a clean profile → verify exact recovery.

## 6. Delivery plan

### Phase 0 — Baseline and parity harness (P0)

Create the safety net before broad UI work.

- Freeze the POC file as a versioned reference and record its checksum.
- Build a parity inventory mapping POC feature/element/function to Next.js route, component, domain module, status, and test.
- Extract golden clinical fixtures from v51 for every score and rule, including boundary values.
- Add unit-test infrastructure and deterministic tests for clinical libraries.
- Add end-to-end infrastructure for the critical journeys.
- Capture reference screenshots at agreed desktop, tablet, and mobile widths.
- Add a decision log for intentional differences from v51; every deviation requires owner and clinical rationale.

**Exit criteria:** parity inventory exists; clinical fixtures run in CI; reference screenshots and critical journey test skeletons are committed.

### Phase 1 — Clinical correctness and data safety (P0)

Fix known release-blocking differences first.

- HPP: restore v51 labels, weights, maximum of 16, thresholds, and recommendations.
- ADNEX: use the exact v51 intercept and coefficients in every active calculation path; remove or reconnect orphan implementations.
- FMF ethnicity: store stable v51 slugs (`caucasian`, `afrocaribbean`, `south_asian`, `east_asian`, `mixed`) while displaying French labels.
- Partogram: restore WHO/v51 alert and action offsets to 2 h and 4 h.
- rASRM: replace free numeric entry with the official fixed options; maximum 130.
- Flamm & Geiger: restore the binary favourable-cervix criterion and true maximum of 7.
- Backup/restore: include patients, consultations, appointments, reminders, documents, protocols, practitioner/establishment configuration, preferences, PMA cycles, and supported settings.
- Patient gallery: enforce patient filtering; prevent mixed-patient document lists.
- Tenant isolation: verify every API and database query is scoped to the authenticated clinic and permitted practitioner.
- Clinical errors must fail visibly; never substitute a plausible result when required input or calculation fails.

**Exit criteria:** identical v51/current inputs produce identical clinical outputs; backup round-trip passes; isolation and gallery tests pass.

### Phase 2 — v51 design foundation (P1)

Reproduce the final rendered v51 design, not an earlier overridden CSS layer.

- Tokens: teal `#0A5C5C`, deep teal `#083F3F`, gold `#C9A84C`, blush `#F4D6DA`, cream `#F7F5F0`, final borders, radii, shadows, and semantic states.
- Typography: Poppins display, DM Sans body, Noto Naskh Arabic for Arabic labels; preserve correct RTL rendering.
- Layout: 260 px desktop sidebar, 60 px topbar, v51 spacing and content widths.
- Shell: premium gradient sidebar, gold active state, blush/white topbar treatment, correct logo/profile zones, responsive navigation.
- Shared primitives: Button, IconButton, Input, Select, Checkbox, Radio, Badge, Card, Tabs, Modal/Drawer, Toast, Tooltip, EmptyState, Skeleton, ConfirmDialog, and PageHeader.
- Score cards: restore the teal gradient header and consistent result/recommendation treatment.
- Standardise hover, active, disabled, loading, success, warning, danger, focus, and print states.
- Remove one-off modal/button implementations as screens are migrated.

**Exit criteria:** shared primitives are used by primary journeys; shell and representative pages match reference screenshots; keyboard and focus review passes.

### Phase 3 — Core clinic workflow (P1)

- Complete the three-step setup wizard and allow reopening it from Settings.
- Restore the first-use “Who are you?” user selection when multiple profiles exist.
- Implement two separate security controls: secretary PIN and admin/settings PIN.
- Preserve authentication and multi-tenant SaaS behavior as an intentional improvement over v51.
- Keep waiting room and weekly agenda parity; add complete conflict, confirmation, cancellation, and no-show states.
- Complete quick pregnancy consultation entry for weight, BP, fundal height, FHR, fetal movement, and contractions.
- Align DICOM bridge endpoints and lifecycle with v51 (`/measurements`, `/measurements/clear`, `/status`) or provide a backward-compatible adapter; injection must be explicit and auditable.
- Add missing gynaecology OCR patterns and retain confirmation before writing measurements.
- Add the v51 PWA install banner and robust offline/update feedback.

**Exit criteria:** first-launch and patient-arrival journeys pass; roles/PINs are enforced; offline and bridge failures have actionable UI.

### Phase 4 — Patient record parity (P1)

- Anamnesis: complete all speciality fields and transient VTE factors.
- Clinical examination: retain v51 defaults/chips and restore a clinically useful synthesis workflow with source transparency.
- Investigations and biological curves: preserve all five v51 curves and their thresholds.
- Morphology T2: restore placental appearance and the complete amniotic-fluid, placenta, and fetal-sex option sets.
- Scores: expose all 19 v51 cards through one canonical implementation per score.
- Hawae: preserve score-assisted reasoning and Q&A while clearly separating calculated facts from generated text.
- Checklist: retain all 32 items and predicates.
- History: restore speciality badge, gestational age, previous-consultation chips, and “Generate report”.
- Pregnancy notebook: dated visits grouped by trimester, all v51 fields including free-text alert, multi-visit summary, and export.
- Reminders, partogram, protocols, PMA, documents, and certificates remain available in patient context.
- Starting a new consultation archives an immutable snapshot while preserving the active patient identity.

**Exit criteria:** gynaecology and obstetric consultation journeys pass; archive/reopen does not mutate historical records.

### Phase 5 — Partogram, PMA, and clinical intelligence (P1)

#### Partogram

- Restore the WHO three-zone canvas, alert/action lines, crossing shade, projection overlay, hover tooltip, and responsive print layout.
- Complete moulding, analgesia, rapid time buttons, all maternal/fetal observations, and validation.
- Connect the existing full analysis engine to live UI alerts for FHR, hypertension, fever, amniotic fluid, stagnation, and line crossing with both severities.
- Restore v51 intelligence panels: clinical prediction, obstetric score, assistant, and Hawae Clinical Engine.
- Restore all v51 simulation scenarios and random-patient generation behind a clearly labelled simulation mode.
- Add birth outcome: vaginal/caesarean, time, indication, and Apgar.

#### PMA/FIV

- Expose the complete model: male factor/semen analysis, uterine/tubal pathology, all ovarian reserve fields, hormones, and FIV history.
- Retain POSEIDON, Bologna, and OHSS analysis parity.
- Add dynamic stimulation adaptation from day, estradiol, follicles, and dose, with an audit trail of recommendations and overrides.
- Add a complete PMA PDF export.

**Exit criteria:** labour and PMA journeys pass; simulations cannot contaminate real patient data; every recommendation shows its inputs and can be reviewed.

### Phase 6 — Documents, protocols, and follow-up (P1)

- Consolidate `DocumentsHub`, certificate widgets, operative report modals, and editor paths around one document model and one renderer.
- Complete the 11 v51 certificate/document models, including maternity leave, return to work, hospital admission request, workplace adjustment, and dedicated prenatal fields.
- Preserve valuable new templates such as CNAM declaration and structured examination requests.
- Restore pregnancy follow-up plan, alarm signs, and patient-specific history.
- Prescription: retain 3,244-drug search; add patient prescription history, the five missing v51 templates, and complete quick suggestions.
- Restore all 12 clinical sheets: MAP, severe pre-eclampsia, RPM, HPP, gestational diabetes, ectopic pregnancy, PCOS, endometriosis, cholestasis, adnexal torsion, IUFD, and miscarriage.
- Add persistent clinic protocol CRUD with create/edit/delete/print permissions and separate emergency sheets from clinic protocols.
- Give every generated document a preview, practitioner header, patient identity, creation metadata, print/PDF action, and patient-history entry.
- Standardise PDF generation and filenames across the app.

**Exit criteria:** document and clinical-reference journeys pass; all generated files remain linked to the correct patient and clinic.

### Phase 7 — Dashboard, alerts, and responsible AI (P1 unless marked)

- Preserve all 10 v51 epidemiological analyses and CSV/JSON export; add activity and per-analysis PDF exports.
- Complete cabinet progress, near-term pregnancies, unconfirmed appointments, trends, and automatic insights.
- Complete the clinical alert engine from 16 to all 34 v51 rules with clinical fixtures and source labels.
- Add the multi-visit pregnancy follow-up summary and alarm detection.
- Restore AI-assisted consultation report, prescription/letter/operative-report drafting, and teaching QCM only after the following controls exist:
  - explicit practitioner action;
  - clear generated-content label;
  - no automatic save or clinical action;
  - review/edit confirmation;
  - minimal necessary data sent to the provider;
  - timeout, retry, quota, and unavailable states;
  - prompt/model/version audit metadata;
  - no patient data used for training without valid recorded consent.
- Estimated revenue and configurable procedure pricing are **P2** unless required for launch operations.

**Exit criteria:** dashboard exports and 34 alert fixtures pass; generated text is reviewable, traceable, and never presented as a deterministic clinical calculation.

### Phase 8 — Hardening and release (P0)

- Add schema validation at UI, API, and persistence boundaries.
- Add database indexes, migrations, seed/reference-data versioning, and safe rollback steps.
- Complete loading, empty, validation, permission, offline, timeout, and server-error states.
- Run accessibility, responsive, browser, print/PDF, performance, and offline test matrices.
- Verify no secrets, patient data, or tokens appear in client bundles or logs.
- Add audit events for authentication, patient access, clinical data changes, exports, restores, and AI generation.
- Define retention, export, deletion, and recovery procedures appropriate to the deployment jurisdiction.
- Produce deployment runbook, environment template, backup schedule, restore drill, monitoring, and incident checklist.
- Run clinician acceptance against every critical journey and record release sign-off.

**Exit criteria:** all release gates are green and the release candidate is signed off by product, engineering, and an authorised clinical reviewer.

## 7. POC parity matrix

This is the release-level summary. The detailed inventory created in Phase 0 owns component-level status.

| Area | MVP requirement | Priority |
|---|---|---|
| App shell and visual system | Final v51 appearance and responsive behavior | P1 |
| Setup, profiles, PINs | Full v51 flow plus secure SaaS auth | P1/P0 security |
| Waiting room and agenda | End-to-end daily workflow | P1 |
| Patient record and history | Full Gyn/Obst/Inf workflow with immutable archive | P1 |
| Clinical calculations | Exact v51 parity with golden tests | P0 |
| T2 morphology and curves | Complete fields, percentiles, anomaly detection | P1/P0 calculations |
| Hawae and checklist | Transparent assistance and exact checklist logic | P1 |
| Partogram | Complete recording, alerts, intelligence, outcome, export | P1/P0 alerts |
| PMA/FIV | Full profile, analysis, dynamic adaptation, export | P1 |
| Documents and prescriptions | Complete templates, history, consistent PDF | P1 |
| Protocols | 12 sheets plus clinic-managed protocols | P1 |
| Dashboard and reminders | v51 analytics, alerts, exports, live data | P1 |
| Backup and restore | Complete, verified, tenant-safe round trip | P0 |
| DICOM/OCR | Compatible bridge and confirmed measurements | P1 |
| PWA/offline | Installable, usable, and clear sync/update state | P1 |
| Generative AI | Guarded, auditable drafting and teaching tools | P1 after controls |

## 8. Definition of done for every feature

A roadmap item may move to done only when:

- behavior and copy match v51 or an intentional difference is recorded;
- clinical logic has normal, boundary, invalid-input, and regression tests;
- patient, clinic, and user scoping is verified;
- create/read/update/delete and reload behavior is complete where relevant;
- loading, empty, error, offline, permission, and destructive-action states are designed;
- keyboard, focus, screen-reader labels, and contrast are checked;
- desktop, tablet, mobile, and print/PDF layouts are checked where relevant;
- no duplicate or dead implementation remains in the active path;
- automated tests, TypeScript, lint, and production build pass;
- acceptance evidence is linked in the detailed parity inventory;
- clinical-facing changes receive authorised clinical review.

## 9. Testing strategy

### Clinical unit tests

- One fixture set per score/rule copied from verified v51 behavior.
- Tests at every threshold and one value on either side.
- Explicit tests for units, missing values, decimal separators, dates, gestational age, and locale.
- Snapshot only explanatory copy; assert numeric outputs and severity as exact values.

### Integration tests

- Store/API/database round trips and tenant scoping.
- Consultation archive immutability.
- Document/patient linkage.
- Backup export → clean state → restore → deep equality for supported data.
- Offline queue/reconnect behavior where writes are permitted offline.

### End-to-end and visual tests

- The nine critical journeys in section 5.
- Reference screenshots for shell, waiting room, patient record, score, partogram, PMA, document editor, protocols, dashboard, and settings.
- Desktop, tablet, mobile, and print/PDF coverage.

## 10. Out of scope until MVP gates pass

- Features absent from v51 that do not close a real launch requirement.
- Revenue forecasting and broad billing workflows.
- Additional analytics beyond the existing v51 set.
- New clinical scores without validated specifications and clinical ownership.
- Autonomous diagnosis, treatment, or unsupervised AI actions.
- Cosmetic redesigns that move away from the v51 product identity.

## 11. Immediate next work

Execute these items in order:

1. Create the parity inventory and clinical golden-test harness.
2. Fix the six known clinical calculation defects.
3. Fix patient document filtering and complete backup/restore.
4. Apply the final v51 design tokens, typography, shell dimensions, and shared UI primitives.
5. Complete setup/profile/PIN and the two primary consultation journeys.
6. Continue phase by phase; do not start P2 work while any P0 or P1 release gate remains open.

This document defines the MVP contract. Progress tracking should live in issues or a delivery board linked back to the relevant phase and acceptance criterion, rather than turning this roadmap into an unverified checklist.
