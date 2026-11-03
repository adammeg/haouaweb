import test from "node:test";
import assert from "node:assert/strict";
import { learningFeatures, learningPatientRef, patientSplit, featureHash } from "../src/lib/training/learning-features.ts";
import { clinicalRevision } from "../src/lib/ia/clinical-revision.ts";

process.env.AUTH_SECRET = "synthetic-learning-api-secret-32-characters";
process.env.OPENROUTER_API_KEY = "synthetic-learning-no-network";
const rows = [];
const settings = new Map();
const patients = {};
const workspaces = { doctorA: { updatedAt: new Date("2026-11-03T00:00:00Z"), patientsByUser: { user: patients } } };
let afterInsert;
const path = (doc, key) => key.split(".").reduce((v, k) => v?.[k], doc);
const matches = (doc, filter) => Object.entries(filter).every(([key, value]) => value && typeof value === "object" && "$ne" in value ? path(doc, key) != value.$ne : path(doc, key) === value);
globalThis._hawaeMongoClient = { db: () => ({ collection: (name) => ({
  createIndex: async () => "index",
  findOne: async (filter) => name === "doctors" ? { id: filter.id, active: filter.id !== "disabled" } : name === "doctor_settings" ? settings.get(filter.doctorId) ?? null : name === "workspaces" ? workspaces[filter.doctorId] ?? null : name === "ai_reviewed_learning" ? rows.find((r) => matches(r, filter)) ?? null : null,
  insertOne: async (record) => { rows.push(structuredClone(record)); afterInsert?.(); return { acknowledged: true }; },
  updateOne: async (filter, update) => {
    const row = name === "doctor_settings" ? settings.get(filter.doctorId) ?? { doctorId: filter.doctorId } : rows.find((r) => matches(r, filter));
    if (!row) return { matchedCount: 0 };
    Object.assign(row, update.$set);
    if (name === "doctor_settings") settings.set(filter.doctorId, row);
    return { matchedCount: 1 };
  },
  deleteOne: async (filter) => { const i = rows.findIndex((r) => matches(r, filter)); if (i >= 0) rows.splice(i, 1); return { deletedCount: i >= 0 ? 1 : 0 }; },
  deleteMany: async (filter) => { if (name !== "ai_reviewed_learning") return { deletedCount: 0 }; const doomed = rows.filter((r) => matches(r, filter)); for (const r of doomed) rows.splice(rows.indexOf(r), 1); return { deletedCount: doomed.length }; },
  countDocuments: async (filter) => rows.filter((r) => matches(r, filter)).length,
  distinct: async (key, filter) => [...new Set(rows.filter((r) => matches(r, filter)).map((r) => path(r, key)))],
  find: (filter) => { let limit = 5000; const cursor = { sort: () => cursor, limit: (n) => { limit = n; return cursor; }, toArray: async () => rows.filter((r) => matches(r, filter)).slice(0, limit) }; return cursor; },
}) }) };
const { createSessionToken } = await import("../src/lib/auth/session.ts");
const { POST: generate } = await import("../src/app/api/ia/route.ts");
const { POST: feedback } = await import("../src/app/api/ia/feedback/route.ts");
const { GET: learning } = await import("../src/app/api/training/learning/route.ts");
const { PATCH: consent } = await import("../src/app/api/training/consent/route.ts");
const { currentLearningConsent, insertLearningGeneration } = await import("../src/lib/db/ai-learning-repository.ts");
let lastMessages;
let failGeneration = false;
globalThis.fetch = async (_url, init) => {
  lastMessages = JSON.parse(init.body).messages;
  if (failGeneration) return new Response("unavailable", { status: 503 });
  return Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ schemaVersion: "clinical-analysis-v1", summary: ["Synthetic model answer"], hypotheses: [], redFlags: [], missingInformation: [], suggestedInvestigations: [], followUp: [], citations: [], limitations: ["Synthetic incomplete dossier"] }) } }] });
};
async function request(handler, body, identity = "doctorA", role = "doctor", url = "http://localhost/api/ia") {
  const token = await createSessionToken({ id: identity, email: "synthetic@example.test", name: "Synthetic", role });
  return handler(new Request(url, { method: body === undefined ? "GET" : "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
}
function enable(at = "2026-11-03T00:00:00Z") { settings.set("doctorA", { doctorId: "doctorA", aiTraining: { enabled: true, consentedAt: at, consentVersion: "test" } }); }
function sourcePatient() {
  for (let i = 0; i < 100; i++) {
    const id = `source-${i}`;
    if (patientSplit(learningPatientRef("doctorA", id)) === "train") return { id, specialite: "obst", nom: "SyntheticSurname", o_terme: "30", ec_ta: "150/95", o_par: "1" };
  }
  throw new Error("No train identity");
}
const a = sourcePatient(); patients[a.id] = a;
const b = { ...a, id: "other-synthetic-patient" }; patients[b.id] = b;
let captured;
const revised = { confirmedDiagnosis: "INDEPENDENT CONFIRMED CONCLUSION", correctedResponse: "INDEPENDENT CLINICIAN RESPONSE", rationale: "Confirmed by subsequent independent tests", verdict: "corrected", outcome: "confirmed", confirmedByClinician: true };
async function analysisFor(patient) { return request(generate, { mode: "diagnostic", patientId: patient.id, expectedRevision: await clinicalRevision(patient) }); }

test("learning is opt-in and failed provider calls do not become learning records", async () => {
  assert.equal((await analysisFor(a)).status, 200);
  assert.equal(rows.length, 0);
  enable(); failGeneration = true;
  assert.equal((await analysisFor(a)).status, 502);
  assert.equal(rows.length, 0);
  failGeneration = false;
});

test("successful responses are captured server-side with pseudonymous features and no approved label", async () => {
  const response = await analysisFor(a);
  const result = await response.json();
  captured = result.meta.learningGenerationId;
  assert.match(captured, /^learn_/);
  assert.equal(rows.length, 1);
  const row = rows[0];
  assert.equal(row.review, null);
  assert.equal(row.patientRef, learningPatientRef("doctorA", a.id));
  assert.ok(!JSON.stringify(row).includes(a.nom));
  assert.ok(!("patientId" in row));
});

test("feedback cannot forge source generations or cross doctor, patient, role and revision boundaries", async () => {
  const base = { generationId: captured, patientId: a.id, revision: await clinicalRevision(a), ...revised };
  assert.equal((await request(feedback, base, "doctorA", "secretary")).status, 403);
  assert.equal((await request(feedback, base, "doctorB")).status, 404);
  assert.equal((await request(feedback, { ...base, patientId: b.id })).status, 404);
  assert.equal((await request(feedback, { ...base, revision: "0".repeat(64) })).status, 409);
  assert.equal((await request(feedback, { ...base, generationId: "learn_fabricated" })).status, 404);
  assert.equal((await request(feedback, { ...base, confirmedByClinician: false })).status, 400);
  assert.equal(rows[0].review, null);
});

test("helpful ratings never become case evidence; an explicit confirmed correction becomes eligible", async () => {
  const base = { generationId: captured, patientId: a.id, revision: await clinicalRevision(a) };
  assert.equal((await request(feedback, { ...base, verdict: "helpful" })).status, 200);
  await analysisFor(b);
  assert.ok(!JSON.stringify(lastMessages).includes(revised.correctedResponse));
  // Later confirmation can refer to the captured original revision even after a dossier edit.
  patients[a.id] = { ...a, o_poids: "70" };
  const res = await request(feedback, { ...base, ...revised });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).use, "reviewed_memory");
  await analysisFor(b);
  assert.ok(JSON.stringify(lastMessages).includes(revised.correctedResponse));
  await analysisFor(patients[a.id]);
  const examples = lastMessages[1].content.split("<CAS_REVUS>")[1];
  assert.ok(!examples.includes(revised.correctedResponse));
});

test("rejected corrections are removed from future memory and exports contain only clinician targets", async () => {
  const res = await request(learning, undefined, "doctorA", "doctor", "http://localhost/api/training/learning?format=dataset");
  const exported = await res.text();
  assert.ok(exported.includes(revised.correctedResponse));
  assert.ok(!exported.includes("Synthetic model answer") && !exported.includes("patientRef") && !exported.includes("reviewerId"));
  assert.equal((await request(feedback, { generationId: captured, patientId: a.id, revision: await clinicalRevision(a), verdict: "rejected" })).status, 200);
  await analysisFor(b);
  assert.ok(!JSON.stringify(lastMessages).includes(revised.correctedResponse));
});

test("withdrawal removes reviewed records and new capture remains disabled", async () => {
  const response = await request(consent, { enabled: false });
  assert.equal(response.status, 200);
  assert.equal(rows.length, 0);
  await analysisFor(b);
  assert.equal(rows.length, 0);
  const status = await (await request(learning, undefined)).json();
  assert.equal(status.status.enabled, false);
  assert.equal(status.weightsTraining, "not_started");
});

test("renewing contribution creates a fresh epoch that old pending writes cannot reuse", async () => {
  assert.equal((await request(consent, { enabled: true })).status, 200);
  const first = await currentLearningConsent("doctorA");
  assert.equal((await request(consent, { enabled: false })).status, 200);
  assert.equal((await request(consent, { enabled: true })).status, 200);
  assert.notEqual(await currentLearningConsent("doctorA"), first);
});

test("a capture racing with withdrawal is deleted and a rotated identity key isolates old epochs", async () => {
  enable("2026-11-03T02:00:00Z");
  const token = await currentLearningConsent("doctorA");
  const f = learningFeatures(a);
  const row = { id: "learn_late", doctorId: "doctorA", consentToken: token, patientRef: learningPatientRef("doctorA", a.id), schemaVersion: "reviewed-cases-v1", revision: await clinicalRevision(a), mode: "diagnostic", question: "", features: f, featureHash: featureHash(f), split: "train", generatedResponse: "synthetic", provider: "mock", model: "mock", promptVersion: "p", knowledgeVersion: "k", usedCaseIds: [], evidenceIds: [], createdAt: new Date().toISOString(), review: null };
  afterInsert = () => { settings.get("doctorA").aiTraining.enabled = false; };
  assert.equal(await insertLearningGeneration(row), false);
  assert.equal(rows.length, 0);
  afterInsert = undefined;
  enable("2026-11-03T02:00:00Z");
  process.env.AI_LEARNING_SECRET = "a-different-synthetic-identity-secret";
  assert.notEqual(await currentLearningConsent("doctorA"), token);
});
