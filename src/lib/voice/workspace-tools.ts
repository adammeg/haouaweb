import type { PatientSnapshot } from "@/types/domain";
import type { Rdv } from "@/stores/rdv-store";
import type { Rappel } from "@/stores/rappels-store";
import type { WaitingEntry } from "@/types/modules";
import { normalizeVoiceText } from "./commands";

export type PatientMatch = { userId: string; patient: PatientSnapshot };
export type WorkspaceIntent =
  | { type: "patients"; query: string; action: "open" | "summary" | "search" }
  | { type: "calendar"; period: string; next: boolean; query: string }
  | { type: "appointment"; query: string; dateText: string; timeText: string }
  | { type: "waiting" }
  | { type: "reminders" }
  | { type: "field"; field: "identity" | "allergies" | "traitements" | "atcdMed" | "motif" | "symptomes" }
  | { type: "save" }
  | { type: "capabilities" };

const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];

export function workspaceIntent(raw: string, previous?: WorkspaceIntent | null): WorkspaceIntent | null {
  const text = normalizeVoiceText(raw);
  if (previous?.type === "calendar" && /^(?:et )?(?:demain|apres demain|aujourd hui|cette semaine|semaine prochaine|(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)(?: prochain)?)$/.test(text)) {
    return { ...previous, period: text.replace(/^et /, "").replace(/^cette semaine$/, "semaine"), next: false };
  }
  const cleaned = text.replace(/^(?:peux tu |pourrais tu |est ce que tu peux )/, "").replace(/ s il te plait$/, "");
  if (/^(?:que peux tu faire|quels sont tes acces|a quoi as tu acces|as tu acces (?:au dossier|a l agenda|aux rendez vous))$/.test(cleaned)) return { type: "capabilities" };
  if (/^(?:sauvegarde|enregistre|sauvegarder|enregistrer) (?:le |ce )?dossier$/.test(cleaned)) return { type: "save" };
  const patient = /^(ouvre|ouvrir|cherche|chercher|recherche|trouve|resume|resumer) (?:le |un |les )?(?:dossier|dossiers|patiente|patientes)(?: de| d| pour)?\s+(.+)$/.exec(cleaned);
  if (patient) return { type: "patients", query: patient[2].replace(/^(?:madame|mme) /, ""), action: /^(ouvre|ouvrir)$/.test(patient[1]) ? "open" : /^(resume|resumer)$/.test(patient[1]) ? "summary" : "search" };
  if (/^(?:liste|affiche|quelles sont|qui sont) (?:mes |les )patientes$/.test(cleaned)) return { type: "patients", query: "", action: "search" };
  if (/\b(?:cree|creer|prends|prendre|planifie|planifier|ajoute|ajouter|fixe|fixer)\b.*\b(?:rendez vous|rdv)\b/.test(cleaned)) {
    const prefix = cleaned.split(/\b(?:rendez vous|rdv)\b/)[0];
    if (/\b(?:ne|pas|jamais|sans)\b/.test(prefix)) return null;
    const match = /(?:rendez vous|rdv)\s+(?:pour\s+)?(.+?)\s+(aujourd hui|demain|apres demain|le\s+\d{1,2}[ /]\d{1,2}[ /]\d{4}|\d{4} \d{2} \d{2})\s+a\s+(\d{1,2}(?:\s*(?:h|heures?|:|\s)\s*\d{0,2})?)$/.exec(cleaned);
    return { type: "appointment", query: match?.[1].replace(/^(?:madame|mme) /, "") ?? "", dateText: match?.[2] ?? "", timeText: match?.[3] ?? "" };
  }
  if (/\b(?:rendez vous|rdv|agenda|planning|creneaux?)\b/.test(text) && !/\b(?:annule|supprime|deplace|modifie)\b/.test(text)) {
    const explicit = /\b(?:le )?\d{1,2} (?:\d{1,2} \d{4}|janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)(?: \d{4})?\b/.exec(text)?.[0];
    const weekday = WEEKDAYS.find((day) => text.includes(day));
    const period = explicit ?? (weekday ? `${weekday}${text.includes(`${weekday} prochain`) ? " prochain" : ""}` : text.includes("apres demain") ? "apres demain" : text.includes("demain") ? "demain" : text.includes("semaine prochaine") ? "semaine prochaine" : text.includes("semaine") ? "semaine" : /\b(?:mois|annee|entre)\b/.test(text) ? "" : "aujourd hui");
    const named = /(?:rendez vous|rdv) (?:de|pour) (.+?)(?: aujourd hui| demain| cette semaine|$)/.exec(text)?.[1] ?? "";
    const name = /^(?:demain|aujourd hui|la semaine|cette semaine)$/.test(named) || named === period ? "" : named.endsWith(` ${period}`) ? named.slice(0, -(period.length + 1)) : named;
    return { type: "calendar", period, next: /\bprochains? (?:rendez vous|rdv)\b/.test(text), query: /\b(?:ma patiente|cette patiente|patiente actuelle|patiente ouverte)\b/.test(text) ? "@active" : name.replace(/^(?:madame|mme) /, "") };
  }
  if (/\b(?:qui|combien|liste|lis|affiche)\b.*\b(?:attente|attendent)\b/.test(text)) return { type: "waiting" };
  if (/\b(?:rappels|a rappeler)\b/.test(text) && !/\b(?:supprime|cree|ajoute|annule)\b/.test(text)) return { type: "reminders" };
  if (/^(?:qui est (?:ma|la|cette) patiente|quel est (?:son nom|le nom de la patiente)|(?:quelle patiente|le dossier de qui|quelle est la patiente))$/.test(text)) return { type: "field", field: "identity" };
  const field = /^(?:quels? (?:est|sont) |quelles? (?:est|sont) |lis |donne moi |affiche )?(?:ses |les |son |le )?(allergies|traitements|antecedents|motif|symptomes)(?: (?:de la patiente|du dossier|actuels?|en cours))?$/.exec(text);
  if (field) return { type: "field", field: field[1] === "antecedents" ? "atcdMed" : field[1] as "allergies" | "traitements" | "motif" | "symptomes" };
  return null;
}

