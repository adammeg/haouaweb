"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import "@/styles/pma.css";
import { useHawaeStore } from "@/stores/hawae-store";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";
import { getPatientDisplayName } from "@/lib/patient-utils";
import { ivfProfileFromPatient } from "@/lib/pma/ivf-profile-mapper";
import {
  EMPTY_IVF_PROFILE,
  type IvfAnalysis,
  type IvfPatientProfile,
} from "@/lib/pma/ivf-types";
import type { IvfProfile, IvfCycleDay } from "@/types/modules";
import { usePmaApi } from "@/components/pma/use-pma-api";
import { PmaProfileForm } from "@/components/pma/pma-profile-form";
import { PmaAnalysisPanel } from "@/components/pma/pma-analysis-panel";
import { PmaProtocolGrid } from "@/components/pma/pma-protocol-grid";
import { PmaCalendarPanel } from "@/components/pma/pma-calendar-panel";

const SECTIONS = [
  { id: "profil", label: "👤 Profil" },
  { id: "reserve", label: "🔬 Réserve" },
  { id: "hormones", label: "🧪 Hormones" },
  { id: "historique", label: "📂 Historique FIV" },
  { id: "analyse", label: "🤖 Analyse Hawae" },
  { id: "protocole", label: "💊 Protocole" },
  { id: "calendrier", label: "📅 Calendrier" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function calendarToCycleDays(
  analysis: IvfAnalysis,
): IvfCycleDay[] {
  return analysis.calendar.map((d, i) => ({
    day: i + 1,
    label: d.day,
    meds: d.title,
    notes: d.detail,
  }));
}

export function PmaClient() {
  const pmaApi = usePmaApi();
  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });

  const [patientId, setPatientId] = useState("");
  const [section, setSection] = useState<SectionId>("profil");
  const [profile, setProfile] = useState<IvfPatientProfile>(EMPTY_IVF_PROFILE);
  const [analysis, setAnalysis] = useState<IvfAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [cycles, setCycles] = useState<IvfProfile[]>([]);

  const patient = patientId ? patientsMap[patientId] : null;
  const patientName = patient ? getPatientDisplayName(patient) : "";

  const patchProfile = useCallback(
    <K extends keyof IvfPatientProfile>(
      key: K,
      value: IvfPatientProfile[K],
    ) => {
      setProfile((prev) => {
        const next = { ...prev, [key]: value };
        if (patientId) pmaApi.scheduleSaveProfile(patientId, next);
        return next;
      });
    },
    [patientId, pmaApi],
  );

  useEffect(() => {
    pmaApi.listCycles().then(setCycles).catch(() => setCycles([]));
  }, [pmaApi]);

  useEffect(() => {
    if (!patientId) {
      setProfile(EMPTY_IVF_PROFILE);
      setAnalysis(null);
      return;
    }
    let cancelled = false;
    pmaApi.loadBundle(patientId, patient).then((bundle) => {
      if (!cancelled) {
        setProfile(bundle.profile);
        setAnalysis(bundle.analysis);
        setCycles(bundle.cycles);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [patientId, patient, pmaApi]);

  const selectedProto = useMemo(() => {
    if (!analysis?.selectedProtocolId) return undefined;
    return analysis.protocols.find((p) => p.id === analysis.selectedProtocolId);
  }, [analysis]);

  async function runAnalysis() {
    if (!patientId) {
      alert("Choisissez une patiente.");
      return;
    }
    if (profile.age == null) {
      alert("L'âge est obligatoire pour l'analyse.");
      return;
    }
    setAnalyzing(true);
    setSection("analyse");
    try {
      const result = await pmaApi.analyze(patientId, profile);
      setAnalysis(result);
    } catch {
      alert("Erreur lors de l'analyse. Vérifiez la connexion.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSelectProtocol(id: string) {
    if (!patientId || !analysis) return;
    try {
      const next = await pmaApi.selectProtocol(patientId, id);
      setAnalysis(next);
      setSection("calendrier");
    } catch {
      alert("Impossible de mettre à jour le protocole.");
    }
  }

  async function handleReset() {
    if (!patientId) return;
    if (!confirm("Réinitialiser le profil et l'analyse PMA pour cette patiente ?"))
      return;
    try {
      await pmaApi.reset(patientId);
      if (patient) setProfile(ivfProfileFromPatient(patient));
      else setProfile(EMPTY_IVF_PROFILE);
      setAnalysis(null);
    } catch {
      alert("Erreur lors de la réinitialisation.");
    }
  }

  async function saveCycle() {
    if (!patientId || !patient || !analysis || !selectedProto) {
      alert("Analysez et sélectionnez un protocole avant d'enregistrer le cycle.");
      return;
    }
    const pr: IvfProfile = {
      id: "ivf_" + nanoid(8),
      patientId,
      patientName: getPatientDisplayName(patient),
      protocol: selectedProto.name,
      startDate,
      poseidonGroup: "G" + analysis.poseidon.group,
      bolognaPor: analysis.bologna.positive,
      days: calendarToCycleDays(analysis),
      updatedAt: new Date().toISOString(),
    };
    try {
      await pmaApi.saveCycle(patientId, pr);
      const list = await pmaApi.listCycles();
      setCycles(list);
    } catch {
      alert("Erreur lors de l'enregistrement du cycle.");
    }
  }

  async function handleDeleteCycle(cycleId: string, cyclePatientId?: string) {
    const pid = cyclePatientId ?? patientId;
    if (!pid) return;
    try {
      await pmaApi.deleteCycle(pid, cycleId);
      const list = await pmaApi.listCycles();
      setCycles(list);
    } catch {
      alert("Erreur lors de la suppression.");
    }
  }

  return (
    <div className="pma-wrap space-y-4">
      <div className="pma-header-card">
        <div>
          <h1 className="pma-header-title">
            🧬 IVF / PMA Engine{" "}
            <span className="pma-engine-tag">Clinical Engine v50</span>
          </h1>
          <p className="pma-header-sub">
            {patientName || "Sélectionnez une patiente — données synchronisées avec le dossier infertilité"}
          </p>
        </div>
        <div className="pma-header-actions">
          <button
            type="button"
            className="pma-btn secondary"
            disabled={!patientId}
            onClick={handleReset}
          >
            🔄 Réinitialiser
          </button>
          <button
            type="button"
            className="pma-btn gold"
            disabled={!patientId || analyzing}
            onClick={runAnalysis}
          >
            {analyzing ? "Analyse…" : "🤖 Analyser"}
          </button>
        </div>
      </div>

      <label className="block max-w-md text-sm">
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

      <nav className="pma-subnav">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={
              "pma-subnav-btn" + (section === s.id ? " active" : "")
            }
            onClick={() => setSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {["profil", "reserve", "hormones", "historique"].includes(section) ? (
        <PmaProfileForm
          section={section}
          profile={profile}
          onPatch={patchProfile}
        />
      ) : null}

      {section === "analyse" ? (
        <div className={"pma-section active"}>
          {analyzing ? (
            <div className="pma-card pma-empty">
              <p>Analyse clinique en cours…</p>
            </div>
          ) : analysis ? (
            <PmaAnalysisPanel analysis={analysis} />
          ) : (
            <div className="pma-card pma-empty">
              <div className="pma-empty-icon">🤖</div>
              <p className="font-bold">Aucune analyse disponible</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Renseignez le profil (âge, AMH, CFA) puis cliquez sur Analyser.
              </p>
              <button
                type="button"
                className="pma-btn primary mt-4"
                onClick={runAnalysis}
              >
                🤖 Lancer l&apos;analyse Hawae
              </button>
            </div>
          )}
        </div>
      ) : null}

      {section === "protocole" ? (
        <div className="pma-section active">
          {analysis ? (
            <PmaProtocolGrid
              analysis={analysis}
              selectedId={analysis.selectedProtocolId}
              onSelect={handleSelectProtocol}
            />
          ) : (
            <div className="pma-card pma-empty">
              <div className="pma-empty-icon">💊</div>
              <p className="font-bold">Protocoles non générés</p>
              <button
                type="button"
                className="pma-btn primary mt-4"
                onClick={runAnalysis}
              >
                🤖 Analyser pour générer les protocoles
              </button>
            </div>
          )}
        </div>
      ) : null}

      {section === "calendrier" ? (
        <div className="pma-section active space-y-4">
          {analysis ? (
            <PmaCalendarPanel
              analysis={analysis}
              selectedProto={selectedProto}
            />
          ) : (
            <div className="pma-card pma-empty">
              <p className="text-sm text-[var(--muted)]">
                Lancez l&apos;analyse pour générer le calendrier.
              </p>
            </div>
          )}
          {analysis && selectedProto ? (
            <div className="flex flex-wrap items-end gap-4 rounded-2xl border bg-white p-4">
              <label className="text-sm">
                <span className="mb-1 block font-semibold">Début cycle</span>
                <input
                  type="date"
                  className="rounded-xl border px-3 py-2"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={saveCycle}
                className="rounded-xl bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white"
              >
                Enregistrer le cycle
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 font-bold">Cycles enregistrés</h2>
        <ul className="space-y-2">
          {cycles.map((pr) => (
            <li
              key={pr.id}
              className="rounded-xl border bg-white px-4 py-3 text-sm"
            >
              <strong>{pr.patientName}</strong> — {pr.protocol} · début{" "}
              {pr.startDate}
              {pr.poseidonGroup ? " · POSEIDON " + pr.poseidonGroup : ""}
              {pr.bolognaPor ? " · Bologne POR" : ""}
              <button
                type="button"
                className="ml-3 text-xs text-red-600"
                onClick={() => handleDeleteCycle(pr.id, pr.patientId)}
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
