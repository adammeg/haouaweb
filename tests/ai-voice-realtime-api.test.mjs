import test from "node:test";
import assert from "node:assert/strict";

globalThis._hawaeMongoClient = { db: () => ({ collection: () => ({ createIndex: async () => "index", findOne: async (filter) => ({ id: filter.id, active: filter.id !== "disabled" }) }) }) };
process.env.AUTH_SECRET = "synthetic-realtime-secret-32-characters";
process.env.VOICE_REALTIME_ENABLED = "true";
process.env.VOICE_REALTIME_API_KEY = "synthetic-private-audio-key";
const { createSessionToken } = await import("../src/lib/auth/session.ts");
const { GET, POST } = await import("../src/app/api/voice/realtime/route.ts");
let sent, calls = 0;
globalThis.fetch = async (url, init) => { calls++; sent = { url, init }; return new Response("v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n"); };
async function request(method, { identity = "doctorA", role = "doctor", origin = "http://localhost", body = "v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n" } = {}) {
  const token = await createSessionToken({ id: identity, email: "test@example.test", name: "Test", role });
  const req = new Request("http://localhost/api/voice/realtime", { method, headers: { Authorization: `Bearer ${token}`, Origin: origin, "Content-Type": "application/sdp" }, ...(method === "POST" ? { body } : {}) });
  return method === "GET" ? GET(req) : POST(req);
}

test("realtime configuration is authenticated and never exposes permanent credentials", async () => {
  assert.equal((await GET(new Request("http://localhost/api/voice/realtime"))).status, 401);
  assert.equal((await request("GET", { role: "secretary" })).status, 403);
  assert.equal((await request("POST", { identity: "disabled" })).status, 403);
  const response = await request("GET");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { available: true, model: "gpt-realtime-2.1" });
  assert.equal(calls, 0);
});

test("session creation blocks untrusted origins and oversized/invalid offers before provider calls", async () => {
  assert.equal((await request("POST", { origin: "https://untrusted.example" })).status, 403);
  assert.equal((await request("POST", { body: "x".repeat(65_000) })).status, 413);
  assert.equal((await request("POST", { body: "not an sdp offer" })).status, 400);
  assert.equal(calls, 0);
});

test("server creates a native audio session with VAD interruption and the guarded application tool", async () => {
  const response = await request("POST");
  assert.equal(response.status, 200); assert.match(response.headers.get("content-type"), /application\/sdp/);
  assert.equal(sent.url, "https://api.openai.com/v1/realtime/calls");
  assert.equal(sent.init.headers.Authorization, "Bearer synthetic-private-audio-key");
  const config = JSON.parse(sent.init.body.get("session"));
  assert.equal(config.audio.input.turn_detection.interrupt_response, true);
  assert.equal(config.audio.input.turn_detection.type, "semantic_vad");
  assert.equal(config.tools[0].name, "hawae_request");
  assert.match(config.instructions, /question du médecin/);
  assert.doesNotMatch(await response.text(), /synthetic-private/);
});

test("an OpenRouter key alone cannot silently enable a paid native audio session", async () => {
  delete process.env.VOICE_REALTIME_API_KEY; delete process.env.OPENAI_API_KEY;
  process.env.OPENROUTER_API_KEY = "synthetic-text-only";
  assert.equal((await request("GET")).status, 200);
  assert.equal((await (await request("GET")).json()).available, false);
  assert.equal((await request("POST")).status, 503);
});
