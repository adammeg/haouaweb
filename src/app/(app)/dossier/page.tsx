import { Suspense } from "react";
import { DossierWorkspace } from "@/components/dossier/dossier-workspace";

export default function DossierPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-[var(--muted)]">Chargement dossier…</div>
      }
    >
      <DossierWorkspace />
    </Suspense>
  );
}
