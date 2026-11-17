import test from "node:test";
import assert from "node:assert/strict";
import { OpenRouterSpeechStream, Pcm16Decoder } from "../src/lib/voice/openrouter-speech-stream.ts";
import { webAudio } from "./fixtures/voice-audio.mjs";
import { heygenSpokenText } from "../src/lib/voice/spoken-text.ts";

const audioHeaders = { "Content-Type": "audio/pcm; rate=44100; channels=1", "X-Hawae-Audio-Sample-Rate": "44100" };
const flush = () => new Promise((resolve) => setImmediate(resolve));
function setup(t) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const browser = webAudio(), context = new browser.Context(), states = [], calls = [];
  const fetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => { calls.push(init); return new Response(new ReadableStream({ start(controller) { calls.at(-1).controller = controller; } }), { headers: audioHeaders }); };
  const stream = new OpenRouterSpeechStream(context, { start: (text) => states.push(["start", text]), waiting: () => states.push(["waiting"]), done: () => states.push(["done"]), error: (message) => states.push(["error", message]) });
  t.after(() => { stream.cancel(); globalThis.fetch = fetch; });
  return { ...browser, context, states, calls, stream };
}

test("PCM16 decodes signed little-endian samples across every possible byte boundary", () => {
  const bytes = Uint8Array.of(0, 128, 255, 127, 0, 0, 0, 64);
  for (let boundary = 0; boundary <= bytes.length; boundary++) {
    const decoder = new Pcm16Decoder();
    assert.deepEqual([...decoder.decode(bytes.slice(0, boundary)), ...decoder.decode(bytes.slice(boundary))], [-1, 32767 / 32768, 0, .5]);
    assert.doesNotThrow(() => decoder.finish());
  }
  const truncated = new Pcm16Decoder(); truncated.decode(Uint8Array.of(42)); assert.throws(() => truncated.finish(), /incomplet/);
});

test("HeyGen control delimiters cannot silently swallow clinical qualifiers or numbers", () => {
  assert.equal(heygenSpokenText("Résultat [0.5 ng/mL], [pas de fièvre]."), "Résultat 0.5 ng/mL, pas de fièvre.");
  assert.equal(heygenSpokenText("[slowly] [Section 4]"), "slowly Section 4");
});

test("HeyGen PCM starts playback before the response closes and waits for audio to drain", async (t) => {
  const s = setup(t); s.stream.append("Première phrase."); s.stream.finish(); await flush();
  assert.deepEqual(JSON.parse(s.calls[0].body), { text: "Première phrase." });
  assert.equal(s.calls[0].headers.Authorization, undefined);
  s.calls[0].controller.enqueue(new Uint8Array(8192)); await flush();
  assert.equal(s.sources.length, 1); assert.equal(s.sources[0].buffer.sampleRate, 44100);
  assert.equal(s.states.some(([kind]) => kind === "start"), false);
  t.mock.timers.tick(36); assert.deepEqual(s.states.at(-1), ["start", "Première phrase."]);
  s.calls[0].controller.close(); await flush();
  assert.equal(s.states.some(([kind]) => kind === "done"), false);
  s.sources[0].end(); assert.deepEqual(s.states.at(-1), ["done"]);
});

test("interruption aborts the request, stops scheduled audio and prevents late audio or queued requests", async (t) => {
  const s = setup(t); s.stream.append("Ancien audio."); s.stream.append("À annuler."); await flush();
  s.calls[0].controller.enqueue(new Uint8Array(8192)); await flush();
  const staleEnd = s.sources[0].onended;
  s.stream.cancel(); assert.equal(s.calls[0].signal.aborted, true); assert.equal(s.sources[0].stopped, true);
  s.calls[0].controller.enqueue(new Uint8Array(8192)); s.calls[0].controller.close(); await flush();
  staleEnd(); t.mock.timers.tick(1000);
  assert.equal(s.sources.length, 1); assert.equal(s.calls.length, 1);
  assert.equal(s.states.length, 0);
});

test("sentences queued during audio generation are coalesced without reordering", async (t) => {
  const s = setup(t); s.stream.append("Première."); s.stream.append("Deuxième."); s.stream.append("Troisième."); s.stream.finish(); await flush();
  s.calls[0].controller.enqueue(new Uint8Array(8192)); s.calls[0].controller.close(); await flush();
  assert.equal(s.calls.length, 2);
  assert.equal(JSON.parse(s.calls[1].body).text, "Deuxième. Troisième.");
  s.calls[1].controller.enqueue(new Uint8Array(8192)); s.calls[1].controller.close(); await flush();
  assert.ok(s.sources[1].startAt >= s.sources[0].startAt + s.sources[0].buffer.duration);
  s.sources[0].end(); assert.equal(s.states.some(([kind]) => kind === "done"), false);
  s.sources[1].end(); assert.deepEqual(s.states.at(-1), ["done"]);
});

test("provider errors remain errors and never become audio or a different model request", async (t) => {
  const s = setup(t);
  let requests = 0;
  globalThis.fetch = async () => { requests++; return Response.json({ error: "Limite gratuite atteinte." }, { status: 429 }); };
  s.stream.append("À lire."); s.stream.append("À annuler."); s.stream.finish(); await flush();
  assert.equal(requests, 1); assert.equal(s.sources.length, 0);
  assert.deepEqual(s.states.at(-1), ["error", "Limite gratuite atteinte."]);
});

test("truncated PCM fails and stops already scheduled audio", async (t) => {
  const s = setup(t); s.stream.append("À lire."); s.stream.finish(); await flush();
  s.calls[0].controller.enqueue(new Uint8Array(8193)); s.calls[0].controller.close(); await flush();
  assert.equal(s.sources[0].stopped, true);
  assert.match(s.states.at(-1)[1], /incomplet/);
});

test("a blocked audio context times out without sending text to the speech provider", async (t) => {
  const s = setup(t); s.context.resume = () => new Promise(() => {});
  s.stream.append("À lire."); t.mock.timers.tick(6001); await flush();
  assert.equal(s.calls.length, 0); assert.match(s.states.at(-1)[1], /Touchez la barre/);
});
