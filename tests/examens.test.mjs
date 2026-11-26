import test from "node:test";
import assert from "node:assert/strict";
import { ANALYTES, BIO_PANELS, deleteExam, examSummary, projectLatest, saveExam, termeAt } from "../src/lib/dossier/examens.ts";

const exam = (id, date, values, panel = "nfs") => ({ id, date, kind: "bio", panel, values, origin: "saisie" });

test("every panel analyte exists and writes to at least one dossier field", () => {
  for (const p of BIO_PANELS) for (const a of p.analytes) assert.ok(ANALYTES[a]?.targets.length, `${p.id}:${a}`);
});

test("the most recent dated value wins, for every duplicate field", () => {
  const patch = projectLatest([exam("a", "2026-09-01", { hb: "12.1", gly: "0.85" }), exam("b", "2026-11-02", { hb: "10.4" })]);
  assert.equal(patch.bio_hb, "10.4");
  assert.equal(patch.o_hb, "10.4", "the anamnesis copy is no longer stale");
  assert.equal(patch.o_gly, "0.85", "an analyte measured only earlier keeps its own latest value");
  assert.equal(patch.bio_amh, undefined, "an analyte never measured does not touch its field");
});

test("saving keeps earlier exams, records the date and logs socle changes", () => {
  const d = { id: "p", o_grp: "", examens: [exam("a", "2026-09-01", { hb: "12.1" })] };
  const patch = saveExam(d, exam("b", "2026-11-02", { groupe: "O-", rai: "neg", hb: "" }, "prenatal_t1"), new Date("2026-11-26T09:00:00Z"));
  assert.equal(patch.examens.length, 2);
  assert.deepEqual(patch.examens.find((e) => e.id === "b").values, { groupe: "O-", rai: "neg" }, "empty values are not stored");
  assert.equal(patch.o_grp, "O-");
  assert.equal(patch.o_hb, "12.1");
  assert.match(patch.socleLog[0].text, /Groupe sanguin : O-/);
});

test("deleting a mistaken exam does not leave its value behind, but keeps pre-existing data", () => {
  const d = { id: "p", bio_hb: "1.18", o_hb: "1.18", bio_amh: "2.1", examens: [exam("x", "2026-11-02", { hb: "1.18" })] };
  const patch = deleteExam(d, "x");
  assert.equal(patch.examens.length, 0);
  assert.equal(patch.bio_hb, "");
  assert.equal(patch.o_hb, "");
  assert.equal(patch.bio_amh, undefined);
  const older = deleteExam({ ...d, examens: [...d.examens, exam("y", "2026-10-01", { hb: "11.9" })] }, "x");
  assert.equal(older.o_hb, "11.9", "the previous exam becomes the latest again");
});

test("term at the exam date and readable summary", () => {
  assert.equal(termeAt("2026-05-10", "2026-08-02"), "12 SA + 0 j");
  assert.equal(termeAt("", "2026-08-02"), "");
  assert.equal(termeAt("2026-05-10", "2026-04-01"), "");
  assert.equal(examSummary(exam("a", "2026-08-02", { rai: "neg", hb: "11.2" }, "prenatal_t1")), "RAI Négatif · Hémoglobine 11.2 g/dL");
});
