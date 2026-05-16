"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { useHawaeStore } from "@/stores/hawae-store";
import { useModulesStore, useModulesWorkspace } from "@/stores/modules-store";
import { runAssist, profileFromSnapshot } from "@/lib/assist";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";
import { getPatientDisplayName } from "@/lib/patient-utils";
import type { IvfCycleDay, IvfProfile } from "@/types/modules";

const DEFAULT_DAYS: IvfCycleDay[] = Array.from({ length: 14 }, (_, i) => ({
  day: i + 1,
  label: "J" + (i + 1),
}));

export function PmaClient() {
  const ws = useModulesWorkspace();
  const saveIvfProfile = useModulesStore((s) => s.saveIvfProfile);
  const deleteIvfProfile = useModulesStore((s) => s.deleteIvfProfile);
  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });

  const [patientId, setPatientId] = useState("");
  const [protocol, setProtocol] = useState("Antagoniste");
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );

  const poseidon = useMemo(() => {
    const p = patientId ? patientsMap[patientId] : null;
    if (!p) return null;
    const result = runAssist(profileFromSnapshot(p));
    return result.executed.find((s) => s.score_name === "POSEIDON");
  }, [patientId, patientsMap]);

  function saveProfile() {
    const p = patientsMap[patientId];
    if (!p) return;
    const profile: IvfProfile = {
      id: "ivf_" + nanoid(8),
      patientId,
      patientName: getPatientDisplayName(p),
      protocol,
      startDate,
      poseidonGroup: poseidon?.interpretation,
      days: DEFAULT_DAYS,
      updatedAt: new Date().toISOString(),
    };
    saveIvfProfile(profile);
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--border)] pb-6">
        <h1 className="font-display text-2xl font-bold">PMA / FIV avancé</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Protocole de stimulation, calendrier J1–J14, POSEIDON via Hawae Assist.
        </p>
      </header>

      <div className="grid gap-4 rounded-2xl border bg-white p-6 lg:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Patiente</span>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          >
            <option value="">— Choisir —</option>
            {Object.values(patientsMap).map((p) => (
              <option key={p.id} value={p.id}>
                {getPatientDisplayName(p)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Protocole</span>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={protocol}
            onChange={(e) => setProtocol(e.target.value)}
          >
            <option>Antagoniste</option>
            <option>Agoniste long</option>
            <option>Micro-dose flare</option>
            <option>Natural / mild</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Début cycle</span>
          <input
            type="date"
            className="w-full rounded-xl border px-3 py-2"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        {poseidon ? (
          <div className="rounded-xl bg-[var(--teal-pale)]/50 p-4 text-sm">
            <strong>POSEIDON :</strong> {poseidon.interpretation}
          </div>
        ) : null}
        <button
          type="button"
          onClick={saveProfile}
          className="rounded-xl bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white lg:col-span-2"
        >
          Créer profil cycle
        </button>
      </div>

      <section>
        <h2 className="mb-3 font-bold">Cycles enregistrés</h2>
        <ul className="space-y-2">
          {ws.ivfProfiles.map((pr) => (
            <li
              key={pr.id}
              className="rounded-xl border bg-white px-4 py-3 text-sm"
            >
              <strong>{pr.patientName}</strong> — {pr.protocol} · début{" "}
              {pr.startDate}
              {pr.poseidonGroup ? " · " + pr.poseidonGroup : ""}
              <button
                type="button"
                className="ml-3 text-xs text-red-600"
                onClick={() => deleteIvfProfile(pr.id)}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
