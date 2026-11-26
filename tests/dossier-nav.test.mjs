import test from "node:test";
import assert from "node:assert/strict";
import { dossierStages, knownAllergies } from "../src/lib/dossier/dossier-nav.ts";

test("every dossier section stays reachable exactly once and PMA only for infertility", () => {
  const ids = (spec) => dossierStages(spec).flatMap((s) => s.tabs.map((t) => t.id));
  assert.equal(new Set(ids("inf")).size, 13);
  assert.equal(ids("inf").length, 13);
  assert.ok(!ids("gyn").includes("pma"));
});

test("archived allergies remain visible, dated, when the current field is empty", () => {
  const history = [
    { id: "a", date: "2026-01-01", data: { allergies: "Latex" } },
    { id: "b", date: "2026-05-01", data: { allergies: "Pénicilline" } },
    { id: "c", date: "2026-06-01", data: { allergies: " " } },
  ];
  assert.deepEqual(knownAllergies({ allergies: "" }, history), { text: "Pénicilline", from: "2026-05-01" });
  assert.deepEqual(knownAllergies({ allergies: "Iode" }, history), { text: "Iode", from: null });
  assert.equal(knownAllergies({}, []), null);
});

test("a new consultation keeps allergies, archives the previous one and clears the motif", async () => {
  const { useHawaeStore } = await import("../src/stores/hawae-store.ts");
  const draft = { id: "p1", nom: "Test", prenom: "Fictif", specialite: "gyn", motif: "Contrôle", allergies: "Pénicilline" };
  useHawaeStore.setState({
    currentUserId: "u1",
    currentPatientId: "p1",
    draft,
    patientsByUser: { u1: { p1: draft } },
    historyByUser: {},
  });
  useHawaeStore.getState().startNewConsultation();
  const s = useHawaeStore.getState();
  assert.equal(s.draft.allergies, "Pénicilline");
  assert.equal(s.draft.motif, "");
  assert.equal(s.historyByUser.u1.p1[0].data.allergies, "Pénicilline");
  s.startNewConsultation();
  assert.equal(useHawaeStore.getState().draft.allergies, "Pénicilline");
});

test("reopening an old consultation keeps current allergies and falls back to the archive when empty", async () => {
  const { useHawaeStore } = await import("../src/stores/hawae-store.ts");
  const load = (draft) => {
    useHawaeStore.setState({
      currentUserId: "u1",
      currentPatientId: "p1",
      draft,
      historyByUser: { u1: { p1: [{ id: "c1", date: "2026-01-01", data: { id: "p1", motif: "Ancien", allergies: "Latex" } }] } },
    });
    useHawaeStore.getState().loadConsultation("c1");
    return useHawaeStore.getState();
  };
  const s = load({ id: "p1", motif: "Actuel", allergies: "Latex, pénicilline" });
  assert.equal(s.draft.motif, "Ancien");
  assert.equal(s.draft.allergies, "Latex, pénicilline");
  assert.equal(s.historyByUser.u1.p1[0].data.allergies, "Latex", "the archive is unchanged");
  assert.equal(load({ id: "p1", allergies: " " }).draft.allergies, "Latex");
  assert.equal(load({ id: "p2", allergies: "Iode" }).draft.allergies, "Latex", "never another patient's");
});
