import test from "node:test";
import assert from "node:assert/strict";
import { appointmentDate, appointmentTime, calendarReply, fieldReply, findPatients, parisDate, remindersReply, waitingReply, workspaceIntent } from "../src/lib/voice/workspace-tools.ts";
import { markAssistantData, useAssistantDataStatus } from "../src/stores/assistant-data-status.ts";

const now = new Date("2026-11-17T10:00:00Z");
const patient = { id: "a", nom: "Ben Ali", prenom: "Fatima", specialite: "gyn", allergies: "Non renseignées", traitements: "Traitement enregistré" };
const appointment = (id, name, date, heure, statut = "confirme") => ({ id, patient: name, date, heure, statut, duree: 30, type: "consultation", notes: "", tel: "", createdAt: now.toISOString() });

test("workspace queries distinguish patients, appointments and direct dossier fields", () => {
  assert.deepEqual(workspaceIntent("ouvre le dossier de Madame Fatima Ben Ali"), { type: "patients", query: "fatima ben ali", action: "open" });
  assert.deepEqual(workspaceIntent("résume le dossier de Fatima"), { type: "patients", query: "fatima", action: "summary" });
  assert.deepEqual(workspaceIntent("Quels sont mes rendez-vous demain ?"), { type: "calendar", period: "demain", next: false, query: "" });
  assert.equal(workspaceIntent("Quel est mon prochain rendez-vous ?").next, true);
  assert.equal(workspaceIntent("Quels sont les rendez-vous de demain ?").query, "");
  assert.equal(workspaceIntent("Les rendez-vous de ma patiente actuelle").query, "@active");
  assert.equal(workspaceIntent("Quels sont ses traitements ?").field, "traitements");
  assert.equal(workspaceIntent("qui est ma patiente").field, "identity");
  assert.equal(workspaceIntent("Quels sont mes rendez-vous le 24 novembre ?").period, "le 24 novembre");
  assert.equal(workspaceIntent("annule le rendez-vous de Fatima"), null);
  assert.equal(workspaceIntent("ne prends pas un rendez-vous pour Fatima demain à 14 heures"), null);
  assert.equal(workspaceIntent("Quels sont mes rendez-vous ce mois-ci ?").period, "");
});

test("patient matching respects full identity tokens and keeps ambiguous results separate", () => {
  const patients = { first: { a: patient }, second: { b: { ...patient, id: "b", prenom: "Fatima", nom: "Bennani" } } };
  assert.equal(findPatients(patients, "Fatima").length, 2);
  assert.equal(findPatients(patients, "Fatima Ben Ali")[0].userId, "first");
  assert.equal(findPatients(patients, "Ali").length, 1);
  assert.equal(findPatients(patients, "Al").length, 0);
  assert.equal(findPatients(patients, "introuvable").length, 0);
});

test("French dates and times are validated and relative dates use Paris time", () => {
  assert.equal(parisDate(new Date("2026-11-17T23:30:00Z")), "2026-11-18");
  assert.equal(appointmentDate("demain", now), "2026-11-18");
  assert.equal(appointmentDate("après demain", now), "2026-11-19");
  assert.equal(appointmentDate("le 24 novembre", now), "2026-11-24");
  assert.equal(appointmentDate("le 31/02/2026", now), null);
  assert.equal(appointmentDate("2026-12-01", now), "2026-12-01");
  assert.equal(appointmentDate("mardi prochain", now), "2026-11-24");
  assert.equal(appointmentTime("14 heures 30"), "14:30");
  assert.equal(appointmentTime("14h30"), "14:30");
  assert.equal(appointmentTime("14 30"), "14:30");
  assert.equal(appointmentTime("25h00"), null);
  assert.equal(appointmentTime("14h70"), null);
});

test("calendar reads actual non-cancelled appointments with dates, names and explicit scope", () => {
  const list = [appointment("a", "Fatima Ben Ali", "2026-11-17", "09:00"), appointment("b", "Salma Test", "2026-11-17", "14:00"), appointment("c", "Annulée", "2026-11-17", "12:00", "annule"), appointment("d", "Demain", "2026-11-18", "09:00")];
  assert.match(calendarReply(list, { type: "calendar", period: "aujourd hui", next: true, query: "" }, now), /Salma Test/);
  const today = calendarReply(list, { type: "calendar", period: "aujourd hui", next: false, query: "" }, now);
  assert.match(today, /2 rendez-vous/); assert.doesNotMatch(today, /Annulée|Demain/);
  assert.match(calendarReply(list, { type: "calendar", period: "demain", next: false, query: "" }, now), /Demain/);
  assert.doesNotMatch(calendarReply(list, { type: "calendar", period: "aujourd hui", next: false, query: "Fatima Ben Ali" }, now), /Salma Test/);
  assert.match(calendarReply(list, { type: "calendar", period: "mauvaise date", next: false, query: "" }, now), /Précisez/);
});

test("calendar follow-ups preserve the filter without requiring the word rendez-vous again", () => {
  const first = workspaceIntent("Quels sont les rendez-vous de Fatima ?");
  assert.deepEqual(workspaceIntent("et demain", first), { type: "calendar", period: "demain", next: false, query: "fatima" });
  assert.equal(workspaceIntent("et demain"), null);
});

test("appointment creation extracts only a proposal, preserving required patient, date and time", () => {
  assert.deepEqual(workspaceIntent("Prends un rendez-vous pour Fatima Ben Ali demain à 14 heures 30"), { type: "appointment", query: "fatima ben ali", dateText: "demain", timeText: "14 heures 30" });
  assert.deepEqual(workspaceIntent("Prends un rendez-vous pour la patiente actuelle demain à 14:30"), { type: "appointment", query: "la patiente actuelle", dateText: "demain", timeText: "14 30" });
  assert.equal(workspaceIntent("prends un rendez-vous").dateText, "");
});

test("dossier reads retain unknown values and source names rather than claiming no access", () => {
  assert.match(fieldReply(patient, "identity"), /Fatima Ben Ali/);
  assert.match(fieldReply(patient, "traitements"), /Traitement enregistré/);
  assert.match(fieldReply(patient, "atcdMed"), /non renseigné/);
  assert.match(fieldReply(null, "allergies"), /Aucun dossier ouvert/);
  assert.match(waitingReply([{ id: "w", patientId: "a", date: "2026-11-17", arrivalTime: "09:00", status: "waiting" }], { a: patient }, now), /Fatima Ben Ali/);
  assert.match(remindersReply([{ id: "r", patient: "Fatima", desc: "Contrôle", date: "2026-11-17", done: false }]), /Contrôle/);
});

test("late synchronization from another doctor cannot mark the current doctor's data ready", () => {
  useAssistantDataStatus.setState({ doctorId: "doctorB", patients: "loading", clinical: "loading" });
  markAssistantData("doctorA", "clinical", "ready");
  assert.equal(useAssistantDataStatus.getState().clinical, "loading");
  markAssistantData("doctorB", "clinical", "ready");
  assert.equal(useAssistantDataStatus.getState().clinical, "ready");
});
