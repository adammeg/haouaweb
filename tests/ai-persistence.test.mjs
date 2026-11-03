import test from "node:test";
import assert from "node:assert/strict";
import { useHawaeStore } from "../src/stores/hawae-store.ts";
import { pushWorkspaceNow } from "../src/lib/storage/workspace-sync-client.ts";
import { preparePatientAiRequest, isCurrentAiRequest } from "../src/lib/ia/patient-request-client.ts";
import { stableClinicalDataKey } from "../src/lib/ia/clinical-revision.ts";

const a = { id: "synthetic-a", specialite: "obst" };
const b = { id: "synthetic-b", specialite: "gyn" };
function reset() {
  useHawaeStore.setState({ currentUserId: "user", currentPatientId: a.id, draft: a, patientsByUser: { user: { [a.id]: a, [b.id]: b } } });
}
test("AI preparation awaits server acknowledgement and then verifies the captured patient/revision", async () => {
  reset();
  let acknowledge;
  let started;
  const ready = new Promise((r) => { started = r; });
  globalThis.fetch = async () => { started(); return new Promise((r) => { acknowledge = () => r(Response.json({ updatedAt: "2026-11-03T00:00:00Z" })); }); };
  let completed = false;
  const request = preparePatientAiRequest(a.id, new AbortController().signal).then((value) => { completed = true; return value; });
  await ready;
  assert.equal(completed, false);
  acknowledge();
  const value = await request;
  assert.match(value.expectedRevision, /^[a-f0-9]{64}$/);
  assert.equal(value.key, stableClinicalDataKey(a));
});

test("patient switches and edits during synchronization invalidate the AI request", async () => {
  for (const change of [() => useHawaeStore.setState({ draft: b, currentPatientId: b.id }), () => useHawaeStore.getState().patchDraft({ o_ta: "160/100" })]) {
    reset();
    globalThis.fetch = async () => { change(); return Response.json({ updatedAt: "2026-11-03T00:00:00Z" }); };
    await assert.rejects(() => preparePatientAiRequest(a.id, new AbortController().signal), /chang/);
    assert.equal(isCurrentAiRequest(a.id, stableClinicalDataKey(a)), false);
  }
});

test("a failed save blocks inference and does not poison subsequent save attempts", async () => {
  reset();
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  await assert.rejects(() => preparePatientAiRequest(a.id, new AbortController().signal), /Sauvegarde/);
  globalThis.fetch = async () => Response.json({ updatedAt: "2026-11-03T00:00:00Z" });
  assert.ok(await preparePatientAiRequest(a.id, new AbortController().signal));
});

test("background and explicit workspace saves are serialized in dispatch order", async () => {
  reset();
  let release;
  let started;
  const ready = new Promise((r) => { started = r; });
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    if (calls === 1) { started(); await new Promise((r) => { release = r; }); }
    return Response.json({ updatedAt: `2026-11-03T00:00:0${calls}Z` });
  };
  const first = pushWorkspaceNow();
  await ready;
  const second = pushWorkspaceNow();
  await Promise.resolve();
  assert.equal(calls, 1);
  release();
  await Promise.all([first, second]);
  assert.equal(calls, 2);
});
