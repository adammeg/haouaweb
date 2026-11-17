import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { Window } from "happy-dom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { navigation } from "./fixtures/voice-navigation.mjs";
import { VOICE_SESSION_END_EVENT } from "../src/lib/voice/preferences.ts";
import { realtimeBrowser } from "./fixtures/realtime-browser.mjs";
import { webAudio } from "./fixtures/voice-audio.mjs";

registerHooks({ resolve(specifier, context, next) {
  return next(specifier === "next/navigation" ? new URL("./fixtures/voice-navigation.mjs", import.meta.url).href : specifier, context);
} });
const { VoiceAssistant } = await import("../src/components/voice/voice-assistant.tsx");
const { useHawaeStore } = await import("../src/stores/hawae-store.ts");
const { useRdvStore } = await import("../src/stores/rdv-store.ts");
const { useAssistantDataStatus } = await import("../src/stores/assistant-data-status.ts");

async function mount(t, { access = "enabled", preferences, localSupported = true, speechStarts = true, availability, realtime = false, serverSpeech = false } = {}) {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const window = new Window({ url: "http://localhost:3000" });
  Object.defineProperty(window, "isSecureContext", { value: true });
  let visibility = "visible";
  Object.defineProperty(window.document, "visibilityState", { get: () => visibility });
  const instances = [], spoken = [], requests = [];
  class Recognition {
    constructor() { if (localSupported) this.processLocally = false; instances.push(this); }
    start() { this.started = true; this.onstart?.(); }
    abort() { this.aborted = true; }
    emit(text) { this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: text } }] }); }
  }
  if (availability) Recognition.available = async () => availability;
  class Utterance { constructor(text) { this.text = text; } }
  window.SpeechRecognition = Recognition;
  window.speechSynthesis = { getVoices: () => [], speak: (utterance) => { spoken.push(utterance); if (speechStarts) utterance.onstart?.(); }, cancel: () => {} };
  globalThis.window = window; globalThis.document = window.document; globalThis.localStorage = window.localStorage;
  globalThis.SpeechSynthesisUtterance = Utterance; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const oldFetch = globalThis.fetch;
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const oldPeer = Object.getOwnPropertyDescriptor(globalThis, "RTCPeerConnection");
  const rtc = realtime ? realtimeBrowser() : null;
  const audio = serverSpeech ? webAudio() : null;
  const audioRequests = [];
  if (audio) window.AudioContext = audio.Context;
  if (rtc) {
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { mediaDevices: rtc.devices } });
    globalThis.RTCPeerConnection = window.RTCPeerConnection = rtc.Peer;
    const createElement = window.document.createElement.bind(window.document);
    window.document.createElement = (tag, ...args) => tag === "audio" ? rtc.audio() : createElement(tag, ...args);
  }
  globalThis.fetch = async (_url, init) => {
    if (_url === "/api/voice/realtime") return init?.method === "POST" ? new Response("v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n") : Response.json({ available: realtime });
    if (_url === "/api/voice/speech") {
      if (init?.method !== "POST") return Response.json({ available: serverSpeech });
      audioRequests.push(init);
      return new Response(new Uint8Array(8192), { headers: { "Content-Type": "audio/pcm", "X-Hawae-Audio-Sample-Rate": "44100" } });
    }
    requests.push(JSON.parse(init.body));
    return Response.json({ reply: "Réponse vocale synthétique." });
  };
  if (preferences) window.localStorage.setItem("hawae:voice:doctor-test", JSON.stringify(preferences));
  useHawaeStore.setState({ draft: null, currentPatientId: null, currentUserId: "doctor-test", users: [{ id: "doctor-test", name: "Médecin test", initials: "MT", role: "medecin", color: "#000" }], patientsByUser: {}, historyByUser: {} });
  useRdvStore.setState({ list: [] });
  useAssistantDataStatus.setState({ doctorId: "doctor-test", patients: "ready", clinical: "ready" });
  navigation.pushed = [];
  const container = window.document.createElement("div"); window.document.body.append(container);
  const root = createRoot(container);
  await act(async () => { root.render(React.createElement(VoiceAssistant, { access, accountId: "doctor-test" })); });
  const tick = async (ms) => { await act(async () => { t.mock.timers.tick(ms); }); };
  const click = async (label) => {
    const button = [...container.querySelectorAll("button")].find((button) => button.getAttribute("aria-label") === label || button.textContent === label);
    assert.ok(button, `Missing button: ${label}`);
    await act(async () => { button.click(); });
  };
  t.after(async () => {
    await act(async () => root.unmount());
    globalThis.fetch = oldFetch;
    await window.happyDOM.close();
    delete globalThis.window; delete globalThis.document; delete globalThis.localStorage;
    delete globalThis.SpeechSynthesisUtterance; delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    if (oldNavigator) Object.defineProperty(globalThis, "navigator", oldNavigator); else delete globalThis.navigator;
    if (oldPeer) Object.defineProperty(globalThis, "RTCPeerConnection", oldPeer); else delete globalThis.RTCPeerConnection;
  });
  return { container, instances, spoken, requests, tick, click, window, rtc, audio, audioRequests,
    hide: async () => { visibility = "hidden"; await act(async () => window.document.dispatchEvent(new window.Event("visibilitychange"))); },
    show: async () => { visibility = "visible"; await act(async () => window.document.dispatchEvent(new window.Event("visibilitychange"))); },
  };
}

