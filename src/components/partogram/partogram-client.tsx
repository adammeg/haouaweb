"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { useModulesStore, useModulesWorkspace } from "@/stores/modules-store";
import type { PartogramPoint, PartogramSession } from "@/types/modules";
import { analyzePartogram, PARTO_ALERT_HOURS, PARTO_ACTION_HOURS } from "@/lib/partogram/analysis";
import { exportPartogramPdf } from "@/lib/partogram/pdf";

export function PartogramClient() {
  const ws = useModulesWorkspace();
  const savePartogram = useModulesStore((s) => s.savePartogram);
  const deletePartogram = useModulesStore((s) => s.deletePartogram);

  const [sessionId, setSessionId] = useState(() => "parto_" + nanoid(8));
  const [name, setName] = useState("");
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

  const liveSession: PartogramSession = {
    id: sessionId,
    patientName: name.trim() || "Patiente",
    admissionAt: admission,
    points,
    events: [],
    updatedAt: new Date().toISOString(),
  };
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
    const xScale = (hour: number) =>
      padL + (hour / maxH) * (w - padL - padR);
    const yScale = (cm: number) =>
      padT + ((10 - cm) / 10) * (h - padT - padB);

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
      ctx.strokeStyle = "#16a34a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let hr = 0; hr <= maxH; hr++) {
        const y = yScale(initDil + hr);
        const x = xScale(hr);
        if (hr === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = "#d97706";
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      for (let hr = 0; hr <= maxH; hr++) {
        const y = yScale(initDil + Math.max(0, hr - PARTO_ALERT_HOURS));
        const x = xScale(hr);
        if (hr === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = "#dc2626";
      ctx.beginPath();
      for (let hr = 0; hr <= maxH; hr++) {
        const y = yScale(initDil + Math.max(0, hr - PARTO_ACTION_HOURS));
        const x = xScale(hr);
        if (hr === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      sorted.forEach((pt) => {
        if (pt.dilatationCm == null) return;
        const x = xScale(pt.hoursFromAdmission);
        const y = yScale(pt.dilatationCm);
        ctx.fillStyle = "#0a5c5c";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#374151";
        ctx.font = "9px Arial";
        ctx.fillText(String(pt.dilatationCm), x + 6, y - 4);
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

  function addPoint() {
    const now = new Date().toISOString();
    const h = points.length;
    setPoints([
      ...points,
      {
        recordedAt: now,
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
    setTimeout(drawCanvas, 0);
  }

  function save() {
    if (!name.trim()) return;
    savePartogram({
      ...liveSession,
      patientName: name.trim(),
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
    setTimeout(drawCanvas, 0);
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
    <div className="space-y-8">
      <header className="border-b border-[var(--border)] pb-6">
        <h1 className="font-display text-2xl font-bold">Partogramme OMS</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Lignes normale / alerte (+{PARTO_ALERT_HOURS}h) / action (+{PARTO_ACTION_HOURS}h) — export PDF.
        </p>
      </header>

      <div
        className="rounded-xl border p-4 text-sm font-medium"
        style={{
          borderColor: analysis.decisionColor + "55",
          background: analysis.decisionColor + "12",
          color: analysis.decisionColor,
        }}
      >
        {analysis.decision}
      </div>

      <div className="grid gap-4 rounded-2xl border bg-white p-6 lg:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Patiente</span>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Admission</span>
          <input
            type="datetime-local"
            className="w-full rounded-xl border px-3 py-2"
            value={admission}
            onChange={(e) => setAdmission(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">LA</span>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={la}
            onChange={(e) => setLa(e.target.value)}
          >
            <option value="N">Normal</option>
            <option value="C">Clair</option>
            <option value="M">Meconial</option>
            <option value="S">Sanguinolent</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Dilatation (cm)</span>
          <input
            type="number"
            className="w-full rounded-xl border px-3 py-2"
            value={dil}
            onChange={(e) => setDil(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Descente (plan)</span>
          <input
            type="number"
            className="w-full rounded-xl border px-3 py-2"
            value={descent}
            onChange={(e) => setDescent(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">FCF</span>
          <input
            type="number"
            className="w-full rounded-xl border px-3 py-2"
            value={fcf}
            onChange={(e) => setFcf(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">TA sys/dia</span>
          <div className="flex gap-2">
            <input
              type="number"
              className="w-full rounded-xl border px-3 py-2"
              placeholder="120"
              value={taSys}
              onChange={(e) => setTaSys(e.target.value)}
            />
            <input
              type="number"
              className="w-full rounded-xl border px-3 py-2"
              placeholder="80"
              value={taDia}
              onChange={(e) => setTaDia(e.target.value)}
            />
          </div>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Oxytocine (mU/min)</span>
          <input
            type="number"
            className="w-full rounded-xl border px-3 py-2"
            value={oxytocine}
            onChange={(e) => setOxytocine(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-end gap-2 lg:col-span-3">
          <button
            type="button"
            onClick={addPoint}
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
          >
            + Releve horaire
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-xl bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white"
          >
            Enregistrer
          </button>
          <button
            type="button"
            disabled={pdfBusy || !points.length}
            onClick={() => void exportPdf()}
            className="rounded-xl border border-[var(--teal)] px-4 py-2 text-sm font-semibold text-[var(--teal)] disabled:opacity-40"
          >
            {pdfBusy ? "PDF…" : "Export PDF"}
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={360}
        className="w-full max-w-4xl rounded-2xl border border-[var(--border)] bg-white shadow-sm"
      />

      <section>
        <h2 className="mb-3 font-bold">Sessions enregistrees</h2>
        <ul className="space-y-2">
          {ws.partograms.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white px-4 py-3 text-sm"
            >
              <button
                type="button"
                className="text-left font-medium hover:text-[var(--teal)]"
                onClick={() => loadSession(p)}
              >
                {p.patientName} — {p.points.length} releve(s)
              </button>
              <span className="flex gap-2">
                <button
                  type="button"
                  className="text-xs text-[var(--teal)]"
                  onClick={() => {
                    loadSession(p);
                    void exportPartogramPdf(p);
                  }}
                >
                  PDF
                </button>
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => deletePartogram(p.id)}
                >
                  Supprimer
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
