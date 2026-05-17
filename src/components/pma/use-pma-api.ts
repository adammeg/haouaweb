"use client";

import { useCallback, useMemo, useRef } from "react";
import { hawaeApi } from "@/lib/api/mobile-client";
import {
  EMPTY_IVF_PROFILE,
  type IvfAnalysis,
  type IvfPatientProfile,
} from "@/lib/pma/ivf-types";
import { ivfProfileFromPatient } from "@/lib/pma/ivf-profile-mapper";
import type { PatientSnapshot } from "@/types/domain";
import type { IvfProfile } from "@/types/modules";

export function usePmaApi() {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadBundle = useCallback(
    async (
      patientId: string,
      patient: PatientSnapshot | null,
    ): Promise<{
      profile: IvfPatientProfile;
      analysis: IvfAnalysis | null;
      cycles: IvfProfile[];
    }> => {
      try {
        const data = await hawaeApi.ivf.getProfile(patientId);
        const fromDossier = patient ? ivfProfileFromPatient(patient) : EMPTY_IVF_PROFILE;
        return {
          profile: data.profile
            ? { ...fromDossier, ...data.profile }
            : fromDossier,
          analysis: data.analysis,
          cycles: data.cycles,
        };
      } catch {
        return {
          profile: patient ? ivfProfileFromPatient(patient) : EMPTY_IVF_PROFILE,
          analysis: null,
          cycles: [],
        };
      }
    },
    [],
  );

  const scheduleSaveProfile = useCallback(
    (patientId: string, profile: IvfPatientProfile) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        hawaeApi.ivf.saveProfile(patientId, profile).catch(() => {});
      }, 800);
    },
    [],
  );

  const analyze = useCallback(
    async (patientId: string, profile: IvfPatientProfile) => {
      const res = await hawaeApi.ivf.analyze(patientId, profile);
      return res.analysis;
    },
    [],
  );

  const selectProtocol = useCallback(
    async (patientId: string, protocolId: string) => {
      const res = await hawaeApi.ivf.selectProtocol(patientId, protocolId);
      return res.analysis;
    },
    [],
  );

  const reset = useCallback(async (patientId: string) => {
    await hawaeApi.ivf.reset(patientId);
  }, []);

  const saveCycle = useCallback(
    async (patientId: string, cycle: IvfProfile) => {
      await hawaeApi.ivf.saveCycle(patientId, cycle);
    },
    [],
  );

  const deleteCycle = useCallback(
    async (patientId: string, cycleId: string) => {
      await hawaeApi.ivf.deleteCycle(patientId, cycleId);
    },
    [],
  );

  const listCycles = useCallback(async () => {
    const res = await hawaeApi.ivf.listCycles();
    return res.cycles;
  }, []);

  return useMemo(
    () => ({
      loadBundle,
      scheduleSaveProfile,
      analyze,
      selectProtocol,
      reset,
      saveCycle,
      deleteCycle,
      listCycles,
    }),
    [
      loadBundle,
      scheduleSaveProfile,
      analyze,
      selectProtocol,
      reset,
      saveCycle,
      deleteCycle,
      listCycles,
    ],
  );
}
