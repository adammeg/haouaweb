import test from "node:test";
import assert from "node:assert/strict";
import { BrowserSpeechStream, VoiceSentenceBuffer } from "../src/lib/voice/speech-stream.ts";
import { shouldInterruptPlayback } from "../src/lib/voice/interruption.ts";

test("sentences can start before generation completes without splitting clinical decimals", () => {
  const buffer = new VoiceSentenceBuffer();
  assert.deepEqual(buffer.push("La valeur est de 0."), []);
  assert.deepEqual(buffer.push("5 ng/mL. Il faut"), ["La valeur est de 0.5 ng/mL."]);
  assert.deepEqual(buffer.push(" préciser le contexte. "), ["Il faut préciser le contexte."]);
  assert.equal(buffer.flush(), "");
});

test("speech is ordered and finishing generation cannot end the conversation before queued audio", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const spoken = [], callbacks = []; const synthesis = { speak: (u) => { spoken.push(u); u.onstart(); }, cancel: () => {} };
  const queue = new BrowserSpeechStream(synthesis, (text) => ({ text }), { start: (s) => callbacks.push(s), waiting: () => {}, done: () => callbacks.push("done"), error: () => callbacks.push("error") });
  queue.append("Première phrase."); queue.append("Deuxième phrase."); queue.finish();
  assert.equal(spoken.length, 1); assert.deepEqual(callbacks, ["Première phrase."]);
  spoken[0].onend(); assert.equal(spoken.length, 2);
  assert.deepEqual(callbacks, ["Première phrase.", "Deuxième phrase."]);
  spoken[1].onend(); assert.equal(callbacks.at(-1), "done");
});

test("interrupting speech drops all queued sentences and invalidates late playback callbacks", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const spoken = []; let done = 0, cancellations = 0;
  const queue = new BrowserSpeechStream({ speak: (u) => spoken.push(u), cancel: () => cancellations++ }, (text) => ({ text }), { start: () => {}, waiting: () => {}, done: () => done++, error: () => {} });
  queue.append("Ancienne première phrase."); queue.append("Ancienne seconde phrase.");
  const stale = spoken[0].onend;
  queue.cancel(); stale(); queue.append("ne doit pas être lue"); queue.finish();
  assert.equal(spoken.length, 1); assert.equal(cancellations, 1); assert.equal(done, 0);
});

test("browser interruption ignores matching speaker echo but accepts interim stop and new speech", () => {
  assert.equal(shouldInterruptPlayback("pas de fièvre", "Le dossier indique pas de fièvre."), false);
  assert.equal(shouldInterruptPlayback("attends", "Le dossier indique pas de fièvre."), true);
  assert.equal(shouldInterruptPlayback("je veux changer de sujet", "Le dossier indique pas de fièvre."), true);
});
