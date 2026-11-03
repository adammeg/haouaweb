import test from "node:test";
import assert from "node:assert/strict";
import { clinicalRevision } from "../src/lib/ia/clinical-revision.ts";

// In-memory database boundary: real repository, authorization, context, and route code run.
const a = { id: "patient-a", specialite: "obst", o_terme: "12", nom: "SyntheticSurname" };
const workspaces = { doctorA: { updatedAt: new Date("2026-11-03T00:00:00Z"), patientsByUser: { user: { [a.id]: a } } } };
globalThis._hawaeMongoClient = { db: () => ({ collection: (name) => ({
  createIndex: async () => "test-index",
  findOne: async (filter) => name === "doctors" ? { id: filter.id, active: filter.id !== "disabled" } : workspaces[filter.doctorId] ?? null,
}) }) };
process.env.AUTH_SECRET = "synthetic-test-session-secret-32-characters";
process.env.OPENROUTER_API_KEY = "synthetic-no-network-key";
const { createSessionToken } = await import("../src/lib/auth/session.ts");
const { POST } = await import("../src/app/api/ia/route.ts");
let providerCalls = 0;
globalThis.fetch = async (_url, init) => {
  providerCalls++;
  const body = JSON.parse(init.body);
  assert.ok(!JSON.stringify(body.messages).includes(a.nom));
  return Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ schemaVersion: "clinical-analysis-v1", summary: ["Données limitées"], hypotheses: [], redFlags: [], missingInformation: [], suggestedInvestigations: [], followUp: [], citations: [], limitations: ["Dossier incomplet"] }) } }] });
};
async function send(body, identity = "doctorA", role = "doctor") {
  const token = await createSessionToken({ id: identity, email: "synthetic@example.test", name: "Synthetic", role });
  return POST(new Request("http://localhost/api/ia", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }));
}

test("API denies unauthenticated, disabled and secretary access before model invocation", async () => {
  assert.equal((await POST(new Request("http://localhost/api/ia", { method: "POST", body: "{}" }))).status, 401);
  assert.equal((await send({ question: "Q" }, "disabled")).status, 403);
  assert.equal((await send({ question: "Q" }, "secretary", "secretary")).status, 403);
  assert.equal(providerCalls, 0);
});

test("API rejects malformed input, unavailable patient and stale revisions without invoking a provider", async () => {
  for (const body of [null, { question: 4 }, { question: "Q", patientId: 4 }]) assert.equal((await send(body)).status, 400);
  const revision = await clinicalRevision(a);
  assert.equal((await send({ mode: "diagnostic", patientId: a.id, expectedRevision: revision }, "doctorB")).status, 404);
  assert.equal((await send({ mode: "diagnostic", patientId: a.id, expectedRevision: "0".repeat(64) })).status, 409);
  assert.equal((await send({ mode: "diagnostic", patientId: "toString", expectedRevision: revision })).status, 404);
  assert.equal(providerCalls, 0);
});

test("API uses the exact saved revision and returns provenance with validated diagnostic output", async () => {
  const revision = await clinicalRevision(a);
  const res = await send({ mode: "diagnostic", patientId: a.id, expectedRevision: revision });
  assert.equal(res.status, 200);
  const result = await res.json();
  assert.equal(result.meta.revision, revision);
  assert.equal(result.meta.patientId, a.id);
  assert.ok(result.meta.knowledgeVersion && result.meta.engineVersion && result.meta.model);
  assert.equal(result.analysis.schemaVersion, "clinical-analysis-v1");
  assert.equal(providerCalls, 1);
});
