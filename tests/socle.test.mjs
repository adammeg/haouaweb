import test from "node:test";
import assert from "node:assert/strict";
import {
  SOCLE_KEYS,
  applySocleEvent,
  planSocleMigration,
  sectionSummary,
  SOCLE_SECTIONS,
  socleValue,
  suggestGpa,
} from "../src/lib/dossier/socle.ts";
import { emptyConsultFields, extractIdentitySnapshot } from "../src/lib/patient-utils.ts";

const section = (id) => SOCLE_SECTIONS.find((s) => s.id === id);

test("a single legacy source is taken over; identical values in different spellings are not a conflict", () => {
  const { patch, conflicts } = planSocleMigration({
    id: "p", i_menarche: "12", i_dysp: "oui", g_gest: "2", i_gest: "2", o_grp: "A+", bio_groupe: "a rh +", bio_toxo: "Immune (IgG+)",
  });
  assert.deepEqual(conflicts, []);
  assert.equal(patch.g_menarche, "12");
  assert.equal(patch.g_dysp, "prof");
  assert.equal(patch.o_gest, "2");
  assert.equal(patch.o_toxo, "Immune");
  assert.equal(patch.o_grp, undefined, "the existing canonical value is kept");
});

test("contradictory sources are never resolved automatically", () => {
  const { patch, conflicts } = planSocleMigration({ id: "p", o_grp: "A+", bio_groupe: "A-", g_cycle: "28", i_cycle: "35" });
  assert.equal(patch.o_grp, undefined);
  assert.deepEqual(conflicts.map((c) => c.key).sort(), ["g_cycle", "o_grp"]);
  const grp = conflicts.find((c) => c.key === "o_grp");
  assert.deepEqual(grp.values.map((v) => v.value), ["A+", "A-"]);
  assert.ok(grp.values.every((v) => v.source));
});

test("a migrated dossier ignores legacy fields", () => {
  assert.deepEqual(planSocleMigration({ id: "p", socleMigrated: "1", i_cycle: "35" }).patch, {});
  assert.equal(socleValue({ id: "p", socleMigrated: "1", i_cycle: "35" }, "g_cycle"), "");
  assert.equal(socleValue({ id: "p", i_cycle: "35" }, "g_cycle"), "35");
});

test("a new consultation keeps the whole socle and clears only the visit", () => {
  const draft = { id: "p", g_menarche: "12", g_cycle: "28", g_contra: "Implant", o_toxo: "Immune", ec_taille: "165", fam_sein_ovaire: "oui", motif: "x", socleMigrated: "1" };
  const next = { ...extractIdentitySnapshot(draft), ...emptyConsultFields() };
  for (const k of ["g_menarche", "g_cycle", "g_contra", "o_toxo", "ec_taille", "fam_sein_ovaire", "socleMigrated"]) {
    assert.equal(next[k], draft[k], k);
  }
  assert.equal(next.motif, "");
  for (const k of SOCLE_KEYS) assert.ok(!(k in emptyConsultFields()), `${k} must never be cleared`);
});

test("summaries show positive information only", () => {
  const d = { id: "p", hta: "traite", diabete: "non", allergies: "Pénicilline", tabac: "non", o_gest: "3", o_par: "2", o_abort: "1", o_ncs: "1" };
  assert.equal(sectionSummary(section("medical"), d), "HTA : Traitée · Allergies : Pénicilline");
  assert.equal(sectionSummary(section("obstetrique"), d), "G3P2 A1 · Césariennes : 1");
  assert.equal(sectionSummary(section("famille"), d), "");
});

test("a caesarean delivery updates G/P/A, caesareans, indication and the dated log", () => {
  const d = { id: "p", o_gest: "2", o_par: "1", o_abort: "0", o_ddr: "2026-03-01", o_ncs: "0" };
  assert.deepEqual(suggestGpa(d, "accouchement"), { g: "2", p: "2", a: "0" }, "the current pregnancy is already counted");
  const patch = applySocleEvent(d, "accouchement", { date: "2026-11-20", terme: "39", voie: "césarienne", indication: "SFA" }, new Date("2026-11-26T10:00:00Z"));
  assert.equal(patch.o_par, "2");
  assert.equal(patch.o_ncs, "1");
  assert.equal(patch.o_indcs, "SFA");
  assert.match(patch.o_atcd_gross, /^2026 : Accouchement, 39 SA, césarienne, indication : SFA$/);
  assert.equal(patch.socleLog[0].date, "2026-11-26T10:00:00.000Z");
  assert.match(patch.socleLog[0].text, /^Accouchement, 20\/11\/2026/);
});

test("a miscarriage outside a followed pregnancy adds one pregnancy and one loss; the doctor's correction wins", () => {
  const d = { id: "p", o_gest: "1", o_par: "1", o_abort: "0" };
  assert.deepEqual(suggestGpa(d, "fausse_couche"), { g: "2", p: "1", a: "1" });
  const patch = applySocleEvent(d, "fausse_couche", { g: "3", p: "1", a: "2" });
  assert.deepEqual([patch.o_gest, patch.o_par, patch.o_abort], ["3", "1", "2"]);
});

test("allergy and surgery events append without erasing", () => {
  const d = { id: "p", allergies: "Latex", chir: "2019 : appendicectomie" };
  assert.equal(applySocleEvent(d, "allergie", { text: "Pénicilline" }).allergies, "Latex ; Pénicilline");
  assert.equal(applySocleEvent(d, "chirurgie", { date: "2024-05-02", text: "Myomectomie" }).chir, "2019 : appendicectomie\n2024 : Myomectomie");
});

test("a disputed value is never shown as if it were settled", () => {
  const d = { id: "p", o_grp: "A+", bio_groupe: "A-", o_gest: "2", g_gest: "3" };
  const disputed = new Set(planSocleMigration(d).conflicts.map((c) => c.key));
  assert.equal(sectionSummary(section("immunite"), d, disputed), "Groupe : à vérifier");
  assert.equal(sectionSummary(section("obstetrique"), d, disputed), "G/P/A : à vérifier");
});
