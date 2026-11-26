"use client";

import { useCallback, useState } from "react";
import type { ExamEntry, PatientSnapshot } from "@/types/domain";
import type { FieldPatch } from "@/components/dossier/form-primitives";
import { ExamsCard } from "@/components/dossier/exams-card";
import { ExamImport } from "@/components/dossier/exam-import";

/** Onglet Examens : import d'un compte rendu, échographies et biologies datées. */
export function ExamensBilansTab({
  draft,
  patchDraft,
}: {
  draft: PatientSnapshot;
  onField: (p: FieldPatch) => void;
  patchDraft: (p: Partial<PatientSnapshot>) => void;
}) {
  const [incoming, setIncoming] = useState<{ exam: ExamEntry; notes: string[] } | null>(null);
  const done = useCallback(() => setIncoming(null), []);

  return (
    <div className="space-y-0">
      <ExamImport draft={draft} onExtracted={setIncoming} />
      <ExamsCard draft={draft} patchDraft={patchDraft} kind="echo" incoming={incoming} onIncomingDone={done} />
      <ExamsCard draft={draft} patchDraft={patchDraft} kind="bio" incoming={incoming} onIncomingDone={done} />
    </div>
  );
}
