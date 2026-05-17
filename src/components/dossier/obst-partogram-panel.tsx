"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import type { PatientSnapshot } from "@/types/domain";
import { dossierDisplayName } from "@/lib/dossier/patient-meta";
import { analyzePartogram, PARTO_ALERT_HOURS, PARTO_ACTION_HOURS } from "@/lib/partogram/analysis";
import { exportPartogramPdf } from "@/lib/partogram/pdf";
import { useModulesStore, useModulesWorkspace } from "@/stores/modules-store";
import type { PartogramPoint, PartogramSession } from "@/types/modules";
import { AnaCard } from "@/components/dossier/anamnese-shared";

export function ObstPartogramPanel({ draft }: { draft: PatientSnapshot }) {
  const ws = useModulesWorkspace();
  const savePartogram = useModulesStore((s) => s.savePartogram);
  const deletePartogram = useModulesStore((s) => s.deletePartogram);

  const patientName = dossierDisplayName(draft);
  const linked = useMemo(
    () => ws.partograms.filter((p) => p.patientId === draft.id),
    [ws.partograms, draft.id],
  );

  const [sessionId, setSessionId] = useState(() => "parto_" + nanoid(8));
  const [name, setName] = useState(patientName);
  const [admission, setAdmission] = useState(
    () => new Date().toISOString().slice(0, 16),
  );
  const [points, setPoints] = useState<PartogramPoint[]>([]);
  const [dil, setDil] = useState("");
  const [descent, setDescent] = useState("");
  const [fcf, setFcf] = useState("");
  const [taSys, setTaSys] = useState("");
  const [taDia, setTaDia] = useState("");
  const [oxytocine, setOxytocine] = useState("");
  const [la, setLa] = useState("N");
  const [pdfBusy, setPdfBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const liveSession: PartogramSession = useMemo(
    () => ({
      id: sessionId,
      patientId: draft.id,
      patientName: name.trim() || patientName,
      admissionAt: admission,
      ddr: draft.o_ddr,
      termeSa: draft.o_terme,
      points,
      events: [],
      updatedAt: new Date().toISOString(),
    }),
    [sessionId, draft.id, draft.o_ddr, draft.o_terme, name, patientName, admission, points],
  );

  const analysis = analyzePartogram(liveSession);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const padL = 48;
    const padR = 24;
    const padT = 36;
    const padB = 32;
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, w, h);

    const maxH = Math.max(12, points.length || 1);
    const xScale = (hour: number) => padL + (hour / maxH) * (w - padL - padR);
    const yScale = (cm: number) => padT + ((10 - cm) / 10) * (h - padT - padB);

    for (let cm = 0; cm <= 10; cm += 2) {
      const y = yScale(cm);
      ctx.strokeStyle = "#e5e7eb";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#6b7280";
      ctx.font = "10px Arial";
      ctx.fillText(String(cm), 8, y + 4);
    }

    if (points.length > 0) {
      const sorted = [...points].sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      );
      const first = sorted[0]!;
      const initDil = Math.max(4, first.dilatationCm ?? 4);

      const drawLine = (color: string, dash: number[], fn: (hr: number) => number) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash(dash);
        ctx.beginPath();
        for (let hr = 0; hr <= maxH; hr++) {
          const y = yScale(fn(hr));
          const x = xScale(hr);
          if (hr === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      };

      drawLine("#16a34a", [], (hr) => initDil + hr);
      drawLine("#d97706", [6, 4], (hr) => initDil + Math.max(0, hr - PARTO_ALERT_HOURS));
      drawLine("#dc2626", [], (hr) => initDil + Math.max(0, hr - PARTO_ACTION_HOURS));

      sorted.forEach((pt) => {
        if (pt.dilatationCm == null) return;
        const x = xScale(pt.hoursFromAdmission);
        const y = yScale(pt.dilatationCm);
        ctx.fillStyle = "#0a5c5c";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.fillStyle = "#0a5c5c";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Partogramme OMS — Dilatation (cm)", w / 2, 18);
    ctx.textAlign = "left";
  }, [points]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    setName(patientName);
  }, [patientName]);

  function addPoint() {
    const h = points.length;
    setPoints([
      ...points,
      {
        recordedAt: new Date().toISOString(),
        hoursFromAdmission: h,
        dilatationCm: dil ? parseFloat(dil) : undefined,
        descent: descent ? parseFloat(descent) : undefined,
        fcf: fcf ? parseInt(fcf, 10) : undefined,
        taSys: taSys ? parseInt(taSys, 10) : undefined,
        taDia: taDia ? parseInt(taDia, 10) : undefined,
        oxytocine: oxytocine ? parseFloat(oxytocine) : undefined,
        la,
      },
    ]);
    setDil("");
    setDescent("");
    setFcf("");
  }

  function save() {
    savePartogram({
      ...liveSession,
      patientId: draft.id,
      patientName: name.trim() || patientName,
      updatedAt: new Date().toISOString(),
    });
    setSessionId("parto_" + nanoid(8));
    setPoints([]);
  }

  function loadSession(s: PartogramSession) {
    setSessionId(s.id);
    setName(s.patientName);
    setAdmission(s.admissionAt.slice(0, 16));
    setPoints(s.points);
  }

  async function exportPdf() {
    if (!points.length) return;
    setPdfBusy(true);
    try {
      drawCanvas();
      const png = canvasRef.current?.toDataURL("image/png") ?? null;
      await exportPartogramPdf(liveSession, png);
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <AnaCard title="📈 Partogramme OMS" ar="مخطط الولادة">
      <p className="obst-cal-hint">
        Surveillance du travail selon les courbes OMS (alerte +{PARTO_ALERT_HOURS}h,
        action +{PARTO_ACTION_HOURS}h). Lié au dossier :{" "}
        <strong>{patientName}</strong>
        {draft.o_terme ? ` · ${draft.o_terme}` : ""}
        {draft.o_ddr ? ` · DDR ${draft.o_ddr}` : ""}.
      </p>

      <div
        className="obst-parto-decision"
        style={{
          borderColor: analysis.decisionColor + "55",
          background: analysis.decisionColor + "12",
          color: analysis.decisionColor,
        }}
      >
        {analysis.decision}
      </div>

      <div className="obst-parto-form">
        <label>
          <span>Patiente</span>
          <input
            className="hawae-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          <span>Admission</span>
          <input
            type="datetime-local"
            className="hawae-input"
            value={admission}
            onChange={(e) => setAdmission(e.target.value)}
          />
        </label>
        <label>
          <span>Dilatation (cm)</span>
          <input
            type="number"
            className="hawae-input"
            value={dil}
            onChange={(e) => setDil(e.target.value)}
          />
        </label>
        <label>
          <span>Descente</span>
          <input
            type="number"
            className="hawae-input"
            value={descent}
            onChange={(e) => setDescent(e.target.value)}
          />
        </label>
        <label>
          <span>FCF</span>
          <input
            type="number"
            className="hawae-input"
            value={fcf}
            onChange={(e) => setFcf(e.target.value)}
          />
        </label>
        <label>
          <span>TA sys / dia</span>
          <div className="obst-parto-ta-row">
            <input
              type="number"
              className="hawae-input"
              placeholder="120"
              value={taSys}
              onChange={(e) => setTaSys(e.target.value)}
            />
            <input
              type="number"
              className="hawae-input"
              placeholder="80"
              value={taDia}
              onChange={(e) => setTaDia(e.target.value)}
            />
          </div>
        </label>
        <label>
          <span>LA</span>
          <select
            className="hawae-input"
            value={la}
            onChange={(e) => setLa(e.target.value)}
          >
            <option value="N">Normal</option>
            <option value="C">Clair</option>
            <option value="M">Méconial</option>
            <option value="S">Sanguinolent</option>
          </select>
        </label>
        <label>
          <span>Oxytocine (mUI/min)</span>
          <input
            type="number"
            className="hawae-input"
            value={oxytocine}
            onChange={(e) => setOxytocine(e.target.value)}
          />
        </label>
      </div>

      <div className="obst-parto-actions">
        <button type="button" className="obst-parto-btn" onClick={addPoint}>
          + Point horaire
        </button>
        <button type="button" className="obst-parto-btn secondary" onClick={save}>
          💾 Enregistrer
        </button>
        <button
          type="button"
          className="obst-parto-btn secondary"
          disabled={!points.length || pdfBusy}
          onClick={exportPdf}
        >
          📄 PDF
        </button>
        <Link href="/partogramme" className="obst-parto-btn link">
          Ouvrir plein écran →
        </Link>
      </div>

      <div className="obst-parto-canvas-wrap">
        <canvas ref={canvasRef} width={720} height={280} className="obst-parto-canvas" />
      </div>

      {linked.length > 0 && (
        <div className="obst-parto-history">
          <h4>Partogrammes enregistrés (cette patiente)</h4>
          <ul>
            {linked.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => loadSession(p)}>
                  {p.patientName} — {new Date(p.updatedAt).toLocaleString("fr-FR")} (
                  {p.points.length} pts)
                </button>
                <button
                  type="button"
                  className="obst-parto-del"
                  onClick={() => {
                    if (confirm("Supprimer ce partogramme ?")) deletePartogram(p.id);
                  }}
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AnaCard>
  );
}
