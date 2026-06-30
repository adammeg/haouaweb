"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import {
  ALL_PARAMS,
  formatGa,
  gaFromWeeksDays,
  genObsDossierId,
  PARAM_META,
} from "@/lib/growth-curves/constants";
import { computePfeFromBiometry } from "@/lib/growth-curves/hadlock-pfe";
import { drawGrowthChart, hitTestChart } from "@/lib/growth-curves/canvas";
import { estimatePercentile } from "@/lib/growth-curves/percentile-engine";
import { buildGrowthSummary } from "@/lib/growth-curves/summary";
import type { GrowthMeasure, GrowthParamKey } from "@/lib/growth-curves/types";

export type GrowthCurvesPanelProps = {
  embedded?: boolean;
  initialName?: string;
  initialTerme?: string;
  initialParite?: string;
  patientId?: string;
};

type PatientForm = {
  nom: string;
  prenom: string;
  terme: string;
  parite: string;
  praticien: string;
  dossierId: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Carte graphique individuelle avec tooltip */
function GrowthChartCard({
  paramKey,
  measures,
}: {
  paramKey: GrowthParamKey;
  measures: GrowthMeasure[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [width, setWidth] = useState(420);

  const chartPoints = useMemo(
    () =>
      measures
        .map((m) => {
          const val = m[paramKey];
          return val != null ? { ga: m.gaWeeks, value: val } : null;
        })
        .filter(Boolean) as Array<{ ga: number; value: number }>,
    [measures, paramKey],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawGrowthChart(canvas, {
      paramKey,
      measures: chartPoints,
      width,
      hoverIndex: hoverIdx,
    });
  }, [paramKey, chartPoints, width, hoverIdx]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const idx = hitTestChart(
      canvas,
      { paramKey, measures: chartPoints, width, hoverIndex: hoverIdx },
      e.clientX,
      e.clientY,
    );
    setHoverIdx(idx);
  };

  return (
    <div className="growth-chart-card" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        onMouseMove={onMove}
        onMouseLeave={() => setHoverIdx(null)}
      />
    </div>
  );
}

export function GrowthCurvesPanel({
  embedded = false,
  initialName = "",
  initialTerme = "",
  initialParite = "0",
}: GrowthCurvesPanelProps) {
  const parts = initialName.trim().split(/\s+/);
  const [patient, setPatient] = useState<PatientForm>(() => ({
    prenom: parts[0] ?? "",
    nom: parts.slice(1).join(" "),
    terme: initialTerme,
    parite: initialParite,
    praticien: "",
    dossierId: genObsDossierId(),
  }));

  const [measures, setMeasures] = useState<GrowthMeasure[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formulaire de saisie
  const [saWeeks, setSaWeeks] = useState("");
  const [saDays, setSaDays] = useState("0");
  const [dateEcho, setDateEcho] = useState(todayIso);
  const [fBip, setFBip] = useState("");
  const [fPc, setFPc] = useState("");
  const [fPa, setFPa] = useState("");
  const [fLf, setFLf] = useState("");
  const [fIla, setFIla] = useState("");

  const bipN = parseFloat(fBip) || 0;
  const paN = parseFloat(fPa) || 0;
  const lfN = parseFloat(fLf) || 0;
  const pcN = parseFloat(fPc) || 0;
  const autoPfe = computePfeFromBiometry(
    bipN || undefined,
    paN || undefined,
    lfN || undefined,
    pcN || undefined,
  );

  const gaPreview =
    saWeeks !== ""
      ? gaFromWeeksDays(parseInt(saWeeks, 10) || 0, parseInt(saDays, 10) || 0)
      : 0;

  const liveEstimates = useMemo(() => {
    if (!gaPreview) return [];
    const out: Array<{ key: GrowthParamKey; est: ReturnType<typeof estimatePercentile> }> = [];
    const fields: Array<[GrowthParamKey, number]> = [
      ["bip", bipN],
      ["pc", pcN],
      ["pa", paN],
      ["lf", lfN],
      ["ila", parseFloat(fIla) || 0],
    ];
    if (autoPfe) fields.push(["pfe", autoPfe]);
    for (const [key, val] of fields) {
      if (!val) continue;
      const est = estimatePercentile(key, gaPreview, val);
      if (est) out.push({ key, est });
    }
    return out;
  }, [gaPreview, bipN, pcN, paN, lfN, fIla, autoPfe]);

  const synthesis = useMemo(() => buildGrowthSummary(measures), [measures]);

  const latestByParam = useMemo(() => {
    const sorted = [...measures].sort((a, b) => b.gaWeeks - a.gaWeeks);
    const latest = sorted[0];
    if (!latest) return {} as Partial<Record<GrowthParamKey, ReturnType<typeof estimatePercentile>>>;
    const out: Partial<Record<GrowthParamKey, ReturnType<typeof estimatePercentile>>> = {};
    for (const key of ALL_PARAMS) {
      const val = latest[key];
      if (val != null) {
        out[key] = estimatePercentile(key, latest.gaWeeks, val) ?? undefined;
      }
    }
    return out;
  }, [measures]);

  const resetForm = () => {
    setSaWeeks("");
    setSaDays("0");
    setDateEcho(todayIso());
    setFBip("");
    setFPc("");
    setFPa("");
    setFLf("");
    setFIla("");
    setEditingId(null);
  };

  const addOrUpdateMeasure = () => {
    const w = parseInt(saWeeks, 10);
    if (!w || w < 14 || w > 42) return;
    const ga = gaFromWeeksDays(w, parseInt(saDays, 10) || 0);
    const pfe = autoPfe ?? undefined;
    const entry: GrowthMeasure = {
      id: editingId ?? "m_" + nanoid(8),
      gaWeeks: ga,
      dateEcho,
      bip: bipN || undefined,
      pc: pcN || undefined,
      pa: paN || undefined,
      lf: lfN || undefined,
      pfe,
      ila: parseFloat(fIla) || undefined,
    };
    if (editingId) {
      setMeasures((prev) => prev.map((m) => (m.id === editingId ? entry : m)));
    } else {
      setMeasures((prev) => [...prev, entry].sort((a, b) => a.gaWeeks - b.gaWeeks));
    }
    resetForm();
  };

  const editMeasure = (m: GrowthMeasure) => {
    const w = Math.floor(m.gaWeeks);
    const d = Math.round((m.gaWeeks - w) * 7);
    setSaWeeks(String(w));
    setSaDays(String(d));
    setDateEcho(m.dateEcho);
    setFBip(m.bip != null ? String(m.bip) : "");
    setFPc(m.pc != null ? String(m.pc) : "");
    setFPa(m.pa != null ? String(m.pa) : "");
    setFLf(m.lf != null ? String(m.lf) : "");
    setFIla(m.ila != null ? String(m.ila) : "");
    setEditingId(m.id);
  };

  const deleteMeasure = (id: string) => {
    setMeasures((prev) => prev.filter((m) => m.id !== id));
    if (editingId === id) resetForm();
  };

  const handlePrint = () => window.print();

  return (
    <div className={"growth-root" + (embedded ? " embedded" : "")}>
      <header className="growth-page-header">
        <h1>Courbes de croissance fœtale</h1>
        <p>
          INTERGROWTH-21st 2016 · Hadlock 1985 (PFE) · Moore 1990 (ILA)
        </p>
        <div className="growth-header-actions growth-no-print">
          <button type="button" className="growth-btn growth-btn-gold" onClick={handlePrint}>
            Imprimer rapport
          </button>
        </div>
      </header>

      {/* En-tête patient */}
      <section className="growth-patient-card">
        <h2>Patiente</h2>
        <div className="growth-patient-grid">
          <div className="growth-field">
            <label>Prénom</label>
            <input
              value={patient.prenom}
              onChange={(e) => setPatient((p) => ({ ...p, prenom: e.target.value }))}
              placeholder="Prénom"
            />
          </div>
          <div className="growth-field">
            <label>Nom</label>
            <input
              value={patient.nom}
              onChange={(e) => setPatient((p) => ({ ...p, nom: e.target.value }))}
              placeholder="Nom"
            />
          </div>
          <div className="growth-field">
            <label>Terme théorique</label>
            <input
              value={patient.terme}
              onChange={(e) => setPatient((p) => ({ ...p, terme: e.target.value }))}
              placeholder="DDR / DG"
            />
          </div>
          <div className="growth-field">
            <label>Parité</label>
            <input
              value={patient.parite}
              onChange={(e) => setPatient((p) => ({ ...p, parite: e.target.value }))}
            />
          </div>
          <div className="growth-field">
            <label>Praticien</label>
            <input
              value={patient.praticien}
              onChange={(e) => setPatient((p) => ({ ...p, praticien: e.target.value }))}
            />
          </div>
          <div className="growth-field">
            <label>N° dossier</label>
            <div className="growth-dossier-id">{patient.dossierId}</div>
          </div>
        </div>
      </section>

      {/* Saisie mesures */}
      <section className="growth-entry-card growth-no-print">
        <h2>{editingId ? "Modifier l'échographie" : "Nouvelle mesure"}</h2>
        <div className="growth-entry-grid">
          <div className="growth-field">
            <label>SA (sem.)</label>
            <input
              type="number"
              min={14}
              max={42}
              value={saWeeks}
              onChange={(e) => setSaWeeks(e.target.value)}
              placeholder="32"
            />
          </div>
          <div className="growth-field">
            <label>Jours</label>
            <input
              type="number"
              min={0}
              max={6}
              value={saDays}
              onChange={(e) => setSaDays(e.target.value)}
            />
          </div>
          <div className="growth-field growth-field-wide">
            <label>Date écho</label>
            <input
              type="date"
              value={dateEcho}
              onChange={(e) => setDateEcho(e.target.value)}
            />
          </div>
          <div className="growth-field">
            <label>BIP (mm)</label>
            <input type="number" step="0.1" value={fBip} onChange={(e) => setFBip(e.target.value)} />
          </div>
          <div className="growth-field">
            <label>PC (mm)</label>
            <input type="number" step="0.1" value={fPc} onChange={(e) => setFPc(e.target.value)} />
          </div>
          <div className="growth-field">
            <label>PA (mm)</label>
            <input type="number" step="0.1" value={fPa} onChange={(e) => setFPa(e.target.value)} />
          </div>
          <div className="growth-field">
            <label>LF (mm)</label>
            <input type="number" step="0.1" value={fLf} onChange={(e) => setFLf(e.target.value)} />
          </div>
          <div className="growth-field">
            <label>ILA (cm)</label>
            <input type="number" step="0.1" value={fIla} onChange={(e) => setFIla(e.target.value)} />
          </div>
        </div>

        {autoPfe ? (
          <div className="growth-pfe-preview">
            PFE estimé (Hadlock) : <strong>{autoPfe} g</strong>
          </div>
        ) : null}

        {liveEstimates.length > 0 ? (
          <div className="growth-live-pct">
            {liveEstimates.map(({ key, est }) =>
              est ? (
                <span key={key} style={{ color: est.color }}>
                  {est.icon} {PARAM_META[key].shortLabel} : {est.label}
                </span>
              ) : null,
            )}
          </div>
        ) : null}

        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
          <button type="button" className="growth-btn growth-btn-primary" onClick={addOrUpdateMeasure}>
            {editingId ? "Mettre à jour" : "+ Ajouter mesure"}
          </button>
          {editingId ? (
            <button type="button" className="growth-btn growth-btn-secondary" onClick={resetForm}>
              Annuler
            </button>
          ) : null}
        </div>
      </section>

      {/* Dashboard résumé */}
      {measures.length > 0 ? (
        <>
          <div className="growth-synthesis">
            <strong>Synthèse :</strong> {synthesis}
          </div>

          <div className="growth-dashboard">
            {ALL_PARAMS.map((key) => {
              const est = latestByParam[key];
              const meta = PARAM_META[key];
              return (
                <div key={key} className="growth-dash-card">
                  <div className="dash-label">{meta.shortLabel}</div>
                  <div className="dash-value" style={{ color: est?.color ?? "#9ca3af" }}>
                    {est ? `P${est.percentile}` : "—"}
                  </div>
                  <div className="dash-pct" style={{ color: est?.color ?? "#9ca3af" }}>
                    {est ? est.icon + " " + est.label.split("(")[0].trim() : "Non mesuré"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tableau récapitulatif */}
          <div className="growth-table-wrap growth-no-print">
            <table className="growth-table">
              <thead>
                <tr>
                  <th>SA</th>
                  <th>Date</th>
                  <th>BIP</th>
                  <th>PC</th>
                  <th>PA</th>
                  <th>LF</th>
                  <th>PFE</th>
                  <th>ILA</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {measures.map((m) => (
                  <tr key={m.id}>
                    <td>{formatGa(m.gaWeeks)}</td>
                    <td>{m.dateEcho}</td>
                    {(["bip", "pc", "pa", "lf", "pfe", "ila"] as GrowthParamKey[]).map((k) => {
                      const val = m[k];
                      const est =
                        val != null ? estimatePercentile(k, m.gaWeeks, val) : null;
                      return (
                        <td key={k}>
                          {val != null ? (
                            <>
                              {val}
                              {est ? (
                                <span
                                  className="pct-badge"
                                  style={{
                                    marginLeft: 4,
                                    color: est.color,
                                    background: est.color + "18",
                                  }}
                                >
                                  P{est.percentile}
                                </span>
                              ) : null}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    })}
                    <td>
                      <button
                        type="button"
                        className="growth-btn growth-btn-secondary"
                        style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}
                        onClick={() => editMeasure(m)}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="growth-btn growth-btn-secondary"
                        style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", marginLeft: 4 }}
                        onClick={() => deleteMeasure(m.id)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {/* Grille graphiques 2×3 */}
      <div className="growth-charts-grid">
        {ALL_PARAMS.map((key) => (
          <GrowthChartCard key={key} paramKey={key} measures={measures} />
        ))}
      </div>

      {/* En-tête impression */}
      <div className="hidden print:block" style={{ marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.85rem" }}>
          {patient.prenom} {patient.nom} · {patient.dossierId} · {patient.praticien} ·{" "}
          {new Date().toLocaleDateString("fr-FR")}
        </p>
      </div>
    </div>
  );
}