export function patientName(patient: PatientSnapshot): string {
  return [patient.prenom, patient.nom].filter(Boolean).join(" ").trim() || `Dossier ${patient.id}`;
}

export function findPatients(patientsByUser: Record<string, Record<string, PatientSnapshot>>, query: string): PatientMatch[] {
  const tokens = normalizeVoiceText(query).split(" ").filter(Boolean);
  return Object.entries(patientsByUser).flatMap(([userId, patients]) => Object.values(patients).map((patient) => ({ userId, patient })))
    .filter(({ patient }) => {
      const identity = normalizeVoiceText(`${patientName(patient)} ${patient.cin ?? ""}`).split(" ");
      return tokens.every((token) => identity.includes(token));
    }).sort((a, b) => patientName(a.patient).localeCompare(patientName(b.patient), "fr"));
}

export function parisDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}-${parts.find((p) => p.type === "day")!.value}`;
}
function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10);
}
export function appointmentDate(text: string, now = new Date()): string | null {
  const date = normalizeVoiceText(text);
  if (["aujourd hui", "demain", "apres demain"].includes(date)) return addDays(parisDate(now), date === "demain" ? 1 : date === "apres demain" ? 2 : 0);
  const weekday = /^(dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi)( prochain)?$/.exec(date);
  if (weekday) {
    const today = parisDate(now), day = new Date(`${today}T12:00:00Z`).getUTCDay();
    const offset = (WEEKDAYS.indexOf(weekday[1]) - day + 7) % 7;
    return addDays(today, offset || (weekday[2] ? 7 : 0));
  }
  const namedDate = /^(?:le )?(\d{1,2}) ([a-z]+)(?: (\d{4}))?$/.exec(date);
  if (namedDate && MONTHS.includes(namedDate[2])) return appointmentDate(`${namedDate[1]} ${MONTHS.indexOf(namedDate[2]) + 1} ${namedDate[3] ?? parisDate(now).slice(0, 4)}`, now);
  const match = /^(?:le )?(\d{1,2}) (\d{1,2}) (\d{4})$/.exec(date);
  const iso = match ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}` : /^\d{4} \d{2} \d{2}$/.test(date) ? date.replaceAll(" ", "-") : "";
  const value = new Date(`${iso}T12:00:00Z`);
  return iso && !Number.isNaN(value.getTime()) && value.toISOString().slice(0, 10) === iso ? iso : null;
}
export function appointmentTime(text: string): string | null {
  const match = /^(\d{1,2})(?:\s*(?:h|heures?|:|\s)\s*(\d{1,2})?)?$/.exec(text.trim());
  if (!match || Number(match[1]) > 23 || Number(match[2] ?? 0) > 59) return null;
  return `${match[1].padStart(2, "0")}:${(match[2] ?? "00").padStart(2, "0")}`;
}