test("the top island starts listening by default and renders no chat or text composer", async (t) => {
  const view = await mount(t);
  await view.tick(500);
  assert.equal(view.instances.at(-1).started, true);
  assert.match(view.container.textContent, /Dites « bonjour assist »/);
  assert.equal(view.container.querySelector("textarea, form, [role=log], .quick-ai"), null);
  assert.equal(view.container.querySelector(".assist-island-card"), null);
});

test("both spellings send a request automatically; speaking is not cut off by request completion", async (t) => {
  const view = await mount(t); await view.tick(500);
  await act(async () => { view.instances.at(-1).emit("bonjour assiste, explique la ménopause"); });
  assert.match(view.container.textContent, /Assist vous écoute/);
  await view.tick(1500);
  assert.equal(view.requests.length, 1);
  assert.equal(view.requests[0].question, "explique la ménopause");
  assert.equal(view.requests[0].mode, "chat");
  assert.equal(view.spoken.length, 1);
  assert.match(view.container.textContent, /Assist vous répond/);
  assert.equal(view.container.querySelector("textarea, [role=log]"), null);
  await act(async () => { view.spoken[0].onend(); });
  await view.tick(500);
  assert.match(view.container.textContent, /À vous/);
});

test("navigation commands run without opening a chat or invoking the model", async (t) => {
  const view = await mount(t); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist, ouvre l’agenda"));
  await view.tick(1500);
  assert.deepEqual(navigation.pushed, ["/agenda"]);
  assert.equal(view.requests.length, 0);
});

test("manual pause persists and is not overridden when the page becomes visible", async (t) => {
  const view = await mount(t); await view.tick(500);
  const mic = view.instances.at(-1);
  await view.click("Mettre Assist en pause");
  assert.equal(mic.aborted, true);
  assert.match(view.container.textContent, /Assist en pause/);
  await view.hide(); await view.show(); await view.tick(500);
  assert.equal(view.instances.at(-1), mic);
  assert.equal(JSON.parse(view.window.localStorage.getItem("hawae:voice:doctor-test")).active, false);
});

test("foregrounding resumes the default assistant, while background audio never submits", async (t) => {
  const view = await mount(t); await view.tick(500);
  const mic = view.instances.at(-1), stale = mic.onresult;
  await view.hide();
  await act(async () => stale({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: "bonjour assist, ancienne demande" } }] }));
  await view.tick(1500); assert.equal(view.requests.length, 0);
  await view.show(); await view.tick(500);
  assert.notEqual(view.instances.at(-1), mic);
  assert.match(view.container.textContent, /Dites « bonjour assist »/);
});

test("remote recognition cannot auto-start without its explicit authorization", async (t) => {
  const view = await mount(t, { preferences: { active: true, processing: "browser", browserConsent: false }, localSupported: false });
  await view.tick(500);
  assert.equal(view.instances.some((mic) => mic.started), false);
  assert.match(view.container.textContent, /Configurer Assist/);
});

test("restricted accounts render no island and never start a microphone", async (t) => {
  const view = await mount(t, { access: "restricted" }); await view.tick(500);
  assert.equal(view.container.innerHTML, ""); assert.equal(view.instances.length, 0);
});

test("settings pause capture and closing them resumes voice without a chat interface", async (t) => {
  const view = await mount(t); await view.tick(500);
  const mic = view.instances.at(-1);
  await view.click("Réglages d’Assist");
  assert.equal(mic.aborted, true);
  assert.equal(view.container.querySelector("textarea, form, [role=log]"), null);
  await view.click("Fermer les réglages"); await view.tick(500);
  assert.equal(view.instances.at(-1).started, true);
  assert.notEqual(view.instances.at(-1), mic);
});

