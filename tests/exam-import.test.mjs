import test from "node:test";
import assert from "node:assert/strict";
import { findExamDate, guessPanel, parseLocally, redactIdentity, validateExtraction } from "../src/lib/dossier/exam-import.ts";
import { ECHO_PANELS, MEASURES, projectLatest } from "../src/lib/dossier/examens.ts";

const patient = { id: "p", nom: "Ben Salah", prenom: "Amira", cin: "08123456", tel: "+216 98 765 432", ddn: "1991-03-07" };

const LAB = `LABORATOIRE D'ANALYSES MÉDICALES
Patiente : Mme BEN SALAH Amira   Née le 07/03/1991   CIN 08123456   Tél 98 765 432
Prélevé le 14/11/2026 à 08:10
HÉMATOLOGIE
Hémoglobine ............ 10,6 g/dl   (12 - 16)
Plaquettes ............. 245 000 /mm3
HbA1c .................. 5,4 %
BIOCHIMIE
Glycémie à jeun ........ 4,9 mmol/l
Calcium (Ca) ........... 2,31 mmol/l
SÉROLOGIES
Toxoplasmose IgG : positive  IgM : négative
Groupe sanguin : O Rhésus négatif
RAI : négative
Ag HBs : négatif`;

test("identity is masked before anything leaves the computer", () => {
  const out = redactIdentity(LAB, patient);
  for (const s of ["SALAH", "Amira", "08123456", "07/03/1991", "98 765 432"]) assert.ok(!out.includes(s), s);
  assert.match(out, /\[PATIENTE\]/);
  assert.match(out, /Prélevé le 14\/11\/2026/, "exam dates are kept");
});

test("a lab report is read locally into the right panel, with conversions flagged", () => {
  const r = parseLocally(LAB);
  assert.equal(r.kind, "bio");
  assert.equal(r.date, "2026-11-14");
  assert.equal(r.values.hb, "10.6");
  assert.equal(r.values.plq, "245");
  assert.ok(r.notes.some((n) => /Plaquettes/.test(n)), "the /mm3 conversion is shown");
  assert.equal(r.values.hba1c, "5.4");
  assert.equal(r.values.gly, "0.88");
  assert.equal(r.values.toxo, "Immune");
  assert.equal(r.values.groupe, "O-");
  assert.equal(r.values.rai, "neg");
  assert.equal(r.values.hbs, "neg");
  assert.equal(r.values.ca, undefined, "calcium is not read as abdominal circumference");
  assert.equal(r.panel, "prenatal_t1");
  assert.ok(r.notes.some((n) => /mmol/.test(n)));
});

test("an ultrasound report is classified as a growth scan", () => {
  const r = parseLocally(`Échographie obstétricale du 03/11/2026 - 31 SA
BIP : 79 mm
PC : 288 mm
CA : 270 mm
LF : 59 mm
PFE : 1 650 g
Longueur du col : 32 mm`);
  assert.equal(r.kind, "echo");
  assert.equal(r.panel, "echo_croissance");
  assert.deepEqual([r.values.bip, r.values.pc, r.values.ca, r.values.lf, r.values.pfe, r.values.col], ["79", "288", "270", "59", "1650", "32"]);
  assert.equal(r.date, "2026-11-03");
  assert.equal(projectLatest([{ id: "x", date: "2026-11-03", kind: "echo", values: r.values, origin: "import" }]).o_col, "32");
});

test("an AI answer is never trusted blindly", () => {
  const r = validateExtraction({
    panel: "hormonal",
    date: "2026-10-02",
    values: { amh: "1,8", fsh: "élevée", inconnu: "3", toxo: "positif", e2: 45 },
    notes: ["Inhibine B non reconnue"],
  });
  assert.equal(r.panel, "hormonal");
  assert.deepEqual(r.values, { amh: "1.8", e2: "45" });
  assert.ok(r.notes.some((n) => /FSH/.test(n)));
  assert.ok(r.notes.some((n) => /Toxoplasmose/.test(n)));
  assert.equal(validateExtraction({ date: "02/10/2026", values: {} }).date, null);
});

test("panels and measures stay consistent", () => {
  for (const p of ECHO_PANELS) for (const id of p.analytes) assert.ok(MEASURES[id], `${p.id}:${id}`);
  assert.equal(guessPanel({ cfa_d: "8", cfa_g: "7", cfa: "15" }).panel, "echo_infertilite");
  assert.equal(findExamDate("Résultat édité le 3/9/26"), "2026-09-03");
});
