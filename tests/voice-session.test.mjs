import test from "node:test";
import assert from "node:assert/strict";
import { wakeRequest, parseVoiceCommand } from "../src/lib/voice/commands.ts";
import { VoiceRecognitionSession } from "../src/lib/voice/browser-recognition.ts";
import { stageVoiceEdit, voiceEditIsCurrent } from "../src/lib/voice/draft-edit.ts";
import { patientConversationHistory } from "../src/lib/voice/patient-history.ts";
import { canStartVoice, DEFAULT_VOICE_PREFERENCES, parseVoicePreferences } from "../src/lib/voice/preferences.ts";

function setup() {
  const instances = [], transcripts = [], errors = [], states = [];
  let wakes = 0;
  class Recognition {
    processLocally = false;
    constructor() { instances.push(this); }
    start() { this.onstart?.(); }
    abort() { this.aborted = true; }
    emit(text, final = true) { this.onresult?.({ resultIndex: 0, results: [{ isFinal: final, 0: { transcript: text } }] }); }
  }
  const session = new VoiceRecognitionSession(Recognition, {
    state: (state) => states.push(state), interim: () => {}, transcript: (text) => transcripts.push(text),
    wake: () => wakes++, error: (error) => { if (error) errors.push(error); },
  });
  return { session, Recognition, instances, transcripts, errors, states, wakes: () => wakes };
}

test("wake activation requires the complete prefix and preserves the actual request", () => {
  assert.equal(wakeRequest("Bonjour assist, ouvre l’agenda."), "ouvre l’agenda.");
  assert.equal(wakeRequest("Bonjour assiste, résume le dossier."), "résume le dossier.");
  assert.equal(wakeRequest(" BONJOUR   ASSIST ! "), "");
  for (const text of ["bonjour", "bonjour assistant", "bonjour assistante", "bonjour haoua", "elle a dit bonjour assist", "assist bonjour"]) assert.equal(wakeRequest(text), null);
});

test("voice defaults to active, honors an explicit pause and never defaults to remote processing", () => {
  assert.deepEqual(parseVoicePreferences(null), DEFAULT_VOICE_PREFERENCES);
  assert.equal(parseVoicePreferences("invalid").active, true);
  assert.equal(parseVoicePreferences('{"active":false}').active, false);
  assert.equal(canStartVoice(DEFAULT_VOICE_PREFERENCES, true, true, false), true);
  assert.equal(canStartVoice(DEFAULT_VOICE_PREFERENCES, false, true, false), false);
  assert.equal(canStartVoice(DEFAULT_VOICE_PREFERENCES, true, false, false), false);
  assert.equal(canStartVoice(DEFAULT_VOICE_PREFERENCES, true, true, true), false);
  assert.equal(canStartVoice({ active: true, processing: "browser", browserConsent: false }, true, true, false), false);
  assert.equal(canStartVoice({ active: true, processing: "browser", browserConsent: true }, true, true, false), true);
});

test("commands are allowlisted and never turn negated or ambiguous speech into an action", () => {
  assert.deepEqual(parseVoiceCommand("Ouvre l’agenda !"), { type: "navigate", href: "/agenda" });
  assert.deepEqual(parseVoiceCommand("Affiche les scores"), { type: "tab", tab: "scores" });
  assert.deepEqual(parseVoiceCommand("ajoute aux symptômes : Pas de fièvre, douleur 3/10."), { type: "dictate", field: "symptomes", value: "Pas de fièvre, douleur 3/10." });
  assert.deepEqual(parseVoiceCommand("ajoute aux symptômes pas de fièvre"), { type: "dictate", field: "symptomes", value: "pas de fièvre" });
  for (const raw of ["n’ouvre pas l’agenda", "ouvre l’agenda et supprime le dossier", "supprime le dossier", "oui", "ajoute aux allergies : aspirine", "affiche les scores de toutes les patientes"]) assert.deepEqual(parseVoiceCommand(raw), { type: "unsupported" });
});

test("staged dictation cannot apply to another patient, user or changed clinical revision", () => {
  const draft = { id: "a", specialite: "gyn", symptomes: "Douleur" };
  const edit = stageVoiceEdit(draft, "doctor", "symptomes", "Pas de fièvre.");
  assert.equal(edit.proposed, "Douleur\nPas de fièvre.");
  assert.equal(draft.symptomes, "Douleur");
  assert.equal(voiceEditIsCurrent(edit, draft, "doctor"), true);
  assert.equal(voiceEditIsCurrent(edit, { ...draft, id: "b" }, "doctor"), false);
  assert.equal(voiceEditIsCurrent(edit, draft, "other"), false);
  assert.equal(voiceEditIsCurrent(edit, { ...draft, symptomes: "Autre" }, "doctor"), false);
  assert.equal(voiceEditIsCurrent(edit, null, "doctor"), false);
});