test("clinical dictation still requires review and switching patient discards its preview", async (t) => {
  const view = await mount(t);
  const patient = { id: "a", specialite: "gyn", symptomes: "Douleur" };
  await act(async () => useHawaeStore.setState({ draft: patient, currentPatientId: "a" }));
  await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist, ajoute aux symptômes : pas de fièvre"));
  await view.tick(1500);
  assert.match(view.container.textContent, /Modification à valider/);
  assert.equal(useHawaeStore.getState().draft.symptomes, "Douleur");
  assert.equal(view.requests.length, 0);
  await act(async () => useHawaeStore.setState({ draft: { ...patient, id: "b" }, currentPatientId: "b" }));
  assert.equal(view.container.querySelector('[aria-label="Modification clinique à valider"]'), null);
  assert.equal(useHawaeStore.getState().draft.symptomes, "Douleur");
});

test("wake-only silence returns to waiting without sending a model request", async (t) => {
  const view = await mount(t); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist"));
  await view.tick(10_100); await view.tick(500);
  assert.equal(view.requests.length, 0);
  assert.match(view.container.textContent, /Dites « bonjour assist »/);
});

test("logout immediately stops listening and foregrounding cannot re-enable it", async (t) => {
  const view = await mount(t); await view.tick(500);
  const mic = view.instances.at(-1);
  await act(async () => view.window.dispatchEvent(new view.window.Event(VOICE_SESSION_END_EVENT)));
  assert.equal(mic.aborted, true);
  await view.hide(); await view.show(); await view.tick(500);
  assert.equal(view.instances.at(-1), mic);
  assert.equal(view.requests.length, 0);
});

test("a doctor can ask a follow-up without repeating the wake phrase", async (t) => {
  const view = await mount(t); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist, explique la ménopause"));
  await view.tick(1500);
  await act(async () => view.spoken[0].onend()); await view.tick(500);
  assert.match(view.container.textContent, /À vous/);
  await act(async () => view.instances.at(-1).emit("Et les symptômes ?")); await view.tick(1500);
  assert.equal(view.requests.length, 2);
  assert.equal(view.requests[1].question, "Et les symptômes ?");
  assert.equal(view.requests[1].history.length, 2);
});

test("the primary island action starts a request instead of disabling the assistant", async (t) => {
  const view = await mount(t); await view.tick(500);
  await view.click("Parler à Assist");
  await view.tick(500);
  await act(async () => view.instances.at(-1).emit("Quels sujets aborder en consultation ?")); await view.tick(1500);
  assert.equal(view.requests.length, 1);
});

test("silence after an answer closes the follow-up window and returns to wake-only listening", async (t) => {
  const view = await mount(t); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist, explique la ménopause")); await view.tick(1500);
  await act(async () => view.spoken[0].onend()); await view.tick(500);
  await view.tick(20_100); await view.tick(500);
  assert.match(view.container.textContent, /Dites « bonjour assist »/);
  await act(async () => view.instances.at(-1).emit("conversation sans activation")); await view.tick(1500);
  assert.equal(view.requests.length, 1);
});

test("the wake phrase interrupts spoken output and accepts a replacement question", async (t) => {
  const view = await mount(t); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist, explique la ménopause")); await view.tick(1500);
  await view.tick(500);
  const oldSpeech = view.spoken[0];
  await act(async () => view.instances.at(-1).emit("Réponse vocale synthétique.")); await view.tick(1500);
  assert.equal(view.requests.length, 1);
  await act(async () => view.instances.at(-1).emit("bonjour assist, développe le dernier point")); await view.tick(1500);
  assert.equal(view.requests.length, 2);
  assert.equal(oldSpeech.onend, null);
  assert.equal(view.requests[1].question, "développe le dernier point");
});

test("blocked synthesis is detected quickly and never falsely marked as speaking", async (t) => {
  const view = await mount(t, { speechStarts: false }); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist, explique la ménopause")); await view.tick(1500);
  assert.doesNotMatch(view.container.textContent, /Assist vous répond/);
  await view.tick(6500);
  assert.match(view.container.textContent, /Lecture bloquée/);
});

