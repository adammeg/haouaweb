import test from "node:test";
import assert from "node:assert/strict";

globalThis._hawaeMongoClient = { db: () => ({ collection: () => ({ createIndex: async () => "index", findOne: async (filter) => ({ id: filter.id, active: filter.id !== "disabled" }) }) }) };
process.env.AUTH_SECRET = "synthetic-speech-secret-32-characters";
process.env.OPENROUTER_API_KEY = "synthetic-openrouter-speech-key";
process.env.OPENROUTER_MODEL = "synthetic-reasoning-model";
const { createSessionToken } = await import("../src/lib/auth/session.ts");
const { resolveIaProvider } = await import("../src/lib/ia/provider-config.ts");
const { GET, POST } = await import("../src/app/api/voice/speech/route.ts");
let calls = [];
globalThis.fetch = async (url, init) => { calls.push({ url, init }); return new Response(new Uint8Array(8192), { headers: { "Content-Type": "audio/pcm; rate=44100; channels=1" } }); };
async function request(method, { identity = "doctorA", role = "doctor", origin = "http://localhost", body = JSON.stringify({ text: "Pas de fièvre, valeur 0.5 ng/mL." }), contentType = "application/json" } = {}) {
  const token = await createSessionToken({ id: identity, email: "test@example.test", name: "Test", role });
  const req = new Request("http://localhost/api/voice/speech", { method, headers: { Authorization: `Bearer ${token}`, ...(origin ? { Origin: origin } : {}), "Content-Type": contentType }, ...(method === "POST" ? { body } : {}) });
  return method === "GET" ? GET(req) : POST(req);
}

test("speech configuration is authenticated and exposes no credentials", async () => {
  assert.equal((await GET(new Request("http://localhost/api/voice/speech"))).status, 401);
  assert.equal((await request("GET", { role: "secretary" })).status, 403);
  assert.equal((await request("POST", { identity: "disabled" })).status, 403);
  const response = await request("GET");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { available: true, provider: "openrouter", model: "heygen/heygen-voice-1-turbo:free" });
  assert.equal(calls.length, 0);
});

test("speech rejects cross-origin, malformed, oversized and client-selected models before a provider request", async () => {
  for (const origin of ["https://untrusted.example", ""]) assert.equal((await request("POST", { origin })).status, 403);
  assert.equal((await request("POST", { contentType: "text/plain" })).status, 415);
  for (const body of ['null', '[]', '{"text":42}', '{"text":""}', 'malformed', JSON.stringify({ text: "x", model: "paid-model" }), JSON.stringify({ text: "x".repeat(5001) })]) assert.equal((await request("POST", { body })).status, 400);
  assert.equal((await request("POST", { body: "x".repeat(24001) })).status, 413);
  assert.equal(calls.length, 0);
});

test("HeyGen uses the speech endpoint without replacing the Hawae reasoning model", async () => {
  const response = await request("POST");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("X-Hawae-Audio-Sample-Rate"), "44100");
  assert.equal(calls[0].url, "https://openrouter.ai/api/v1/audio/speech");
  assert.equal(calls[0].init.headers.Authorization, "Bearer synthetic-openrouter-speech-key");
  assert.deepEqual(JSON.parse(calls[0].init.body), { model: "heygen/heygen-voice-1-turbo:free", input: "Pas de fièvre, valeur 0.5 ng/mL.", voice: "nadine", response_format: "pcm" });
  assert.equal(resolveIaProvider().model, "synthetic-reasoning-model");
  assert.equal((await response.arrayBuffer()).byteLength, 8192);
});

test("PCM is forwarded while generation is open and client cancellation aborts upstream audio", async () => {
  let controller, signal, cancelled = false;
  globalThis.fetch = async (_url, init) => {
    signal = init.signal;
    return new Response(new ReadableStream({ start(c) { controller = c; }, cancel() { cancelled = true; } }), { headers: { "Content-Type": "audio/pcm" } });
  };
  const response = await request("POST"), reader = response.body.getReader();
  controller.enqueue(Uint8Array.of(0, 128));
  assert.deepEqual((await reader.read()).value, Uint8Array.of(0, 128));
  await reader.cancel(); assert.equal(cancelled, true); assert.equal(signal.aborted, true);
});

test("server synthesis preserves bracketed clinical text instead of executing or omitting HeyGen tags", async () => {
  let payload;
  globalThis.fetch = async (_url, init) => { payload = JSON.parse(init.body); return new Response(Uint8Array.of(0, 0), { headers: { "Content-Type": "audio/pcm" } }); };
  const response = await request("POST", { body: JSON.stringify({ text: "Valeur [0.5 ng/mL], [pas de fièvre]." }) });
  assert.equal(payload.input, "Valeur 0.5 ng/mL, pas de fièvre.");
  assert.equal(response.status, 200); await response.arrayBuffer();
});

test("provider JSON, incorrect rates and errors never pass through as speech or leak provider details", async () => {
  for (const [contentType, status] of [["application/json", 200], ["audio/pcm; rate=24000", 200], ["audio/pcm; channels=2", 200], ["application/json", 429], ["application/json", 401]]) {
    let count = 0;
    globalThis.fetch = async () => { count++; return new Response("synthetic-private-upstream-detail", { status, headers: { "Content-Type": contentType } }); };
    const response = await request("POST");
    assert.equal(response.status, status === 429 ? 429 : 502);
    assert.doesNotMatch(await response.text(), /synthetic-private-upstream-detail|synthetic-openrouter-speech-key/);
    assert.equal(count, 1);
  }
});

test("a browser speech selection or a missing OpenRouter key disables server speech", async () => {
  process.env.VOICE_SPEECH_PROVIDER = "browser";
  assert.equal((await (await request("GET")).json()).available, false);
  assert.equal((await request("POST")).status, 503);
  delete process.env.VOICE_SPEECH_PROVIDER; delete process.env.OPENROUTER_API_KEY;
  assert.equal((await (await request("GET")).json()).available, false);
});