test("wake-only activation waits for the next utterance; unrelated speech is discarded", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const s = setup(); await s.session.start("wake", true); t.after(() => s.session.stop());
  const mic = s.instances.at(-1);
  assert.equal(mic.processLocally, true);
  mic.emit("une consultation ordinaire");
  assert.equal(s.wakes(), 0);
  mic.emit("Bonjour assist");
  assert.equal(s.wakes(), 1); assert.deepEqual(s.transcripts, []);
  mic.emit("Explique la ménopause.");
  t.mock.timers.tick(1500);
  assert.deepEqual(s.transcripts, ["Explique la ménopause."]);
  assert.equal(mic.aborted, true);
});

test("phrase and request in one utterance are retained and interim results never activate", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const s = setup(); await s.session.start("wake", false); t.after(() => s.session.stop());
  const mic = s.instances.at(-1);
  mic.emit("Bonjour assist, ouvre l’agenda", false);
  assert.equal(s.wakes(), 0);
  mic.emit("Bonjour assist, ouvre l’agenda");
  t.mock.timers.tick(1500);
  assert.equal(s.wakes(), 1); assert.deepEqual(s.transcripts, ["ouvre l’agenda"]);
});

test("stopping invalidates late results, errors and scheduled restarts", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const s = setup(); await s.session.start("dictate", false);
  const mic = s.instances.at(-1), lateResult = mic.onresult, lateError = mic.onerror;
  mic.onend(); s.session.stop();
  lateResult({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: "ancienne patiente" } }] });
  lateError({ error: "network" }); t.mock.timers.tick(60_000);
  assert.deepEqual(s.transcripts, []); assert.deepEqual(s.errors, []);
  assert.equal(s.instances.length, 1);
});

test("the browser may split the wake prefix across consecutive final results", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const s = setup(); await s.session.start("wake", false); t.after(() => s.session.stop());
  const mic = s.instances.at(-1);
  mic.emit("bonjour"); mic.emit("assiste, explique l’endométriose"); t.mock.timers.tick(1500);
  assert.equal(s.wakes(), 1); assert.deepEqual(s.transcripts, ["explique l’endométriose"]);
});

test("a pending local availability check cannot restart listening after cancellation", async () => {
  const s = setup(); let resolve;
  s.Recognition.available = () => new Promise((done) => { resolve = done; });
  const starting = s.session.start("wake", true);
  s.session.stop(); resolve("available"); await starting;
  assert.equal(s.instances.length, 1); assert.deepEqual(s.transcripts, []);
});

test("late callbacks from an ended recognizer cannot affect its replacement", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const s = setup(); await s.session.start("wake", false); t.after(() => s.session.stop());
  const old = s.instances.at(-1), lateResult = old.onresult, lateError = old.onerror;
  old.onend(); t.mock.timers.tick(400);
  const replacement = s.instances.at(-1);
  assert.notEqual(old, replacement);
  lateResult({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: "bonjour assist, ancienne demande" } }] });
  lateError({ error: "network" });
  assert.equal(s.wakes(), 0); assert.deepEqual(s.errors, []);
  replacement.emit("bonjour assist, nouvelle demande"); t.mock.timers.tick(1500);
  assert.deepEqual(s.transcripts, ["nouvelle demande"]);
});

test("recording length is bounded and listening timeout survives browser restarts", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const s = setup(); await s.session.start("dictate", false);
  s.instances.at(-1).emit("a".repeat(2001));
  assert.deepEqual(s.transcripts, []); assert.match(s.errors.at(-1), /trop longue/);
  await s.session.start("wake", false);
  t.mock.timers.tick(299_000); s.instances.at(-1).onend(); t.mock.timers.tick(1100);
  assert.equal(s.states.at(-1), "idle"); assert.deepEqual(s.transcripts, []);
});

test("silence and permission errors never submit a question", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const s = setup(); await s.session.start("wake", false);
  s.instances.at(-1).emit("Bonjour assist"); t.mock.timers.tick(10_100);
  assert.deepEqual(s.transcripts, []); assert.match(s.errors.at(-1), /Aucune demande/);
  await s.session.start("dictate", false);
  s.instances.at(-1).onerror({ error: "not-allowed" });
  assert.match(s.errors.at(-1), /Microphone refusé/); assert.deepEqual(s.transcripts, []);
});

test("local mode never falls back to a remote recognition service", async () => {
  const s = setup(); s.Recognition.available = async () => "downloadable";
  await s.session.start("wake", true);
  assert.match(s.errors.at(-1), /français local/);
  assert.equal(s.instances.length, 1); // support probe only; start was never called
  s.session.stop();
});

test("patient history uses bounded complete exchanges from the latest saved revision only", () => {
  const entry = (revision, question = "Q", reply = "A") => ({ mode: "question", revision, question, reply });
  const patient = { hawaeIaHistory: [entry("old"), ...Array.from({ length: 7 }, (_, i) => entry("current", `Q${i}`))] };
  const history = patientConversationHistory(patient, "current");
  assert.equal(history.length, 8); assert.equal(history[0].content, "Q3");
  assert.deepEqual(patientConversationHistory(patient, "another"), []);
  assert.deepEqual(patientConversationHistory({ hawaeIaHistory: [entry("current"), entry("old")] }, "current"), []);
  assert.deepEqual(patientConversationHistory({ hawaeIaHistory: [entry("current", "", "")] }, "current"), []);
});
