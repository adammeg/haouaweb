import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { Window } from "happy-dom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { navigation } from "./fixtures/voice-navigation.mjs";
import { VOICE_SESSION_END_EVENT } from "../src/lib/voice/preferences.ts";

registerHooks({ resolve(specifier, context, next) {
  return next(specifier === "next/navigation" ? new URL("./fixtures/voice-navigation.mjs", import.meta.url).href : specifier, context);
} });
const { VoiceAssistant } = await import("../src/components/voice/voice-assistant.tsx");
const { useHawaeStore } = await import("../src/stores/hawae-store.ts");

async function mount(t, { access = "enabled", preferences, localSupported = true } = {}) {
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
  class Utterance { constructor(text) { this.text = text; } }
  window.SpeechRecognition = Recognition;
  window.speechSynthesis = { getVoices: () => [], speak: (utterance) => spoken.push(utterance), cancel: () => {} };
  globalThis.window = window; globalThis.document = window.document; globalThis.localStorage = window.localStorage;
  globalThis.SpeechSynthesisUtterance = Utterance; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    requests.push(JSON.parse(init.body));
    return Response.json({ reply: "Réponse vocale synthétique." });
  };
  if (preferences) window.localStorage.setItem("hawae:voice:doctor-test", JSON.stringify(preferences));
  useHawaeStore.setState({ draft: null, currentPatientId: null, currentUserId: "doctor-test" });
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
  });
  return { container, instances, spoken, requests, tick, click, window,
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
  assert.match(view.container.textContent, /Dites « bonjour assist »/);
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