test("waking during a pending request aborts it and a late response cannot speak or become history", async (t) => {
  const view = await mount(t); await view.tick(500);
  let resolveOld, oldSignal;
  const completedFetch = globalThis.fetch;
  globalThis.fetch = (_url, init) => {
    oldSignal = init.signal;
    return new Promise((resolve) => { resolveOld = resolve; });
  };
  await act(async () => view.instances.at(-1).emit("bonjour assist, ancienne question")); await view.tick(1500);
  assert.match(view.container.textContent, /Assist réfléchit/);
  await view.tick(500);
  globalThis.fetch = completedFetch;
  await act(async () => view.instances.at(-1).emit("bonjour assist, nouvelle question")); await view.tick(1500);
  assert.equal(oldSignal.aborted, true);
  assert.equal(view.requests[0].question, "nouvelle question");
  assert.deepEqual(view.requests[0].history, []);
  await act(async () => resolveOld(Response.json({ reply: "Ancienne réponse à ne jamais lire." })));
  assert.equal(view.spoken.length, 1);
  assert.equal(view.spoken[0].text, "Réponse vocale synthétique.");
});

test("the conversation can be ended or explicitly paused by voice", async (t) => {
  const view = await mount(t); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist, explique la ménopause")); await view.tick(1500);
  await act(async () => view.spoken[0].onend()); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("c’est tout")); await view.tick(1500); await view.tick(500);
  assert.match(view.container.textContent, /Dites « bonjour assist »/);
  await act(async () => view.instances.at(-1).emit("bonjour assist, mets-toi en pause")); await view.tick(1500);
  assert.match(view.container.textContent, /Assist en pause/);
  assert.equal(view.requests.length, 1);
});

test("repeat reuses the completed answer instead of invoking the model again", async (t) => {
  const view = await mount(t); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist, explique la ménopause")); await view.tick(1500);
  await act(async () => view.spoken[0].onend()); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("répète")); await view.tick(1500);
  assert.equal(view.requests.length, 1); assert.equal(view.spoken.length, 2);
  assert.equal(view.spoken[1].text, view.spoken[0].text);
});

test("a missing local language pack is a setup problem rather than an endless retry button", async (t) => {
  const view = await mount(t, { availability: "downloadable" }); await view.tick(500);
  assert.equal(view.instances.some((mic) => mic.started), false);
  await view.click("Configurer Assist");
  assert.ok(view.container.querySelector('[aria-label="Réglages vocaux"]'));
});

test("changing the patient during the follow-up window closes the old conversational session", async (t) => {
  const view = await mount(t); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist, explique la ménopause")); await view.tick(1500);
  await act(async () => view.spoken[0].onend()); await view.tick(500);
  const oldMic = view.instances.at(-1), stale = oldMic.onresult;
  await act(async () => useHawaeStore.setState({ draft: { id: "new-patient", specialite: "gyn" }, currentPatientId: "new-patient" }));
  await act(async () => stale({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: "ancienne question sans activation" } }] }));
  await view.tick(1500);
  assert.equal(view.requests.length, 1);
  assert.match(view.container.textContent, /Dites « bonjour assist »/);
  assert.equal(view.container.querySelector('[aria-label="Réécouter la réponse"]'), null);
});

test("a request that never returns times out with actionable spoken feedback", async (t) => {
  const view = await mount(t); await view.tick(500);
  globalThis.fetch = (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  });
  await act(async () => view.instances.at(-1).emit("bonjour assist, question sans réponse")); await view.tick(1500);
  await view.tick(45_100);
  assert.match(view.container.textContent, /prend trop de temps/);
  assert.equal(view.spoken.length, 1);
  assert.match(view.spoken[0].text, /question plus courte/);
});

test("when the browser rejects simultaneous recognition, playback continues with a visible tap fallback", async (t) => {
  const view = await mount(t); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist, explique la ménopause")); await view.tick(1500); await view.tick(500);
  await act(async () => view.instances.at(-1).onerror({ error: "audio-capture" }));
  assert.match(view.container.textContent, /Touchez la barre pour interrompre/);
  assert.match(view.container.textContent, /Assist vous répond/);
  assert.equal(typeof view.spoken[0].onend, "function");
});

test("the assistant reads real appointment data without asking a model to guess the agenda", async (t) => {
  const view = await mount(t); await view.tick(500);
  await act(async () => useRdvStore.setState({ list: [{ id: "rdv", patient: "Fatima Test", date: "2026-01-01", heure: "14:30", duree: 30, statut: "confirme", type: "consultation" }] }));
  await act(async () => view.instances.at(-1).emit("bonjour assist, quels sont mes rendez-vous le 1 janvier 2026")); await view.tick(1500);
  assert.equal(view.requests.length, 0);
  assert.match(view.spoken.at(-1).text, /Fatima Test/);
  assert.match(view.spoken.at(-1).text, /14 heures 30/);
});

