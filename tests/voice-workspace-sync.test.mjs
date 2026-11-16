import test from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { WorkspaceSync } from "../src/components/providers/workspace-sync.tsx";
import { ClinicalDataSync } from "../src/components/providers/clinical-data-sync.tsx";
import { useHawaeStore } from "../src/stores/hawae-store.ts";
import { useRdvStore } from "../src/stores/rdv-store.ts";
import { useAssistantDataStatus } from "../src/stores/assistant-data-status.ts";
import { EMPTY_CLINICAL_BUNDLE } from "../src/types/clinical-bundle.ts";

async function mount(t, fetcher) {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const window = new Window({ url: "http://localhost:3000" }); window.__HAWAE_DOCTOR_ID__ = "doctorA";
  globalThis.window = window; globalThis.document = window.document; globalThis.localStorage = window.localStorage; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const oldFetch = globalThis.fetch; globalThis.fetch = fetcher;
  useAssistantDataStatus.setState({ doctorId: "doctorA", patients: "loading", clinical: "loading" });
  useHawaeStore.setState({ patientsByUser: {}, historyByUser: {}, workspaceSavedAt: null }); useRdvStore.setState({ list: [], weekOffset: 0 });
  const root = createRoot(window.document.body.appendChild(window.document.createElement("div")));
  await act(async () => root.render(React.createElement(React.Fragment, null, React.createElement(WorkspaceSync), React.createElement(ClinicalDataSync))));
  t.after(async () => { await act(async () => root.unmount()); globalThis.fetch = oldFetch; await window.happyDOM.close(); delete globalThis.window; delete globalThis.document; delete globalThis.localStorage; delete globalThis.IS_REACT_ACT_ENVIRONMENT; });
  return { window, rerenderDoctor: async (doctorId) => act(async () => root.render(React.createElement(React.Fragment, null, React.createElement(WorkspaceSync, { doctorId }), React.createElement(ClinicalDataSync, { doctorId })))), tick: async (ms) => act(async () => t.mock.timers.tick(ms)) };
}

test("loaded cabinet sources are marked ready and agenda writes cannot overtake each other", async (t) => {
  const writes = []; let resolveFirst;
  const view = await mount(t, async (url, init = {}) => {
    if (url === "/api/workspace/state") return Response.json(init.method === "PUT" ? { updatedAt: "2026-11-17T10:00:00Z" } : { empty: true });
    if (init.method !== "PUT") return Response.json({ empty: false, bundle: EMPTY_CLINICAL_BUNDLE });
    writes.push(JSON.parse(init.body));
    if (writes.length === 1) return new Promise((resolve) => { resolveFirst = resolve; });
    return Response.json({ updatedAt: "2026-11-17T10:01:00Z" });
  });
  assert.equal(useAssistantDataStatus.getState().patients, "ready");
  assert.equal(useAssistantDataStatus.getState().clinical, "ready");
  await act(async () => useRdvStore.setState({ list: [{ id: "old" }] })); await view.tick(2600);
  assert.equal(writes.length, 1);
  await act(async () => useRdvStore.setState({ list: [{ id: "new" }] })); await view.tick(2600);
  assert.equal(writes.length, 1);
  await act(async () => resolveFirst(Response.json({ updatedAt: "2026-11-17T10:00:00Z" })));
  await view.tick(2600);
  assert.equal(writes.length, 2);
  assert.equal(writes[0].bundle.agenda.rdvList[0].id, "old");
  assert.equal(writes[1].bundle.agenda.rdvList[0].id, "new");
});

test("failed source loading is reported as an error rather than an empty ready workspace", async (t) => {
  await mount(t, async () => Response.json({ error: "unavailable" }, { status: 503 }));
  assert.equal(useAssistantDataStatus.getState().patients, "error");
  assert.equal(useAssistantDataStatus.getState().clinical, "error");
});

test("a late response body from a previous account cannot replace the new account's data", async (t) => {
  const finish = [];
  const view = await mount(t, async () => ({ ok: true, json: () => new Promise((resolve) => finish.push(resolve)) }));
  view.window.__HAWAE_DOCTOR_ID__ = "doctorB";
  useAssistantDataStatus.setState({ doctorId: "doctorB", patients: "loading", clinical: "loading" });
  await act(async () => {
    for (const resolve of finish) resolve({ empty: false, updatedAt: "2026-11-17T10:00:00Z", workspace: { users: [], patientsByUser: { old: { secret: { id: "secret" } } }, historyByUser: {} }, bundle: { ...EMPTY_CLINICAL_BUNDLE, agenda: { rdvList: [{ id: "secret-old-agenda" }] } } });
  });
  assert.deepEqual(useHawaeStore.getState().patientsByUser, {});
  assert.deepEqual(useRdvStore.getState().list, []);
  assert.equal(useAssistantDataStatus.getState().doctorId, "doctorB");
  assert.equal(useAssistantDataStatus.getState().clinical, "loading");
});

test("synchronization restarts for a new doctor even if the layout remains mounted", async (t) => {
  let reads = 0;
  const view = await mount(t, async (url, init = {}) => {
    if (init.method === "PUT") return Response.json({ updatedAt: "2026-11-17T10:00:00Z" });
    reads++;
    return Response.json(url === "/api/workspace/state" ? { empty: true } : { empty: false, bundle: EMPTY_CLINICAL_BUNDLE });
  });
  assert.equal(reads, 2);
  view.window.__HAWAE_DOCTOR_ID__ = "doctorB";
  useAssistantDataStatus.setState({ doctorId: "doctorB", patients: "loading", clinical: "loading" });
  await view.rerenderDoctor("doctorB");
  assert.equal(reads, 4);
  assert.equal(useAssistantDataStatus.getState().patients, "ready");
  assert.equal(useAssistantDataStatus.getState().clinical, "ready");
});
