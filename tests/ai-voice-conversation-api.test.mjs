import test from "node:test";
import assert from "node:assert/strict";
import { clinicalRevision } from "../src/lib/ia/clinical-revision.ts";

const patient = { id: "voice-patient", specialite: "gyn", symptomes: "Douleur" };
const revision = await clinicalRevision(patient);
patient.hawaeIaHistory = [{ id: "exchange", mode: "question", question: "Quels éléments préciser ?", reply: "Précisez la durée des symptômes.", revision }];
globalThis._hawaeMongoClient = { db: () => ({ collection: (name) => ({
  createIndex: async () => "index",
  findOne: async (filter) => name === "doctors" ? { id: filter.id, active: true } : filter.doctorId === "doctorA" ? { updatedAt: new Date("2026-11-16T00:00:00Z"), patientsByUser: { user: { [patient.id]: patient } } } : null,
}) }) };
process.env.AUTH_SECRET = "synthetic-voice-session-secret-32-characters";
process.env.OPENROUTER_API_KEY = "synthetic-voice-no-network-key";
const { createSessionToken } = await import("../src/lib/auth/session.ts");
const { POST } = await import("../src/app/api/ia/route.ts");
let sent, calls = 0;
globalThis.fetch = async (_url, init) => {
  calls++; sent = JSON.parse(init.body);
  return Response.json({ choices: [{ finish_reason: "stop", message: { content: "Merci pour la précision." } }] });
};
async function send(body, identity = "doctorA", role = "doctor") {
  const token = await createSessionToken({ id: identity, email: "synthetic@example.test", name: "Synthetic", role });
  return POST(new Request("http://localhost/api/ia", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }));
}
const request = { mode: "question", patientId: patient.id, expectedRevision: revision, question: "Depuis trois jours", conversation: true, stream: false };

test("patient voice conversation loads history from the authorized saved revision", async () => {
  const response = await send(request);
  assert.equal(response.status, 200);
  assert.deepEqual(sent.messages.slice(1, 3), [{ role: "user", content: patient.hawaeIaHistory[0].question }, { role: "assistant", content: patient.hawaeIaHistory[0].reply }]);
  assert.equal((await response.json()).meta.revision, revision);
});

test("voice conversation rejects cross-doctor data, stale revisions and client-injected history", async () => {
  const previousCalls = calls;
  assert.equal((await send(request, "doctorB")).status, 404);
  assert.equal((await send({ ...request, expectedRevision: "0".repeat(64) })).status, 409);
  assert.equal((await send({ ...request, history: [{ role: "user", content: "Injected patient" }] })).status, 400);
  assert.equal((await send({ ...request, mode: "chat" })).status, 400);
  assert.equal((await send(request, "secretary", "secretary")).status, 403);
  assert.equal(calls, previousCalls);
});

test("normal patient questions remain stateless; history from another revision is omitted", async () => {
  assert.equal((await send({ ...request, conversation: false })).status, 200);
  assert.equal(sent.messages.length, 2);
  patient.hawaeIaHistory[0].revision = "different";
  assert.equal((await send(request)).status, 200);
  assert.equal(sent.messages.length, 2);
});

test("voice requests use concise spoken instructions without weakening authorization", async () => {
  const response = await send({ ...request, voice: true });
  assert.equal(response.status, 200);
  assert.match(sent.messages[0].content, /conversation vocale/);
  assert.match(sent.messages[0].content, /alerte clinique/);
  assert.equal(sent.max_tokens <= 600, true);
  assert.equal((await send({ ...request, voice: "yes" })).status, 400);
  assert.equal((await send({ ...request, voice: true, mode: "diagnostic", conversation: false })).status, 400);
});