test("an unloaded agenda cannot be reported as an empty agenda", async (t) => {
  const view = await mount(t); await view.tick(500);
  useAssistantDataStatus.setState({ clinical: "loading" });
  await act(async () => view.instances.at(-1).emit("bonjour assist, quels sont mes rendez-vous demain")); await view.tick(1500);
  assert.equal(view.requests.length, 0);
  assert.match(view.spoken.at(-1).text, /en cours de chargement/);
  assert.doesNotMatch(view.spoken.at(-1).text, /Aucun rendez-vous/);
});

test("a named patient can be found and opened without an already-open dossier", async (t) => {
  const view = await mount(t); await view.tick(500);
  await act(async () => useHawaeStore.setState({ patientsByUser: { "doctor-test": { p: { id: "p", prenom: "Fatima", nom: "Ben Ali", specialite: "gyn" } } } }));
  await act(async () => view.instances.at(-1).emit("bonjour assist, ouvre le dossier de Fatima Ben Ali")); await view.tick(1500);
  assert.equal(useHawaeStore.getState().draft.id, "p");
  assert.deepEqual(navigation.pushed, ["/dossier"]);
  assert.equal(view.requests.length, 0);
});

test("the assistant reads patient identity and treatments from the real draft", async (t) => {
  const view = await mount(t);
  await act(async () => useHawaeStore.setState({ draft: { id: "p", prenom: "Fatima", nom: "Test", specialite: "gyn", traitements: "Traitement du dossier" }, currentPatientId: "p" })); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist, quels sont ses traitements")); await view.tick(1500);
  assert.match(view.spoken.at(-1).text, /Traitement du dossier/);
  assert.equal(view.requests.length, 0);
});

test("ambiguous patient names require a choice and cannot silently open the wrong dossier", async (t) => {
  const view = await mount(t); await view.tick(500);
  await act(async () => useHawaeStore.setState({ patientsByUser: { "doctor-test": { a: { id: "a", prenom: "Fatima", nom: "Test A", specialite: "gyn" }, b: { id: "b", prenom: "Fatima", nom: "Test B", specialite: "gyn" } } } }));
  await act(async () => view.instances.at(-1).emit("bonjour assist, ouvre le dossier de Fatima")); await view.tick(1500);
  assert.equal(useHawaeStore.getState().draft, null);
  assert.ok(view.container.querySelector('[aria-label="Choisir une patiente"]'));
  await view.click("Fatima Test B · Médecin test");
  assert.equal(useHawaeStore.getState().draft.id, "b");
});

test("booking a voice appointment opens a prefilled review form and does not save it silently", async (t) => {
  const view = await mount(t);
  const patient = { id: "p", prenom: "Fatima", nom: "Test", specialite: "gyn" };
  await act(async () => useHawaeStore.setState({ draft: patient, currentPatientId: "p", patientsByUser: { "doctor-test": { p: patient } } })); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist, prends un rendez-vous pour la patiente actuelle demain à 14 heures 30")); await view.tick(1500);
  assert.ok(view.window.document.body.querySelector('[role="dialog"]'));
  assert.equal(view.container.querySelector('[role="dialog"]'), null);
  const inputs = [...view.window.document.body.querySelectorAll("input")];
  assert.ok(inputs.some((input) => input.value === "Fatima Test"));
  assert.ok(inputs.some((input) => input.value === "14:30"));
  assert.equal(useRdvStore.getState().list.length, 0);
  await act(async () => view.window.document.body.querySelector("form").dispatchEvent(new view.window.Event("submit", { bubbles: true, cancelable: true })));
  assert.equal(useRdvStore.getState().list.length, 1);
  assert.equal(useRdvStore.getState().list[0].patient, "Fatima Test");
  assert.equal(useRdvStore.getState().list[0].heure, "14:30");
  assert.match(view.spoken.at(-1).text, /Rendez-vous ajouté/);
});

test("a named dossier summary saves the selected patient and sends the exact authorized revision", async (t) => {
  const view = await mount(t); await view.tick(500);
  const patient = { id: "named-patient", prenom: "Fatima", nom: "Ben Ali", specialite: "gyn", symptomes: "Symptômes du dossier choisi" };
  await act(async () => useHawaeStore.setState({ patientsByUser: { "doctor-test": { [patient.id]: patient } } }));
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body); calls.push({ url, body });
    if (url === "/api/workspace/state") return Response.json({ updatedAt: "2026-11-17T10:00:00Z" });
    return Response.json({ reply: "Résumé fondé sur le dossier sélectionné.", meta: { revision: body.expectedRevision, patientId: body.patientId } });
  };
  await act(async () => view.instances.at(-1).emit("bonjour assist, résume le dossier de Fatima Ben Ali")); await view.tick(1500);
  // Allow the serialized workspace synchronization and its WebCrypto revision to complete.
  await act(async () => { await new Promise((resolve) => setImmediate(resolve)); });
  assert.equal(calls[0]?.url, "/api/workspace/state");
  const ai = calls.find((call) => call.url === "/api/ia");
  assert.ok(ai);
  assert.equal(ai.body.patientId, patient.id);
  assert.match(ai.body.expectedRevision, /^[a-f0-9]{64}$/);
  assert.equal(ai.body.mode, "question");
  assert.match(view.spoken.at(-1).text, /dossier sélectionné/);
});

