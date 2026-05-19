import type { WorkspacePersisted } from "@/lib/db/workspace-repository";
import { ingestAllFullTrainingData } from "@/lib/training/ingest-full";
import type { TrainingIngestStats } from "@/types/training";

/**
 * Après synchro workspace : ingestion complète pour entraînement IA (MongoDB).
 * @deprecated Préférer ingestAllFullTrainingData — conservé pour compatibilité d'appels.
 */
export async function ingestWorkspaceForTraining(
  doctorId: string,
  _workspace: WorkspacePersisted,
  _sourceUpdatedAt: string,
): Promise<TrainingIngestStats> {
  void _workspace;
  void _sourceUpdatedAt;
  return ingestAllFullTrainingData(doctorId);
}

export { ingestAllFullTrainingData } from "@/lib/training/ingest-full";
