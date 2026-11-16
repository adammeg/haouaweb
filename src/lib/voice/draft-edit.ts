import type { PatientSnapshot } from "@/types/domain";
import { stableClinicalDataKey } from "@/lib/ia/clinical-revision";
import type { DictationField } from "./commands";

export type PendingVoiceEdit = {
  patientId: string; userId: string; clinicalKey: string;
  field: DictationField; previous: string; proposed: string;
};

export function stageVoiceEdit(draft: PatientSnapshot, userId: string, field: DictationField, value: string): PendingVoiceEdit {
  const previous = draft[field] ?? "";
  return { patientId: draft.id, userId, clinicalKey: stableClinicalDataKey(draft), field, previous,
    proposed: [previous, value.trim()].filter(Boolean).join("\n") };
}

export function voiceEditIsCurrent(edit: PendingVoiceEdit, draft: PatientSnapshot | null, userId: string | null): boolean {
  return !!draft && edit.patientId === draft.id && edit.userId === userId && edit.clinicalKey === stableClinicalDataKey(draft);
}
