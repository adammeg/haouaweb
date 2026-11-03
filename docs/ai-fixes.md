# AI fixes — 2026-11-03

Implemented the correctness and reliability changes identified in the AI review. Numerical reference checks, provider responses, database results, and synchronization races are covered by synthetic tests. No real patient records or live model calls were used during verification.

**Clinical inputs and scores**

- Shared strict parsers handle decimal commas, finite numbers, blood pressure, calendar age, and weeks plus days. Unknown yes/no answers stay unknown, and forms no longer visually preselect unrecorded negative answers in the updated obstetric/infertility inputs.
- POSEIDON now uses a shared classification function in Assist and the IVF module. AMH is compared in ng/mL; age defines groups 1/2 and 3/4; recorded oocyte yield defines response subgroups. Unknown history is no longer converted into invented oocyte counts. A new field accepts the previous observed yield.
- Incomplete BPP cannot produce a low total and trigger Stage IV. Unknown glucose-test components cannot establish a normal HGPO; available abnormal H1/H2 results are evaluated independently. Overt-diabetes findings have a distinct output label.
- The two Hadlock implementations now share the same four-parameter calculation. The reference case 80/290/270/60 mm produces 1,740 g. Formula checked against [Hologic's obstetric formula reference, citing Hadlock 1985](https://www.hologic.com/file/37096/download?token=a-BSqXqL).
- miniPIERS now uses the [Payne et al. 2014 equation](https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1001589), including all symptoms and parity. The form adds the two missing symptom inputs. Missing symptoms do not imply negative findings. Local clinical calibration remains a separate requirement.
- The former T21 and PE numerical approximations are **unavailable** rather than presented as verified FMF risks. Entered measurements/MoMs remain available; those risks must come from a verified calculator or laboratory. This intentionally avoids replacing one unsupported formula with another.
- IVF cause and sperm-quality mappings are corrected. Heuristic outputs carry limitations and reduced confidence; fabricated 95% confidence intervals were removed. ROMA requires recorded menopausal status, and incomplete ADNEX morphology remains incomplete.
- Assist retains incomplete/error assessments and their missing inputs. The summary separates assessment coverage from observed findings and no longer calls an empty obstetric dossier low risk. Contradiction messages do not describe differing risk-factor combinations as physiologically impossible or instruct the user to modify measurements to make results agree.

**Patient revision and persistence**

- Both AI entry points use one implementation. Before inference, the client saves the draft and awaits an acknowledged server save through the same serialized queue used by background synchronization.
- Requests include a SHA-256 revision of a canonical clinical projection. The server loads the patient under the authenticated doctor's workspace and rejects a missing or changed revision. Scores are recomputed from that saved snapshot instead of trusting cached JSON.
- The client captures the patient and revision at dispatch, cancels requests on clinical changes/unmount, and checks that context again before displaying or recording results. Save failures block inference.
- Generated score timestamps, AI history, and other derived fields no longer invalidate the clinical key. Engine, corpus, prompt, and schema versions are included. Local reuse of generated answers was removed; explicitly requesting an analysis generates a fresh response with model/version provenance.
- Standalone Assist screens recompute from the active patient instead of showing another patient's retained local result.

**Retrieval, context, and citations**

- A single BM25 implementation serves retrieval and debugging. It preserves clinical short forms, expands curated synonyms, deduplicates query terms, bounds keyword boosts, and returns scores and matched terms.
- The physician's question is searched independently from patient narratives. Retrieved IDs are deduplicated, and an empty search has an explicit no-evidence representation.
- Patient context includes normalized facts, missing values, fresh score limitations, and additional entered fields. Independent section budgets preserve allergies, treatments, and score findings when narratives are long. Previous cesarean count is labeled correctly. Selected identity fields and known identity strings pasted into notes are removed; this does not guarantee removal of every possible identifier in arbitrary text.
- Evidence has its own data section. Grounding policy lives in the system prompt. The model is not instructed to invent references or silently fill evidence gaps from training memory.
- Diagnostic citations use stable chunk IDs. Every global, hypothesis, and red-flag citation must belong to that request's retrieved evidence. Display metadata comes from the server's corpus. Text exports retain limitations and references; nested references appear in the structured UI.
- Knowledge entries support source URL and review status. The incorrect miniPIERS attribution/summary was replaced with a source-checked entry. Remaining summaries are explicitly marked unreviewed rather than claimed to be validated.

**Provider handling**

- Request types, limits, and patient revisions are validated before string operations. An explicitly configured temperature of zero is preserved.
- Shared streaming/nonstream transport handles timeouts, refusal/error responses, completion status, and cancellation. Truncated output is rejected instead of persisted as a completed response.
- The SSE parser supports CRLF, LF, CR, split UTF-8, byte-boundary fragmentation, and multi-line events. Downstream cancellation aborts the upstream request.
- Optional `IA_STRUCTURED_OUTPUTS=true` requests strict JSON Schema. For OpenRouter it also requires an endpoint supporting those parameters. Enable it only for a compatible configured model/endpoint, as described in [OpenRouter's structured-output documentation](https://openrouter.ai/docs/guides/features/structured-outputs). Runtime validation and citation checks remain mandatory.

**Verification**

`npm run test:ai` runs the regression suite using Node's test runner and the installed TypeScript compiler. It covers parsers, units, score completeness, POSEIDON across both engines, reference calculations, context construction, revisions, retrieval, citation validation, prompt boundaries, provider completion/stream errors, authorization, and synchronization/patient-switch cases. Database/provider boundaries are mocked; the actual route, repositories, revision checks, and context code execute.

TypeScript checking, focused ESLint checks, and the production build also pass. The build retains unrelated existing warnings about image elements, a calendar hook dependency, an unused navigation icon, and jose's Edge Runtime imports. Its first sandboxed attempt could not fetch existing Google Fonts; the permitted retry completed.

**Remaining limits**

The unreviewed clinical summaries and heuristic models still require source-based clinical validation; this change does not certify them. Citation membership verifies that a reference was supplied, not that it supports every generated claim. Free-text question responses remain streamed and are not subject to the diagnostic JSON citation validator. No live-provider accuracy benchmark or browser-driven clinical review has been performed. Corpus expansion, semantic retrieval, and production model selection should follow a clinician-reviewed evaluation set.
