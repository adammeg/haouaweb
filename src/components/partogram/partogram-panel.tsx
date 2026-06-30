"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { nanoid } from "nanoid";
import { useModulesStore, useModulesWorkspace } from "@/stores/modules-store";
import type { PartogramPoint, PartogramSession } from "@/types/modules";
import { drawPartogramCanvas } from "@/lib/partogram/canvas";
import { pointsToCanvasEntries } from "@/lib/partogram/canvas-types";
import {
  computeClinicalAlerts,
  computeInfoStrip,
} from "@/lib/partogram/alerts";
import {
  genDossierId,
  PARTO_SCENARIOS,
  type SimScenario,
} from "@/lib/partogram/constants";
import { buildClinicalSummary } from "@/lib/partogram/summary";
import { exportPartogramPdf } from "@/lib/partogram/pdf";

export type PartogramPanelProps = {
  embedded?: boolean;
  patientId?: string;
  initialName?: string;
  initialTerme?: string;
  initialAge?: string;
  initialParite?: string;
};

type PatientForm = {
  nom: string;
  prenom: string;
  age: string;
  parite: string;
  terme: string;
  debut: string;
  praticien: string;
  dossierId: string;
};

function defaultDebut(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function defaultTime(): string {
  const d = new Date();
  return (
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  );
}

export function PartogramPanel({
  embedded = false,
  patientId,
  initialName = "",
  initialTerme = "",
  initialAge = "",
  initialParite = "0",
}: PartogramPanelProps) {
  const ws = useModulesWorkspace();
  const savePartogram = useModulesStore((s) => s.savePartogram);
  const deletePartogram = useModulesStore((s) => s.deletePartogram);

  const [sessionId, setSessionId] = useState(() => "parto_" + nanoid(8));
  const [points, setPoints] = useState<PartogramPoint[]>([]);
  const [patient, setPatient] = useState<PatientForm>(() => {
    const parts = initialName.trim().split(/\s+/);
    const prenom = parts[0] ?? "";
    const nom = parts.slice(1).join(" ");
    return {
      nom,
      prenom,
      age: initialAge,
      parite: initialParite,
      terme: initialTerme,
      debut: defaultDebut(),
      praticien: "",
      dossierId: genDossierId(),
    };
  });

  const [entryTime, setEntryTime] = useState(defaultTime);
  const [eDil, setEDil] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eBcf, setEBcf] = useState("");
  const [eCxNb, setECxNb] = useState("");
  const [eCxDur, setECxDur] = useState("");
  const [eCxInt, setECxInt] = useState("");
  const [eLa, setELa] = useState("C");
  const [eTas, setETas] = useState("");
  const [eTad, setETad] = useState("");
  const [ePouls, setEPouls] = useState("");
  const [eTemp, setETemp] = useState("");
  const [eOxyt, setEOxyt] = useState("");
  const [eUrines, setEUrines] = useState("");

  const [simSpeed, setSimSpeed] = useState(1);
  const [simLabel, setSimLabel] = useState("");
  const [simActive, setSimActive] = useState(false);
  const simRef = useRef<{
    scenario: SimScenario;
    step: number;
    timer: ReturnType<typeof setTimeout> | null;
  } | null>(null);

  const [summary, setSummary] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const canvasEntries = useMemo(() => pointsToCanvasEntries(points), [points]);
  const alerts = useMemo(
    () => computeClinicalAlerts(canvasEntries),
    [canvasEntries],
  );
  const info = useMemo(() => {
    const strip = computeInfoStrip(canvasEntries);
    return {
      ...strip,
      admission: patient.debut
        ? new Date(patient.debut).toLocaleString("fr-FR")
        : "—",
    };
  }, [canvasEntries, patient.debut]);

  const displayName =
    [patient.prenom, patient.nom].filter(Boolean).join(" ") || "Patiente";

  const liveSession: PartogramSession = useMemo(
    () => ({
      id: sessionId,
      patientId,
      patientName: displayName,
      admissionAt: patient.debut,
      termeSa: patient.terme,
      patientAge: patient.age,
      parite: patient.parite,
      praticien: patient.praticien,
      dossierId: patient.dossierId,
      points,
      events: [],
      updatedAt: new Date().toISOString(),
    }),
    [sessionId, patientId, displayName, patient, points],
  );

  const linkedSessions = useMemo(
    () =>
      patientId
        ? ws.partograms.filter((p) => p.patientId === patientId)
        : ws.partograms,
    [ws.partograms, patientId],
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawPartogramCanvas(
      canvas,
      canvasEntries,
      wrapRef.current?.clientWidth,
    );
  }, [canvasEntries]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const onResize = () => redraw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [redraw]);

  useEffect(() => {
    return () => {
      if (simRef.current?.timer) clearTimeout(simRef.current.timer);
    };
  }, []);

  function patchPatient<K extends keyof PatientForm>(k: K, v: PatientForm[K]) {
    setPatient((p) => ({ ...p, [k]: v }));
  }

  function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!patient.debut) return;

    const [hh, mm] = entryTime.split(":").map(Number);
    const base = new Date(patient.debut);
    const entryDate = new Date(base);
    entryDate.setHours(hh ?? 0, mm ?? 0, 0, 0);
    if (entryDate < base) entryDate.setDate(entryDate.getDate() + 1);

    const sorted = [...points].sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    );
    const t0 = sorted[0]
      ? new Date(sorted[0].recordedAt).getTime()
      : entryDate.getTime();
    const hoursFromAdmission =
      (entryDate.getTime() - t0) / 3600000;

    const pt: PartogramPoint = {
      id: "pt_" + nanoid(8),
      recordedAt: entryDate.toISOString(),
      hoursFromAdmission,
      dilatationCm: eDil ? parseFloat(eDil) : undefined,
      descent: eDesc !== "" ? parseInt(eDesc, 10) : undefined,
      fcf: eBcf ? parseInt(eBcf, 10) : undefined,
      cx: eCxNb ? parseInt(eCxNb, 10) : undefined,
      cxDur: eCxDur ? parseInt(eCxDur, 10) : undefined,
      cxInt: eCxInt ? (parseInt(eCxInt, 10) as 1 | 2 | 3) : undefined,
      la: eLa,
      taSys: eTas ? parseInt(eTas, 10) : undefined,
      taDia: eTad ? parseInt(eTad, 10) : undefined,
      pulse: ePouls ? parseInt(ePouls, 10) : undefined,
      temp: eTemp ? parseFloat(eTemp) : undefined,
      oxytocine: eOxyt ? parseFloat(eOxyt) : undefined,
      diuresis: eUrines ? parseInt(eUrines, 10) : undefined,
    };

    setPoints((prev) =>
      [...prev, pt].sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      ),
    );
    setEDil("");
    setEDesc("");
    setEBcf("");
    setECxNb("");
    setECxDur("");
    setECxInt("");
    setETas("");
    setETad("");
    setEPouls("");
    setETemp("");
    setEOxyt("");
    setEUrines("");
    setEntryTime(defaultTime());
  }

  function removePoint(id: string) {
    if (!confirm("Supprimer cette observation ?")) return;
    setPoints((prev) => prev.filter((p) => p.id !== id));
  }

  function saveSession() {
    savePartogram({
      ...liveSession,
      updatedAt: new Date().toISOString(),
    });
    setSessionId("parto_" + nanoid(8));
    setPoints([]);
  }

  function loadSession(s: PartogramSession) {
    setSessionId(s.id);
    const parts = s.patientName.split(/\s+/);
    setPatient({
      prenom: parts[0] ?? "",
      nom: parts.slice(1).join(" "),
      age: s.patientAge ?? "",
      parite: s.parite ?? "0",
      terme: s.termeSa ?? "",
      debut: s.admissionAt.slice(0, 16),
      praticien: s.praticien ?? "",
      dossierId: s.dossierId ?? genDossierId(),
    });
    setPoints(s.points);
  }

  function resetAll() {
    if (points.length && !confirm("Réinitialiser le partogramme ?")) return;
    simStop();
    setPoints([]);
    setSummary(null);
  }

  function simStop() {
    if (simRef.current?.timer) clearTimeout(simRef.current.timer);
    simRef.current = null;
    setSimActive(false);
    setSimLabel("");
  }

  function simStart(scenario: SimScenario) {
    simStop();
    setPoints([]);
    if (!patient.debut) patchPatient("debut", defaultDebut());
    const data = PARTO_SCENARIOS[scenario];
    simRef.current = { scenario, step: 0, timer: null };
    setSimActive(true);
    setSimLabel("Simulation : " + scenario + "…");
    tickSim(data, 0);
  }

  function tickSim(data: typeof PARTO_SCENARIOS.normal, step: number) {
    if (!simRef.current || step >= data.length) {
      simStop();
      return;
    }
    const pt = data[step]!;
    const base = new Date(patient.debut || defaultDebut());
    const t = new Date(base.getTime() + pt.h * 3600000);
    const newPt: PartogramPoint = {
      id: "sim_" + nanoid(6),
      recordedAt: t.toISOString(),
      hoursFromAdmission: pt.h,
      dilatationCm: pt.dil,
      descent: pt.desc,
      fcf: pt.bcf,
      cx: pt.cxNb,
      cxDur: pt.cxDur,
      cxInt: pt.cxInt as 1 | 2 | 3,
      la: pt.la,
      taSys: 120,
      taDia: 75,
      pulse: 88,
      temp: 37.2,
      diuresis: 80,
    };
    setPoints((prev) =>
      [...prev, newPt].sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      ),
    );
    simRef.current.step = step + 1;
    simRef.current.timer = setTimeout(
      () => tickSim(data, step + 1),
      1200 / simSpeed,
    );
  }

  function generateSummary() {
    const txt = buildClinicalSummary(
      {
        nom: patient.nom,
        prenom: patient.prenom,
        age: patient.age,
        parite: patient.parite,
        terme: patient.terme,
        debut: patient.debut,
        praticien: patient.praticien,
        dossier: patient.dossierId,
      },
      canvasEntries,
      info,
      alerts,
    );
    setSummary(txt);
  }

  async function exportPdf() {
    if (!points.length) return;
    setPdfBusy(true);
    try {
      redraw();
      const png = canvasRef.current?.toDataURL("image/png") ?? null;
      await exportPartogramPdf(liveSession, png);
    } finally {
      setPdfBusy(false);
    }
  }

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className={`parto-root ${embedded ? "embedded" : ""}`}>
      <header className="parto-page-header parto-no-print">
        <h1>📈 Partogramme OMS</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Grille OMS · dilatation · descente · contractions · BCF · alertes
          cliniques
        </p>
        <div className="parto-header-actions">
          <button
            type="button"
            className="parto-btn"
            onClick={() => window.print()}
          >
            🖨️ Imprimer
          </button>
          <button
            type="button"
            className="parto-btn gold"
            onClick={generateSummary}
          >
            📋 Résumé clinique
          </button>
          <button
            type="button"
            className="parto-btn primary"
            disabled={pdfBusy || !points.length}
            onClick={() => void exportPdf()}
          >
            {pdfBusy ? "PDF…" : "📄 Export PDF"}
          </button>
          <button type="button" className="parto-btn" onClick={saveSession}>
            💾 Enregistrer
          </button>
          <button type="button" className="parto-btn danger" onClick={resetAll}>
            ↺ Reset
          </button>
        </div>
      </header>

      <section className="parto-patient-card">
        <h2>👤 Identité patiente</h2>
        <div className="parto-patient-grid">
          <div className="parto-field">
            <label>Nom</label>
            <input
              value={patient.nom}
              onChange={(e) => patchPatient("nom", e.target.value)}
            />
          </div>
          <div className="parto-field">
            <label>Prénom</label>
            <input
              value={patient.prenom}
              onChange={(e) => patchPatient("prenom", e.target.value)}
            />
          </div>
          <div className="parto-field">
            <label>Âge</label>
            <input
              type="number"
              value={patient.age}
              onChange={(e) => patchPatient("age", e.target.value)}
            />
          </div>
          <div className="parto-field">
            <label>Parité</label>
            <select
              value={patient.parite}
              onChange={(e) => patchPatient("parite", e.target.value)}
            >
              <option value="0">P0 — Primipare</option>
              <option value="1">P1</option>
              <option value="2">P2</option>
              <option value="3">P3+</option>
            </select>
          </div>
          <div className="parto-field">
            <label>Terme (SA)</label>
            <input
              value={patient.terme}
              onChange={(e) => patchPatient("terme", e.target.value)}
            />
          </div>
          <div className="parto-field">
            <label>Début travail</label>
            <input
              type="datetime-local"
              value={patient.debut}
              onChange={(e) => patchPatient("debut", e.target.value)}
            />
          </div>
          <div className="parto-field">
            <label>Praticien</label>
            <input
              value={patient.praticien}
              onChange={(e) => patchPatient("praticien", e.target.value)}
            />
          </div>
          <div className="parto-field">
            <label>N° dossier</label>
            <div className="parto-dossier-id">{patient.dossierId}</div>
          </div>
        </div>
      </section>

      {canvasEntries.length > 0 ? (
        <div className="parto-alerts">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`parto-alert ${a.level}`}
              style={a.pulse ? { animation: "parto-pulse 1.2s infinite" } : undefined}
            >
              {a.text}
            </div>
          ))}
        </div>
      ) : null}

      <div className="parto-layout">
        <div className="parto-graph-panel">
          <div className="parto-info-strip">
            <span>
              <strong>Admission :</strong> {info.admission}
            </span>
            <span>
              <strong>Dilatation init. :</strong> {info.dilInit}
            </span>
            <span>
              <strong>Durée :</strong> {info.duree}
            </span>
            <span>
              <strong>Phase :</strong> {info.phase}
            </span>
          </div>
          <div className="parto-canvas-wrap" ref={wrapRef}>
            <canvas id="parto-canvas" ref={canvasRef} />
          </div>
          <div className="parto-legend">
            <span>
              <span className="parto-leg-dot" style={{ background: "#2563eb" }} />
              Dilatation
            </span>
            <span>
              <span className="parto-leg-dot" style={{ background: "#16a34a" }} />
              Descente
            </span>
            <span>
              <span className="parto-leg-dot" style={{ background: "#ea580c" }} />
              BCF
            </span>
            <span>
              <span className="parto-leg-dot" style={{ background: "#16a34a", opacity: 0.6 }} />
              Contractions
            </span>
            <span>LA : C M S A</span>
          </div>
          <div className={`parto-sim-running ${simActive ? "active" : ""}`}>
            <span className="parto-sim-dot" />
            <span>{simLabel}</span>
            <button
              type="button"
              className="parto-btn danger parto-no-print"
              style={{ marginLeft: "auto", padding: "2px 8px", fontSize: "0.65rem" }}
              onClick={simStop}
            >
              ⏹ Stop
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="parto-card parto-no-print">
            <h3>🎮 Mode simulation</h3>
            <div className="parto-sim-btns">
              <button
                type="button"
                className="parto-btn sim"
                onClick={() => simStart("normal")}
              >
                ▶ Travail normal
              </button>
              <button
                type="button"
                className="parto-btn sim"
                onClick={() => simStart("dystocie")}
              >
                ▶ Dystocie
              </button>
              <button
                type="button"
                className="parto-btn sim"
                onClick={() => simStart("precipite")}
              >
                ▶ Précipité
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
              <span>Vitesse :</span>
              {([1, 2, 5] as const).map((s) => (
                <label key={s} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="sim-speed"
                    checked={simSpeed === s}
                    onChange={() => setSimSpeed(s)}
                  />
                  x{s}
                </label>
              ))}
            </div>
          </div>

          <div className="parto-card parto-no-print">
            <h3>➕ Nouvelle observation</h3>
            <form className="parto-entry-form" onSubmit={addEntry}>
              <div className="parto-field">
                <label>Heure</label>
                <input
                  type="time"
                  required
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                />
              </div>
              <div className="parto-field">
                <label>Dilatation (cm)</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={eDil}
                  onChange={(e) => setEDil(e.target.value)}
                />
              </div>
              <div className="parto-field">
                <label>Présentation (/5)</label>
                <select value={eDesc} onChange={(e) => setEDesc(e.target.value)}>
                  <option value="">—</option>
                  {[5, 4, 3, 2, 1, 0].map((n) => (
                    <option key={n} value={n}>
                      {n}/5{n === 0 ? " engagé" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="parto-field">
                <label>BCF (/min)</label>
                <input
                  type="number"
                  min={60}
                  max={220}
                  value={eBcf}
                  onChange={(e) => setEBcf(e.target.value)}
                />
              </div>
              <div className="parto-field">
                <label>CX /10min</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={eCxNb}
                  onChange={(e) => setECxNb(e.target.value)}
                />
              </div>
              <div className="parto-field">
                <label>Durée CX (s)</label>
                <input
                  type="number"
                  value={eCxDur}
                  onChange={(e) => setECxDur(e.target.value)}
                />
              </div>
              <div className="parto-field">
                <label>Intensité</label>
                <select value={eCxInt} onChange={(e) => setECxInt(e.target.value)}>
                  <option value="">—</option>
                  <option value="1">Faible</option>
                  <option value="2">Modérée</option>
                  <option value="3">Forte</option>
                </select>
              </div>
              <div className="parto-field">
                <label>LA</label>
                <select value={eLa} onChange={(e) => setELa(e.target.value)}>
                  <option value="C">C — Clair</option>
                  <option value="M">M — Méconial</option>
                  <option value="S">S — Sanglant</option>
                  <option value="A">A — Absent</option>
                </select>
              </div>
              <div className="parto-field">
                <label>TA sys / dia</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="120"
                    value={eTas}
                    onChange={(e) => setETas(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="80"
                    value={eTad}
                    onChange={(e) => setETad(e.target.value)}
                  />
                </div>
              </div>
              <div className="parto-field">
                <label>Pouls</label>
                <input
                  type="number"
                  value={ePouls}
                  onChange={(e) => setEPouls(e.target.value)}
                />
              </div>
              <div className="parto-field">
                <label>T° (°C)</label>
                <input
                  type="number"
                  step={0.1}
                  value={eTemp}
                  onChange={(e) => setETemp(e.target.value)}
                />
              </div>
              <div className="parto-field">
                <label>Oxytocine</label>
                <input
                  type="number"
                  value={eOxyt}
                  onChange={(e) => setEOxyt(e.target.value)}
                />
              </div>
              <div className="parto-field">
                <label>Urines (mL/h)</label>
                <input
                  type="number"
                  value={eUrines}
                  onChange={(e) => setEUrines(e.target.value)}
                />
              </div>
              <div className="span2">
                <button type="submit" className="parto-btn primary w-full">
                  + Observation
                </button>
              </div>
            </form>
          </div>

          <div className="parto-card">
            <h3>📋 Suivi horaire</h3>
            <div className="parto-table-wrap">
              <table className="parto-table">
                <thead>
                  <tr>
                    <th>H</th>
                    <th>Dil</th>
                    <th>Desc</th>
                    <th>CX</th>
                    <th>BCF</th>
                    <th>LA</th>
                    <th>TA</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {points.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-[var(--muted)]">
                        Aucune observation
                      </td>
                    </tr>
                  ) : (
                    points.map((p) => (
                      <tr key={p.id ?? p.recordedAt}>
                        <td>{fmtTime(p.recordedAt)}</td>
                        <td>{p.dilatationCm ?? "—"}</td>
                        <td>
                          {p.descent != null ? p.descent + "/5" : "—"}
                        </td>
                        <td>
                          {p.cx != null
                            ? p.cx + (p.cxDur ? "/" + p.cxDur + "s" : "")
                            : "—"}
                        </td>
                        <td>{p.fcf ?? "—"}</td>
                        <td>{p.la ?? "—"}</td>
                        <td>
                          {p.taSys
                            ? p.taSys + "/" + (p.taDia ?? "?")
                            : "—"}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="parto-no-print text-red-600"
                            onClick={() => removePoint(p.id ?? p.recordedAt)}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {summary ? (
            <div className="parto-card parto-no-print">
              <h3>📋 Résumé clinique</h3>
              <textarea className="parto-summary" readOnly value={summary} />
              <button
                type="button"
                className="parto-btn mt-2"
                onClick={() => navigator.clipboard?.writeText(summary)}
              >
                Copier
              </button>
            </div>
          ) : null}

          {linkedSessions.length > 0 ? (
            <div className="parto-card parto-sessions parto-no-print">
              <h3>💾 Sessions enregistrées</h3>
              <ul>
                {linkedSessions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="text-left hover:text-[var(--teal)]"
                      onClick={() => loadSession(s)}
                    >
                      {s.patientName} — {s.points.length} obs. —{" "}
                      {new Date(s.updatedAt).toLocaleString("fr-FR")}
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-600"
                      onClick={() => {
                        if (confirm("Supprimer ?")) deletePartogram(s.id);
                      }}
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
