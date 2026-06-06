"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";
import {
  ANALYTIC_CHIPS,
  filterByPeriod,
  matchAnalyticQuery,
  runAnalytic,
  type AnalyticChart,
  type AnalyticResult,
  type AnalyticType,
} from "@/lib/analytics/epid-analytics";

const PERIODS: { value: number | "all"; label: string }[] = [
  { value: 3, label: "3 mois" },
  { value: 6, label: "6 mois" },
  { value: 12, label: "12 mois" },
  { value: "all", label: "Tout" },
];

function drawBar(ctx: CanvasRenderingContext2D, chart: AnalyticChart, W: number, H: number) {
  const pad = { top: 34, right: 20, bottom: 56, left: 46 };
  const pw = W - pad.left - pad.right;
  const ph = H - pad.top - pad.bottom;
  const maxV = chart.maxOverride ?? Math.max(...chart.values, 1);
  const steps = 4;
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  for (let i = 0; i <= steps; i++) {
    const y = pad.top + i * (ph / steps);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + pw, y);
    ctx.stroke();
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px 'DM Sans',sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(String(Math.round(maxV * (1 - i / steps))), pad.left - 5, y + 4);
  }
  const n = chart.labels.length;
  const gap = pw / n;
  const barW = Math.min(gap * 0.6, 44);
  chart.values.forEach((v, i) => {
    const bh = maxV ? (v / maxV) * ph : 0;
    const x = pad.left + i * gap + gap / 2 - barW / 2;
    const y = pad.top + ph - bh;
    const col = chart.colors[i] || chart.colors[0];
    ctx.fillStyle = col;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, barW, bh, 4);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, barW, bh);
    }
    if (v > 0) {
      ctx.fillStyle = col;
      ctx.font = "bold 10px 'DM Sans',sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(v), x + barW / 2, y - 4);
    }
    ctx.save();
    const tx = pad.left + i * gap + gap / 2;
    const ty = pad.top + ph + 14;
    if (n > 6) {
      ctx.translate(tx, ty);
      ctx.rotate(-Math.PI / 5);
      ctx.font = "9px 'DM Sans',sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.textAlign = "right";
      ctx.fillText(chart.labels[i], 0, 0);
    } else {
      ctx.font = "10px 'DM Sans',sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.textAlign = "center";
      ctx.fillText(chart.labels[i], tx, ty);
    }
    ctx.restore();
  });
  if (chart.refLine) {
    const lineY = pad.top + ph - (chart.refLine.value / chart.refLine.max) * ph;
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, lineY);
    ctx.lineTo(pad.left + pw, lineY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 10px 'DM Sans',sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(chart.refLine.label, pad.left + pw - 4, lineY - 4);
  }
  if (chart.axisTitle) {
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 12px 'DM Sans',sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(chart.axisTitle, W / 2, 18);
  }
}