test("workspace data from another logged-in doctor is never read by the current assistant", async (t) => {
  const view = await mount(t); await view.tick(500);
  useAssistantDataStatus.setState({ doctorId: "another-doctor", clinical: "ready" });
  await act(async () => useRdvStore.setState({ list: [{ id: "old", patient: "Secret autre compte", date: "2026-01-01", heure: "14:00", duree: 30, statut: "confirme" }] }));
  await act(async () => view.instances.at(-1).emit("bonjour assist, quels sont mes rendez-vous le 1 janvier 2026")); await view.tick(1500);
  assert.doesNotMatch(view.spoken.at(-1).text, /Secret autre compte/);
  assert.match(view.spoken.at(-1).text, /chargement/);
});

test("an interim stop cancels the spoken answer immediately without waiting for a final transcript", async (t) => {
  const view = await mount(t); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist, explique la ménopause")); await view.tick(1500);
  const utterance = view.spoken[0];
  await act(async () => view.instances.at(-1).onresult({ resultIndex: 0, results: [{ isFinal: false, 0: { transcript: "attends" } }] }));
  assert.equal(utterance.onend, null);
  assert.doesNotMatch(view.container.textContent, /Assist vous répond/);
  assert.equal(view.requests.length, 1);
});

test("a partial wake phrase acknowledges without executing an unfinished command", async (t) => {
  const view = await mount(t); await view.tick(500);
  await act(async () => view.instances.at(-1).onresult({ resultIndex: 0, results: [{ isFinal: false, 0: { transcript: "bonjour assistant" } }] }));
  assert.match(view.container.textContent, /vous écoute/);
  assert.deepEqual(navigation.pushed, []); assert.equal(view.requests.length, 0);
});

test("configured realtime audio delegates to real Hawae requests without using browser TTS", async (t) => {
  const view = await mount(t, { realtime: true }); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist, explique la ménopause")); await view.tick(1500);
  assert.equal(view.rtc.peers.length, 1);
  assert.equal(view.requests.length, 0); // The realtime model interprets the first utterance.
  const channel = view.rtc.peers[0].channel;
  assert.ok(channel.messages.some((event) => event.item?.content?.[0]?.text === "explique la ménopause"));
  await act(async () => channel.emit({ type: "response.function_call_arguments.done", name: "hawae_request", call_id: "medical", arguments: JSON.stringify({ request: "explique la ménopause" }) }));
  assert.equal(view.requests.length, 1);
  assert.equal(view.requests[0].question, "explique la ménopause");
  assert.ok(channel.messages.some((event) => event.item?.type === "function_call_output" && event.item.call_id === "medical"));
  assert.equal(view.spoken.length, 0);
  await act(async () => {
    channel.emit({ type: "response.created", response: { id: "answer" } });
    channel.emit({ type: "output_audio_buffer.started", response_id: "answer" });
  });
  assert.match(view.container.textContent, /Audio temps réel/);
  await act(async () => channel.emit({ type: "input_audio_buffer.speech_started" }));
  assert.equal(view.rtc.audios[0].muted, true);
  assert.equal(view.rtc.audios[0].paused, true);
  await view.hide();
  assert.equal(view.rtc.tracks[0].stopped, true);
  assert.equal(view.rtc.peers[0].connectionState, "closed");
});

test("realtime can read actual cabinet data through the same isolated workspace tools", async (t) => {
  const view = await mount(t, { realtime: true }); await view.tick(500);
  await act(async () => useRdvStore.setState({ list: [{ id: "r", patient: "Fatima Réelle", date: "2026-01-01", heure: "09:00", duree: 30, statut: "confirme", type: "consultation" }] }));
  await act(async () => view.instances.at(-1).emit("bonjour assist, peux-tu regarder mon planning")); await view.tick(1500);
  const channel = view.rtc.peers[0].channel;
  await act(async () => channel.emit({ type: "response.function_call_arguments.done", name: "hawae_request", call_id: "agenda", arguments: JSON.stringify({ request: "Quels sont mes rendez-vous le 1 janvier 2026 ?" }) }));
  const result = channel.messages.find((event) => event.item?.call_id === "agenda");
  assert.ok(result); assert.match(result.item.output, /Fatima Réelle/);
  assert.equal(view.requests.length, 0); assert.equal(view.spoken.length, 0);
});

