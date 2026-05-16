import type { AssistQuestion } from "./types";

const QUESTION_TEMPLATES: Record<
  string,
  {
    type: string;
    text: string;
    unit: string | null;
    format: string;
    priority: number;
    for: string[];
    options?: string[];
  }
> = {
  age: {
    type: "clinical",
    text: "Âge de la patiente (ans) ?",
    unit: "ans",
    format: "number",
    priority: 1,
    for: ["FMF_T21", "FMF_PE", "ROMA", "POSEIDON", "VTE_RCOG"],
  },
  gestational_age_weeks: {
    type: "clinical",
    text: "Âge gestationnel actuel (SA) ?",
    unit: "SA",
    format: "number",
    priority: 1,
    for: ["FMF_T21", "FMF_PE", "CPR", "FGR"],
  },
  papp_a_mom: {
    type: "lab",
    text: "PAPP-A T1 (MoM) ?",
    unit: "MoM",
    format: "number",
    priority: 1,
    for: ["FMF_T21", "FMF_PE"],
  },
  nt_mm: {
    type: "measurement",
    text: "Clarté nucale NT (mm) ?",
    unit: "mm",
    format: "number",
    priority: 1,
    for: ["FMF_T21"],
  },
  ca125: {
    type: "lab",
    text: "CA-125 (U/mL) ?",
    unit: "U/mL",
    format: "number",
    priority: 1,
    for: ["ROMA", "ADNEX"],
  },
  he4: {
    type: "lab",
    text: "HE4 (pmol/L) ?",
    unit: "pmol/L",
    format: "number",
    priority: 1,
    for: ["ROMA"],
  },
  afc: {
    type: "measurement",
    text: "CFA total (OD+OG) J2–J4 ?",
    unit: "follicules",
    format: "number",
    priority: 1,
    for: ["POSEIDON", "OHSS"],
  },
};

export function generateQuestions(
  missingInputs: string[],
  limit = 10,
): AssistQuestion[] {
  const seen = new Set<string>();
  const questions: AssistQuestion[] = [];
  const unique = [...new Set(missingInputs)];
  for (const inp of unique) {
    const tpl = QUESTION_TEMPLATES[inp];
    const qid = tpl ? `q_${inp}` : `q_generic_${inp}`;
    if (seen.has(qid)) continue;
    seen.add(qid);
    if (tpl) {
      questions.push({
        id: qid,
        type: tpl.type,
        text: tpl.text,
        unit: tpl.unit,
        format: tpl.format,
        options: tpl.options ?? null,
        required_for: tpl.for,
        priority: tpl.priority,
      });
    } else {
      questions.push({
        id: qid,
        type: "clinical",
        text: `Valeur requise : ${inp.replace(/_/g, " ")} ?`,
        unit: null,
        format: "number",
        required_for: [],
        priority: 3,
      });
    }
  }
  questions.sort((a, b) => a.priority - b.priority);
  return questions.slice(0, limit);
}