function drawLine(ctx: CanvasRenderingContext2D, chart: AnalyticChart, W: number, H: number) {
  const pad = { top: 40, right: 20, bottom: 40, left: 42 };
  const pw = W - pad.left - pad.right;
  const ph = H - pad.top - pad.bottom;
  const maxV = Math.max(...chart.values, 1);
  const n = chart.values.length;
  const gap = pw / n;
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + i * (ph / 4);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + pw, y);
    ctx.stroke();
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px 'DM Sans',sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(String(Math.round(maxV * (1 - i / 4))), pad.left - 5, y + 4);
  }
  const pt = (i: number, v: number) => ({
    x: pad.left + i * gap + gap / 2,
    y: pad.top + ph - (v / maxV) * ph,
  });
  ctx.beginPath();
  chart.values.forEach((v, i) => {
    const { x, y } = pt(i, v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  const last = pt(n - 1, chart.values[n - 1]);
  const first = pt(0, chart.values[0]);
  ctx.lineTo(last.x, pad.top + ph);
  ctx.lineTo(first.x, pad.top + ph);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ph);
  grad.addColorStop(0, "rgba(26,154,154,.4)");
  grad.addColorStop(1, "rgba(26,154,154,.02)");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = chart.colors[0];
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  chart.values.forEach((v, i) => {
    const { x, y } = pt(i, v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  chart.values.forEach((v, i) => {
    const { x, y } = pt(i, v);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = chart.colors[0];
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#6b7280";
    ctx.font = "9px 'DM Sans',sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(chart.labels[i], x, pad.top + ph + 14);
    if (v > 0) {
      ctx.fillStyle = chart.colors[0];
      ctx.font = "bold 9px 'DM Sans',sans-serif";
      ctx.fillText(String(v), x, y - 8);
    }
  });
  if (chart.axisTitle) {
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 12px 'DM Sans',sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(chart.axisTitle, W / 2, 20);
  }
}

function drawDonut(ctx: CanvasRenderingContext2D, chart: AnalyticChart, W: number, H: number) {
  const total = chart.values.reduce((a, b) => a + b, 0) || 1;
  const cx = W / 2;
  const cy = H / 2 - 10;
  const R = Math.min(W, H) / 2 - 50;
  let start = -Math.PI / 2;
  chart.values.forEach((v, i) => {
    if (!v) return;
    const slice = (v / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = chart.colors[i];
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();
    if (v / total > 0.05) {
      const mid = start + slice / 2;
      const lx = cx + Math.cos(mid) * (R * 0.65);
      const ly = cy + Math.sin(mid) * (R * 0.65);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px 'DM Sans',sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(Math.round((v / total) * 100) + "%", lx, ly + 4);
    }
    start += slice;
  });
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.fillStyle = "#1a1a2e";
  ctx.font = "bold 14px 'DM Sans',sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(total), cx, cy + 4);
  ctx.font = "10px 'DM Sans',sans-serif";
  ctx.fillStyle = "#9ca3af";
  ctx.fillText("dossiers", cx, cy + 18);
  const legY = H - 24;
  chart.labels.forEach((l, i) => {
    const lx = 16 + i * (W / chart.labels.length);
    ctx.fillStyle = chart.colors[i];
    ctx.fillRect(lx, legY, 10, 10);
    ctx.fillStyle = "#6b7280";
    ctx.font = "9px 'DM Sans',sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(l.length > 10 ? l.slice(0, 9) + "…" : l, lx + 13, legY + 9);
  });
}

function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function AnalyticsSearchPanel() {
  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });
  const allPatients = useMemo(() => Object.values(patientsMap), [patientsMap]);

  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<number | "all">("all");
  const [active, setActive] = useState<AnalyticType | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cohort = useMemo(
    () => filterByPeriod(allPatients, period),
    [allPatients, period],
  );

  const result: AnalyticResult | null = useMemo(
    () => (active ? runAnalytic(active, cohort) : null),
    [active, cohort],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result?.chart) return;
    const wrap = canvas.parentElement;
    if (!wrap) return;
    const H = result.chart.kind === "donut" ? 300 : result.chart.kind === "line" ? 280 : 300;
    const dpr = window.devicePixelRatio || 1;
    const W = wrap.clientWidth;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    if (result.chart.kind === "bar") drawBar(ctx, result.chart, W, H);
    else if (result.chart.kind === "line") drawLine(ctx, result.chart, W, H);
    else drawDonut(ctx, result.chart, W, H);
  }, [result]);

  const onSearch = (v: string) => {
    setQuery(v);
    const m = matchAnalyticQuery(v);
    if (m) setActive(m);
  };

  const exportCsv = () => {
    if (!result || !result.raw.length) return;
    const headers = Object.keys(result.raw[0]);
    const rows = result.raw.map((r) => headers.map((h) => `"${String(r[h] ?? "")}"`).join(","));
    download(`analytique_${result.type}.csv`, [headers.join(","), ...rows].join("\n"), "text/csv;charset=utf-8");
  };

  const exportJson = () => {
    if (!result) return;
    download(
      `analytique_${result.type}.json`,
      JSON.stringify({ title: result.title, period, n: cohort.length, data: result.raw }, null, 2),
      "application/json",
    );
  };

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-[var(--ink)]">
          🔬 Recherche analytique
        </h2>
        <div className="flex flex-wrap gap-1">
          {PERIODS.map((p) => (
            <button
              key={String(p.value)}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={
                "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors " +
                (period === p.value
                  ? "bg-[var(--teal)] text-white"
                  : "bg-[var(--cream)] text-[var(--muted)] hover:bg-[var(--teal-pale)]")
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Tapez une question ou choisissez une analyse — {cohort.length} patiente(s)
        dans la période.
      </p>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2">
        <span className="text-base">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="ex : pyramide des âges, top pathologies, IMC, HTA par âge…"
          className="w-full bg-transparent text-sm text-[var(--ink)] outline-none"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActive(null);
            }}
            className="text-[var(--muted)] hover:text-[var(--ink)]"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {ANALYTIC_CHIPS.map((c) => (
          <button
            key={c.type}
            type="button"
            onClick={() => setActive(c.type)}
            className={
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors " +
              (active === c.type
                ? "border-[var(--teal)] bg-[var(--teal-pale)] text-[var(--teal)]"
                : "border-[var(--border)] bg-white text-[var(--ink-mid)] hover:bg-[var(--teal-pale)]/40")
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {result && (
        <div className="mt-4 rounded-xl border border-[var(--border)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[var(--ink)]">{result.title}</h3>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={exportCsv}
                disabled={!result.raw.length}
                className="rounded-lg bg-[var(--teal)] px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
              >
                📥 CSV
              </button>
              <button
                type="button"
                onClick={exportJson}
                className="rounded-lg bg-[#374151] px-2.5 py-1 text-[11px] font-semibold text-white"
              >
                {"{ } JSON"}
              </button>
            </div>
          </div>

          {result.badges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.badges.map((b) => (
                <span
                  key={b}
                  className="rounded-full bg-[var(--teal-pale)] px-2 py-0.5 text-[11px] font-semibold text-[var(--teal)]"
                >
                  {b}
                </span>
              ))}
            </div>
          )}

          {result.chart ? (
            <div className="mt-3 w-full">
              <canvas ref={canvasRef} />
            </div>
          ) : null}

          <p
            className="mt-3 rounded-lg bg-[var(--cream)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-mid)]"
            dangerouslySetInnerHTML={{ __html: result.insight }}
          />
        </div>
      )}
    </section>
  );
}
