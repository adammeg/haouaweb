import test from "node:test";
import assert from "node:assert/strict";

let settings = { enabled: false, consentedAt: null, consentVersion: null, learningEpoch: null };
const archive = [];
let writes = 0;
let afterWrite;
const matches = (row, filter) => Object.entries(filter).every(([key, value]) => row[key] === value);
globalThis._hawaeMongoClient = { db: () => ({ collection: (name) => ({
  createIndex: async () => "index",
  findOne: async (filter) => name === "doctor_settings" ? { doctorId: filter.doctorId, aiTraining: settings } : archive.find((r) => matches(r, filter)) ?? null,
  updateOne: async (_filter, update) => { writes++; archive.push(update.$set); afterWrite?.(); return { matchedCount: 1 }; },
  deleteMany: async (filter) => { const matchesRows = archive.filter((r) => matches(r, filter)); for (const row of matchesRows) archive.splice(archive.indexOf(row), 1); return { deletedCount: matchesRows.length }; },
}) }) };
const { upsertFullTrainingRecord } = await import("../src/lib/db/full-training-repository.ts");
const input = { doctorId: "doctorA", patientId: "synthetic-patient", workspaceUserId: "user", record: { patient: { id: "synthetic-patient", specialite: "obst" }, consultationHistory: [], ivf: null, modulesForPatient: {} }, contentHash: "synthetic-hash", consentVersion: "version", consentToken: "epoch1", sourceUpdatedAt: "2026-11-03T00:00:00Z" };

test("the legacy full-record archive also respects disabled and renewed consent", async () => {
  assert.equal(await upsertFullTrainingRecord(input), "unchanged");
  assert.equal(writes, 0);
  settings = { enabled: true, consentedAt: "now", consentVersion: "version", learningEpoch: "epoch2" };
  assert.equal(await upsertFullTrainingRecord(input), "unchanged");
  assert.equal(writes, 0);
});

test("a legacy archive write finishing after withdrawal is removed within its original consent epoch", async () => {
  settings = { enabled: true, consentedAt: "now", consentVersion: "version", learningEpoch: "epoch1" };
  afterWrite = () => { settings = { ...settings, enabled: false }; };
  assert.equal(await upsertFullTrainingRecord(input), "unchanged");
  assert.equal(writes, 1);
  assert.equal(archive.length, 0);
});