test("native tap-to-talk works without a local recognition pack and pause releases its microphone", async (t) => {
  const view = await mount(t, { realtime: true, localSupported: false }); await view.tick(500);
  await view.click("Parler à Assist");
  assert.equal(view.rtc.peers.length, 1);
  assert.equal(view.requests.length, 0);
  await view.click("Mettre Assist en pause");
  assert.equal(view.rtc.tracks[0].stopped, true);
  assert.equal(view.rtc.peers[0].connectionState, "closed");
  await view.tick(2000);
  assert.equal(view.rtc.peers.length, 1);
});

test("a native disconnect aborts pending application work and a late answer cannot fall back to speech", async (t) => {
  const view = await mount(t, { realtime: true }); await view.tick(500);
  await view.click("Parler à Assist");
  let finish, signal;
  globalThis.fetch = async (_url, init) => { signal = init.signal; return new Promise((resolve) => { finish = resolve; }); };
  const channel = view.rtc.peers[0].channel;
  await act(async () => channel.emit({ type: "response.function_call_arguments.done", name: "hawae_request", call_id: "pending", arguments: JSON.stringify({ request: "explique la ménopause" }) }));
  assert.ok(signal);
  await act(async () => channel.onclose());
  assert.equal(signal.aborted, true);
  await act(async () => finish(Response.json({ reply: "Ancienne réponse après déconnexion." })));
  assert.equal(view.spoken.length, 0);
  assert.equal(channel.messages.some((event) => event.item?.type === "function_call_output"), false);
});

test("configured OpenRouter speech takes priority, uses actual app answers and stops audio on an interim interruption", async (t) => {
  const view = await mount(t, { realtime: true, serverSpeech: true }); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist, explique la ménopause")); await view.tick(1500);
  assert.equal(view.requests.length, 1);
  assert.equal(view.rtc.peers.length, 0);
  assert.equal(view.spoken.length, 0);
  assert.equal(JSON.parse(view.audioRequests[0].body).text, "Réponse vocale synthétique.");
  assert.equal(view.audio.sources.length, 1);
  await view.tick(36); assert.match(view.container.textContent, /Assist vous répond/);
  await act(async () => view.instances.at(-1).onresult({ resultIndex: 0, results: [{ isFinal: false, 0: { transcript: "stop" } }] }));
  assert.equal(view.audio.sources[0].stopped, true);
  assert.doesNotMatch(view.container.textContent, /Assist vous répond/);
});

test("OpenRouter voices the real agenda and closes scheduled audio when the page is hidden", async (t) => {
  const view = await mount(t, { serverSpeech: true }); await view.tick(500);
  await act(async () => useRdvStore.setState({ list: [{ id: "r", patient: "Fatima Agenda", date: "2026-01-01", heure: "09:00", duree: 30, statut: "confirme" }] }));
  await act(async () => view.instances.at(-1).emit("bonjour assist, quels sont mes rendez-vous le 1 janvier 2026")); await view.tick(1500);
  assert.equal(view.requests.length, 0);
  assert.match(JSON.parse(view.audioRequests[0].body).text, /Fatima Agenda/);
  await view.hide(); assert.equal(view.audio.sources[0].stopped, true);
  await view.tick(500); assert.doesNotMatch(view.container.textContent, /Assist vous répond/);
});

test("the doctor can explicitly keep browser speech when OpenRouter speech is configured", async (t) => {
  const view = await mount(t, { serverSpeech: true, preferences: { active: true, processing: "local", serverSpeech: false } }); await view.tick(500);
  await act(async () => view.instances.at(-1).emit("bonjour assist, explique la ménopause")); await view.tick(1500);
  assert.equal(view.spoken.length, 1); assert.equal(view.audioRequests.length, 0);
});

test("OpenRouter errors stay visible after recognition resumes and do not trigger a fallback request", async (t) => {
  const view = await mount(t, { serverSpeech: true }); await view.tick(500);
  globalThis.fetch = async (url) => url === "/api/voice/speech" ? Response.json({ error: "Limite gratuite atteinte. Choisissez la voix de l’appareil." }, { status: 429 }) : Response.json({ reply: "Une réponse." });
  await act(async () => view.instances.at(-1).emit("bonjour assist, explique la ménopause")); await view.tick(1500); await view.tick(500);
  assert.match(view.container.textContent, /Limite gratuite atteinte/);
  assert.equal(view.spoken.length, 0); assert.equal(view.audio.sources.length, 0);
});

