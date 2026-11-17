import test from "node:test";
import assert from "node:assert/strict";
import { RealtimeVoiceSession } from "../src/lib/voice/realtime-session.ts";
import { realtimeBrowser } from "./fixtures/realtime-browser.mjs";

async function setup(t) {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const browser = realtimeBrowser();
  const previous = Object.fromEntries(["navigator", "document", "RTCPeerConnection", "fetch"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { mediaDevices: browser.devices } });
  globalThis.document = { createElement: () => browser.audio() }; globalThis.RTCPeerConnection = browser.Peer;
  globalThis.fetch = async (_url, init) => {
    assert.equal(init.headers["Content-Type"], "application/sdp");
    assert.equal(init.headers.Authorization, undefined);
    return new Response("v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n");
  };
  const states = [], tools = [], transcripts = [], errors = []; let interruptions = 0, closes = 0;
  const session = new RealtimeVoiceSession({ state: (s) => states.push(s), interrupt: () => interruptions++, transcript: (s) => transcripts.push(s), tool: (s) => tools.push(s), error: (s) => errors.push(s), close: () => closes++ });
  t.after(() => {
    session.close();
    for (const [key, descriptor] of Object.entries(previous)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  });
  await session.connect("Quels sont mes rendez-vous ?");
  return { ...browser, session, states, tools, transcripts, errors, interruptions: () => interruptions, closes: () => closes };
}

test("native speech onset immediately silences playback before a transcription exists", async (t) => {
  const s = await setup(t), channel = s.peers[0].channel, audio = s.audios[0];
  channel.emit({ type: "response.created", response: { id: "old-response" } });
  channel.emit({ type: "output_audio_buffer.started", response_id: "old-response" });
  assert.equal(audio.muted, false);
  channel.emit({ type: "input_audio_buffer.speech_started" });
  assert.equal(audio.muted, true); assert.equal(audio.paused, true); assert.equal(s.interruptions(), 1);
  assert.deepEqual(s.transcripts, []);
  assert.ok(channel.messages.some((event) => event.type === "response.cancel"));
  assert.ok(channel.messages.some((event) => event.type === "output_audio_buffer.clear"));
  channel.emit({ type: "output_audio_buffer.started", response_id: "old-response" });
  assert.equal(audio.muted, true);
  channel.emit({ type: "input_audio_buffer.speech_stopped" });
  channel.emit({ type: "response.created", response: { id: "new-response" } });
  channel.emit({ type: "output_audio_buffer.started", response_id: "new-response" });
  assert.equal(audio.muted, false);
});

test("tool results from an interrupted turn cannot restart stale audio", async (t) => {
  const s = await setup(t), channel = s.peers[0].channel;
  channel.emit({ type: "response.function_call_arguments.done", name: "hawae_request", call_id: "call-1", arguments: JSON.stringify({ request: "résume le dossier" }) });
  assert.equal(s.tools.length, 1);
  channel.emit({ type: "input_audio_buffer.speech_started" });
  assert.equal(s.session.completeTool(s.tools[0], "ancienne réponse"), false);
  channel.emit({ type: "input_audio_buffer.speech_stopped" });
  channel.emit({ type: "response.function_call_arguments.done", name: "hawae_request", call_id: "call-2", arguments: JSON.stringify({ request: "quels sont mes rendez-vous" }) });
  assert.equal(s.session.completeTool(s.tools[1], "résultat réel du cabinet"), true);
  assert.equal(s.session.completeTool(s.tools[1], "duplication"), false);
  assert.equal(channel.messages.filter((event) => event.item?.type === "function_call_output").length, 1);
});

test("only the declared bounded tool can dispatch application work", async (t) => {
  const s = await setup(t), channel = s.peers[0].channel;
  for (const event of [{ name: "run_javascript", call_id: "a", arguments: '{}' }, { name: "hawae_request", call_id: "b", arguments: '{"request":42}' }, { name: "hawae_request", call_id: "c", arguments: JSON.stringify({ request: "x".repeat(2001) }) }, { name: "hawae_request", call_id: "null", arguments: 'null' }]) channel.emit({ type: "response.function_call_arguments.done", ...event });
  for (const event of [null, [], 42, "invalid"]) channel.emit(event);
  assert.deepEqual(s.tools, []);
});

test("completed calls cannot be replayed and stale events cannot cancel a newer response", async (t) => {
  const s = await setup(t), channel = s.peers[0].channel;
  const call = { type: "response.function_call_arguments.done", name: "hawae_request", call_id: "once", arguments: JSON.stringify({ request: "résume le dossier" }) };
  channel.emit(call); s.session.completeTool(s.tools[0], "résultat"); channel.emit(call);
  assert.equal(s.tools.length, 1);
  channel.emit({ type: "response.created", response: { id: "old" } });
  channel.emit({ type: "response.done", response: { id: "old" } });
  s.session.interrupt();
  channel.emit({ type: "response.created", response: { id: "new" } });
  channel.emit({ type: "response.created", response: { id: "old" } });
  channel.emit({ type: "response.done", response: { id: "old" } });
  channel.emit({ type: "output_audio_buffer.started", response_id: "new" });
  assert.equal(s.audios[0].muted, false);
  channel.emit({ type: "output_audio_buffer.stopped", response_id: "old" });
  assert.equal(s.states.at(-1), "speaking");
  s.session.interrupt();
  assert.ok(channel.messages.some((event) => event.type === "response.cancel" && event.response_id === "new"));
  channel.emit({ type: "output_audio_buffer.started", response_id: "old" });
  assert.equal(s.audios[0].muted, true);
});

test("closing while microphone permission is pending stops tracks when permission resolves", async (t) => {
  const s = await setup(t);
  let grant;
  navigator.mediaDevices.getUserMedia = () => new Promise((resolve) => { grant = resolve; });
  const other = new RealtimeVoiceSession({ state() {}, interrupt() {}, transcript() {}, tool() {}, error() {}, close() {} });
  const connecting = other.connect(""); other.close();
  let stopped = false;
  grant({ getTracks: () => [{ stop() { stopped = true; } }] });
  await connecting;
  assert.equal(stopped, true); assert.equal(s.peers.length, 1);
});

test("idle shutdown releases the microphone, peer and remote audio", async (t) => {
  const s = await setup(t); t.mock.timers.tick(90_100);
  assert.equal(s.session.isClosed, true); assert.equal(s.tracks[0].stopped, true);
  assert.equal(s.peers[0].connectionState, "closed"); assert.equal(s.audios[0].srcObject, null);
  assert.equal(s.closes(), 1);
  s.session.close(); assert.equal(s.closes(), 1);
});
