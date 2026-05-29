import type { PatientSnapshot } from "@/types/domain";
import type { WaitingEntry } from "@/types/modules";
import {
  currentTimeHm,
  findPatientByIdentity,
  specialtyFromMotif,
  todayIso,
} from "@/lib/waiting-room/utils";

export type RegisterArrivalInput = {
  nom: string;
  prenom: string;
  tel?: string;
  motif: string;
  arrivalTime?: string;
  ddn?: string;
};

export type RegisterArrivalDeps = {
  patientsMap: Record<string, PatientSnapshot>;
  queueToday: WaitingEntry[];
  createPatientFromForm: (
    fields: Partial<PatientSnapshot> & { nom: string; prenom: string },
  ) => string;
  addWaiting: (entry: Omit<WaitingEntry, "id">) => string;
};

export type RegisterArrivalResult =
  | { ok: true; patientId: string; created: boolean }
  | { ok: false; error: string };

export function registerArrival(
  input: RegisterArrivalInput,
  deps: RegisterArrivalDeps,
): RegisterArrivalResult {
  const nom = input.nom.trim();
  const prenom = input.prenom.trim();
  if (!nom || !prenom) {
    return { ok: false, error: "Nom et prénom requis." };
  }

  const today = todayIso();
  const arrivalTime = input.arrivalTime?.trim() || currentTimeHm();
  const motif = input.motif.trim() || "Consultation";

  let patient =
    findPatientByIdentity(deps.patientsMap, nom, prenom) ?? undefined;
  let created = false;

  if (!patient) {
    const id = deps.createPatientFromForm({
      nom,
      prenom,
      tel: input.tel?.trim() || undefined,
      ddn: input.ddn?.trim() || undefined,
      motif,
      specialite: specialtyFromMotif(motif),
    });
    if (!id) return { ok: false, error: "Impossible de créer le dossier." };
    patient = deps.patientsMap[id] ?? {
      id,
      nom,
      prenom,
      specialite: specialtyFromMotif(motif),
    };
    created = true;
  }

  const already = deps.queueToday.some((e) => e.patientId === patient!.id);
  if (already) {
    return { ok: false, error: "Cette patiente est déjà dans la file du jour." };
  }

  deps.addWaiting({
    patientId: patient.id,
    date: today,
    arrivalTime,
    status: "waiting",
    motif,
  });

  return { ok: true, patientId: patient.id, created };
}

export function addPatientToWaitingQueue(
  patientId: string,
  patientsMap: Record<string, PatientSnapshot>,
  queueToday: WaitingEntry[],
  addWaiting: (entry: Omit<WaitingEntry, "id">) => string,
): { ok: true } | { ok: false; error: string } {
  const p = patientsMap[patientId];
  if (!p) return { ok: false, error: "Dossier introuvable." };
  if (!(p.nom ?? "").trim()) {
    return { ok: false, error: "Renseignez le nom de la patiente." };
  }

  if (queueToday.some((e) => e.patientId === patientId)) {
    return { ok: false, error: "Déjà en salle d'attente aujourd'hui." };
  }

  addWaiting({
    patientId,
    date: todayIso(),
    arrivalTime: currentTimeHm(),
    status: "waiting",
    motif: p.motif || "Consultation",
  });

  return { ok: true };
}