test("browser fallback speaks its first complete sentence while the HTTP response is still streaming", async (t) => {
  const view = await mount(t); await view.tick(500);
  let streamController;
  globalThis.fetch = async () => new Response(new ReadableStream({ start(controller) { streamController = controller; } }), { headers: { "Content-Type": "text/plain" } });
  await act(async () => view.instances.at(-1).emit("bonjour assist, explique la ménopause")); await view.tick(1500);
  await act(async () => streamController.enqueue(new TextEncoder().encode("Première phrase utile. La suite")));
  assert.equal(view.spoken.length, 1);
  assert.equal(view.spoken[0].text, "Première phrase utile.");
  assert.match(view.container.textContent, /Assist vous répond/);
  await act(async () => streamController.enqueue(new TextEncoder().encode(" précise le contexte.")));
  await act(async () => streamController.close());
  assert.equal(view.spoken.length, 1);
  await act(async () => view.spoken[0].onend());
  assert.equal(view.spoken.length, 2);
  assert.equal(view.spoken[1].text, "La suite précise le contexte.");
  await act(async () => view.spoken[1].onend()); await view.tick(500);
  assert.match(view.container.textContent, /À vous/);
});

test("interrupting a streamed reply cancels queued speech and prevents a late sentence from playing", async (t) => {
  const view = await mount(t); await view.tick(500);
  let streamController;
  globalThis.fetch = async () => new Response(new ReadableStream({ start(controller) { streamController = controller; } }), { headers: { "Content-Type": "text/plain" } });
  await act(async () => view.instances.at(-1).emit("bonjour assist, explique la ménopause")); await view.tick(1500);
  await act(async () => streamController.enqueue(new TextEncoder().encode("Première phrase. Seconde phrase. ")));
  assert.equal(view.spoken.length, 1);
  await act(async () => view.instances.at(-1).onresult({ resultIndex: 0, results: [{ isFinal: false, 0: { transcript: "stop" } }] }));
  assert.equal(view.spoken[0].onend, null);
  await act(async () => streamController.close()); await view.tick(2000);
  assert.equal(view.spoken.length, 1);
});

test("streamed patient answers with a mismatched revision are rejected before any clinical speech", async (t) => {
  const view = await mount(t);
  const patient = { id: "stream-patient", prenom: "Fatima", nom: "Test", specialite: "gyn" };
  await act(async () => useHawaeStore.setState({ draft: patient, currentPatientId: patient.id, patientsByUser: { "doctor-test": { [patient.id]: patient } } })); await view.tick(500);
  let cancelled = false;
  globalThis.fetch = async (url) => {
    if (url === "/api/workspace/state") return Response.json({ updatedAt: "2026-11-17T10:00:00Z" });
    return new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode("Information clinique du mauvais dossier. ")); }, cancel() { cancelled = true; } }), { headers: { "Content-Type": "text/plain", "X-Hawae-Patient-Revision": "wrong-revision" } });
  };
  await act(async () => view.instances.at(-1).emit("bonjour assist, résume le dossier")); await view.tick(1500);
  await act(async () => { await new Promise((resolve) => setImmediate(resolve)); });
  assert.equal(cancelled, true);
  assert.ok(view.spoken.length > 0);
  assert.doesNotMatch(view.spoken.map((u) => u.text).join(" "), /Information clinique du mauvais dossier/);
  assert.equal(useHawaeStore.getState().draft.hawaeIaHistory?.length ?? 0, 0);
});

test("a failed response stream cancels queued audio and cannot become conversational history", async (t) => {
  const view = await mount(t); await view.tick(500);
  let controller;
  globalThis.fetch = async () => new Response(new ReadableStream({ start(c) { controller = c; } }), { headers: { "Content-Type": "text/plain" } });
  await act(async () => view.instances.at(-1).emit("bonjour assist, explique la ménopause")); await view.tick(1500);
  await act(async () => controller.enqueue(new TextEncoder().encode("Premier fragment. Fragment à annuler. ")));
  const partial = view.spoken[0];
  await act(async () => controller.error(new Error("Connexion interrompue.")));
  assert.equal(partial.onend, null);
  assert.equal(view.spoken.some((u) => u.text === "Fragment à annuler."), false);
  let nextBody;
  globalThis.fetch = async (_url, init) => { nextBody = JSON.parse(init.body); return Response.json({ reply: "Nouvelle réponse complète." }); };
  await act(async () => view.instances.at(-1).emit("bonjour assist, nouvelle question")); await view.tick(1500);
  assert.deepEqual(nextBody.history, []);
});
