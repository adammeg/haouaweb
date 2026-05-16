"use client";

import { useState } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import {
  ECHO_FIELD_MAP,
  parseOcrBlock,
} from "@/lib/bridge/field-map";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";
import { getPatientDisplayName } from "@/lib/patient-utils";

export function BridgeClient() {
  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });
  const openPatient = useHawaeStore((s) => s.openPatient);
  const patchDraft = useHawaeStore((s) => s.patchDraft);

  const [patientId, setPatientId] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [dicomJson, setDicomJson] = useState("{}");
  const [msg, setMsg] = useState<string | null>(null);

  function applyOcr() {
    if (!patientId) return;
    openPatient(patientId);
    const parsed = parseOcrBlock(ocrText);
    patchDraft(parsed);
    setMsg(
      "Champs appliqués : " +
        Object.keys(parsed).join(", ") || "aucun champ reconnu",
    );
  }

  function applyDicom() {
    if (!patientId) return;
    try {
      const obj = JSON.parse(dicomJson) as Record<string, string | number>;
      openPatient(patientId);
      const patch: Record<string, string> = {};
      for (const m of ECHO_FIELD_MAP) {
        const v = obj[m.source];
        if (v != null) patch[m.target as string] = String(v);
      }
      patchDraft(patch);
      setMsg("DICOM SR : " + Object.keys(patch).length + " champ(s).");
    } catch {
      setMsg("JSON DICOM invalide.");
    }
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--border)] pb-6">
        <h1 className="font-display text-2xl font-bold">
          Bridge DICOM & OCR échographe
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Import biométrie depuis texte OCR ou JSON SR (Voluson, GE, etc.).
        </p>
      </header>

      <label className="block max-w-md text-sm">
        <span className="mb-1 block font-semibold">Dossier cible</span>
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

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="font-bold">OCR échographe</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Collez le texte copié depuis l&apos;écran ou photo (BIP, HC, AC, FL…).
          </p>
          <textarea
            className="mt-3 w-full rounded-xl border px-3 py-2 font-mono text-xs"
            rows={8}
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            placeholder={"BIP: 55\nHC: 200\nGA: 22"}
          />
          <button
            type="button"
            onClick={applyOcr}
            className="mt-3 rounded-xl bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white"
          >
            Appliquer au dossier
          </button>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <h2 className="font-bold">DICOM SR (JSON)</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Clés : BPD, HC, AC, FL, EFW, UA-PI, MCA-PI…
          </p>
          <textarea
            className="mt-3 w-full rounded-xl border px-3 py-2 font-mono text-xs"
            rows={8}
            value={dicomJson}
            onChange={(e) => setDicomJson(e.target.value)}
          />
          <button
            type="button"
            onClick={applyDicom}
            className="mt-3 rounded-xl bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white"
          >
            Importer SR
          </button>
        </div>
      </section>

      <div className="rounded-xl bg-[var(--teal-pale)]/40 p-4 text-xs">
        <strong>Mapping :</strong>{" "}
        {ECHO_FIELD_MAP.map((f) => f.source + "→" + f.target).join(" · ")}
      </div>

      {msg ? <p className="text-sm font-semibold text-[var(--teal)]">{msg}</p> : null}
    </div>
  );
}