export function calendarReply(list: Rdv[], intent: Extract<WorkspaceIntent, { type: "calendar" }>, now = new Date()): string {
  let from = appointmentDate(intent.period.startsWith("semaine") ? "aujourd hui" : intent.period, now);
  if (!from) return "Précisez la date des rendez-vous à consulter.";
  if (intent.period.startsWith("semaine")) {
    const day = new Date(`${from}T12:00:00Z`).getUTCDay();
    from = addDays(from, -((day + 6) % 7) + (intent.period === "semaine prochaine" ? 7 : 0));
  }
  const to = intent.period.startsWith("semaine") ? addDays(from, 6) : from;
  const start = from;
  const time = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
  const tokens = normalizeVoiceText(intent.query).split(" ").filter(Boolean);
  const matches = list.filter((r) => r.statut !== "annule" && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && /^\d{2}:\d{2}$/.test(r.heure))
    .filter((r) => tokens.every((token) => normalizeVoiceText(r.patient).split(" ").includes(token)))
    .filter((r) => intent.next ? `${r.date} ${r.heure}` >= `${parisDate(now)} ${time}` : r.date >= start && r.date <= to)
    .sort((a, b) => `${a.date} ${a.heure}`.localeCompare(`${b.date} ${b.heure}`));
  if (!matches.length) return `Aucun rendez-vous ${intent.next ? "à venir" : `pour ${intent.period}`} dans l’agenda chargé${intent.query ? ` pour ${intent.query}` : ""}.`;
  const selected = matches.slice(0, intent.next ? 1 : 5);
  const rows = selected.map((r) => `${r.date.split("-").reverse().join("/")} à ${r.heure.replace(":", " heures ")}, ${r.patient}, ${r.duree} minutes, statut ${r.statut.replaceAll("_", " ")}`).join(". ");
  return `${intent.next ? "Prochain rendez-vous" : `${matches.length} rendez-vous ${intent.period}`} : ${rows}.${matches.length > selected.length && !intent.next ? " Les autres sont visibles dans l’agenda." : ""}`;
}

export function fieldReply(patient: PatientSnapshot | null, field: Extract<WorkspaceIntent, { type: "field" }>["field"]): string {
  if (!patient) return "Aucun dossier ouvert. Dites par exemple : ouvre le dossier de suivi du nom de la patiente.";
  if (field === "identity") return `Le dossier ouvert est celui de ${patientName(patient)}.`;
  const label = { allergies: "Allergies", traitements: "Traitements", atcdMed: "Antécédents médicaux", motif: "Motif", symptomes: "Symptômes" }[field];
  return `${label} dans le dossier de ${patientName(patient)} : ${patient[field]?.trim() || "non renseigné"}.`;
}
export function waitingReply(queue: WaitingEntry[], patients: Record<string, PatientSnapshot>, now = new Date()): string {
  const rows = queue.filter((e) => e.date === parisDate(now) && (e.status === "waiting" || e.status === "in_consult")).sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime));
  return rows.length ? `${rows.length} patiente${rows.length > 1 ? "s" : ""} dans la file : ${rows.slice(0, 5).map((e) => `${patients[e.patientId] ? patientName(patients[e.patientId]) : "dossier non retrouvé"}, arrivée à ${e.arrivalTime}, ${e.status === "in_consult" ? "en consultation" : "en attente"}`).join(". ")}.` : "Aucune patiente dans la salle d’attente chargée pour aujourd’hui.";
}
export function remindersReply(list: Rappel[]): string {
  const pending = list.filter((r) => !r.done).sort((a, b) => a.date.localeCompare(b.date));
  return pending.length ? `${pending.length} rappel${pending.length > 1 ? "s" : ""} en cours : ${pending.slice(0, 5).map((r) => `${r.date}, ${r.patient || "sans patiente"}, ${r.desc}`).join(". ")}.` : "Aucun rappel manuel en cours dans les données chargées.";
}
