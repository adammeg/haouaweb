import { create } from "zustand";

export type DataStatus = "loading" | "ready" | "error";
export const useAssistantDataStatus = create<{
  doctorId: string | null; patients: DataStatus; clinical: DataStatus;
}>(() => ({ doctorId: null, patients: "loading", clinical: "loading" }));

export function markAssistantData(doctorId: string | undefined, source: "patients" | "clinical", status: DataStatus) {
  if (doctorId && useAssistantDataStatus.getState().doctorId === doctorId) useAssistantDataStatus.setState({ [source]: status });
}
