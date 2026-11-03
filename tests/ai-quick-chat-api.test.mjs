import test from "node:test";
import assert from "node:assert/strict";

let patientReads = 0;
globalThis._hawaeMongoClient = { db: () => ({ collection: (name) => ({
  createIndex: async () => "index",
  findOne: async (filter) => {
    if (name === "doctors") return { id: filter.id, active: true };
    patientReads++;
    throw new Error("Quick chat must not read patient or learning records");
  },
}) }) };
process.env.AUTH_SECRET = "synthetic-quick-chat-secret-32-characters";
process.env.OPENROUTER_API_KEY = "synthetic-chat-no-network-key";
const { createSessionToken } = await import("../src/lib/auth/session.ts");
const { POST } = await import("../src/app/api/ia/route.ts");
let sent;
globalThis.fetch = async (_url, init) => {
  sent = JSON.parse(init.body);
  if (sent.stream) return new Response('data: {"choices":[{"delta":{"content":"Bonjour Docteur !"}}]}\n\ndata: [DONE]\n\n');
  return Response.json({ choices: [{ finish_reason: "stop", message: { content: "Bonjour Docteur !" } }] });
};
async function ask(body, role = "doctor") {
  const token = await createSessionToken({ id: "doctorA", email: "test@example.test", name: "Test", role });
  return POST(new Request("http://localhost/api/ia", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }));
}
test("quick-chat greetings stream through the conversational prompt without reading dossiers", async () => {
  const res = await ask({ mode: "chat", question: "Bonjour !" });
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "Bonjour Docteur !");
  assert.match(sent.messages[0].content, /quelques phrases/);
  assert.equal(sent.max_tokens <= 900, true);
  assert.equal(patientReads, 0);
  assert.equal(res.headers.get("X-Hawae-Learning-Generation"), "");
});
test("follow-up conversation and prior user topic reach the model with current evidence", async () => {
  const history = [{ role: "user", content: "Peux-tu expliquer l'endométriose ?" }, { role: "assistant", content: "Nous pouvons parler de ses symptômes." }];
  const res = await ask({ mode: "chat", question: "Et le diagnostic ?", history, stream: false });
  assert.equal(res.status, 200);
  assert.deepEqual(sent.messages.slice(1, 3), history);
  assert.match(sent.messages.at(-1).content, /eshre-endometriose-2022/);
  assert.match(sent.messages.at(-1).content, /Et le diagnostic/);
  assert.equal(patientReads, 0);
});
test("quick chat rejects attached patient IDs and keeps the doctor-only access restriction", async () => {
  assert.equal((await ask({ mode: "chat", question: "Q", patientId: "p" })).status, 400);
  assert.equal((await ask({ mode: "chat", question: "Q" }, "secretary")).status, 403);
  assert.equal(patientReads, 0);
});
