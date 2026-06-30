/**
 * Moteur de rendu Canvas HTML5 — courbes de croissance fœtale.
 * 5 courbes de percentiles + zones colorées + points patient.
 */

import { COLORS, PARAM_META } from "./constants";
import { buildCurveSeries } from "./interpolate";
import { INTERGROWTH_TABLES } from "./intergrowth-data";
import { MOORE_ILA } from "./ila-moore";
import { estimatePercentile } from "./percentile-engine";
import type { ChartPoint, GrowthParamKey, IgPercentiles } from "./types";

export type GrowthChartOptions = {
  paramKey: GrowthParamKey;
  /** Points mesurés du patient */
  measures: ChartPoint[];
  /** Largeur conteneur (px) */
  width?: number;
  /** Hauteur (px) */
  height?: number;
  /** Point survolé (index dans measures) */
  hoverIndex?: number | null;
};

export type HitTestResult = {
  index: number;
  ga: number;
  value: number;
  percentile: number;
  label: string;
};

const PAD_L = 48;
const PAD_R = 16;
const PAD_T = 28;
const PAD_B = 36;

function getTable(key: GrowthParamKey): Record<number, IgPercentiles> {
  if (key === "ila") return MOORE_ILA;
  return INTERGROWTH_TABLES[key];
}

/** Dessine un graphique de croissance sur le canvas */
export function drawGrowthChart(
  canvas: HTMLCanvasElement,
  opts: GrowthChartOptions,
): void {
  const meta = PARAM_META[opts.paramKey];
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const displayW = opts.width ?? canvas.parentElement?.clientWidth ?? 420;
  const displayH = opts.height ?? 260;

  canvas.style.width = displayW + "px";
  canvas.style.height = displayH + "px";
  canvas.width = displayW * dpr;
  canvas.height = displayH * dpr;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = displayW;
  const H = displayH;
  ctx.clearRect(0, 0, W, H);

  const gaMin = meta.gaMin;
  const gaMax = meta.gaMax;
  const gW = W - PAD_L - PAD_R;
  const gH = H - PAD_T - PAD_B;

  const series = buildCurveSeries(getTable(opts.paramKey), gaMin, gaMax, 0.5);

  // Échelle Y : min/max des percentiles + points patient
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const s of series) {
    yMin = Math.min(yMin, s.p3);
    yMax = Math.max(yMax, s.p97);
  }
  for (const m of opts.measures) {
    yMin = Math.min(yMin, m.value);
    yMax = Math.max(yMax, m.value);
  }
  const yPad = (yMax - yMin) * 0.08 || 5;
  yMin -= yPad;
  yMax += yPad;

  const xScale = (ga: number) => PAD_L + ((ga - gaMin) / (gaMax - gaMin)) * gW;
  const yScale = (v: number) => PAD_T + gH - ((v - yMin) / (yMax - yMin || 1)) * gH;

  // Fond
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  // Grille verticale (tous les 2 SA)
  ctx.strokeStyle = "#e8e8e4";
  ctx.lineWidth = 1;
  for (let ga = gaMin; ga <= gaMax; ga += 2) {
    const x = xScale(ga);
    ctx.beginPath();
    ctx.moveTo(x, PAD_T);
    ctx.lineTo(x, PAD_T + gH);
    ctx.stroke();
  }

  // Grille horizontale
  const yTicks = 5;
  ctx.font = "9px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#9ca3af";
  ctx.textAlign = "right";
  for (let i = 0; i <= yTicks; i++) {
    const v = yMin + (i / yTicks) * (yMax - yMin);
    const y = yScale(v);
    ctx.beginPath();
    ctx.moveTo(PAD_L, y);
    ctx.lineTo(PAD_L + gW, y);
    ctx.strokeStyle = "#ececea";
    ctx.stroke();
    ctx.fillText(
      meta.unit === "g" ? Math.round(v).toString() : v.toFixed(0),
      PAD_L - 4,
      y + 3,
    );
  }

  // Zones de remplissage entre percentiles
  fillZone(ctx, series, xScale, yScale, "p10", "p90", COLORS.zoneNormal);
  fillZone(ctx, series, xScale, yScale, "p3", "p10", COLORS.zoneAttention);
  fillZone(ctx, series, xScale, yScale, "p90", "p97", COLORS.zoneAttention);

  // Courbes percentiles
  drawPercentileLine(ctx, series, xScale, yScale, "p3", COLORS.gold, [3, 3], 1);
  drawPercentileLine(ctx, series, xScale, yScale, "p97", COLORS.gold, [3, 3], 1);
  drawPercentileLine(ctx, series, xScale, yScale, "p10", COLORS.tealLight, [5, 4], 1.2);
  drawPercentileLine(ctx, series, xScale, yScale, "p90", COLORS.tealLight, [5, 4], 1.2);
  drawPercentileLine(ctx, series, xScale, yScale, "p50", COLORS.teal, [], 2.5);

  // Points patient + ligne de suivi
  const pts = opts.measures
    .filter((m) => m.ga >= gaMin && m.ga <= gaMax)
    .sort((a, b) => a.ga - b.ga);

  if (pts.length > 1) {
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(xScale(pts[0]!.ga), yScale(pts[0]!.value));
    pts.slice(1).forEach((p) => ctx.lineTo(xScale(p.ga), yScale(p.value)));
    ctx.stroke();
  }

  pts.forEach((p, i) => {
    const x = xScale(p.ga);
    const y = yScale(p.value);
    const isHover = opts.hoverIndex === i;
    ctx.beginPath();
    ctx.arc(x, y, isHover ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.gold;
    ctx.fill();
    ctx.strokeStyle = COLORS.tealDeep;
    ctx.lineWidth = isHover ? 2.5 : 2;
    ctx.stroke();
  });

  // Axes labels
  ctx.fillStyle = "#374151";
  ctx.textAlign = "center";
  ctx.font = "9px Inter, system-ui, sans-serif";
  for (let ga = gaMin; ga <= gaMax; ga += 2) {
    ctx.fillText(String(ga), xScale(ga), H - 8);
  }
  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.fillStyle = COLORS.tealDeep;
  ctx.fillText("Âge gestationnel (SA)", PAD_L + gW / 2, H - 22);

  // Titre + légende
  ctx.font = "600 11px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.tealDeep;
  ctx.fillText(`${meta.shortLabel} (${meta.unit})`, PAD_L, 16);

  drawLegend(ctx, PAD_L + gW - 130, 8);

  // Tooltip au survol
  if (opts.hoverIndex != null && pts[opts.hoverIndex]) {
    const p = pts[opts.hoverIndex]!;
    const est = estimatePercentile(opts.paramKey, p.ga, p.value);
    const txt = est
      ? `${p.ga.toFixed(1)} SA — ${p.value} ${meta.unit} — ${est.label}`
      : `${p.ga.toFixed(1)} SA — ${p.value} ${meta.unit}`;
    drawTooltip(ctx, xScale(p.ga), yScale(p.value), txt, W);
  }
}

function fillZone(
  ctx: CanvasRenderingContext2D,
  series: Array<{ ga: number } & IgPercentiles>,
  xScale: (ga: number) => number,
  yScale: (v: number) => number,
  lowKey: keyof IgPercentiles,
  highKey: keyof IgPercentiles,
  color: string,
): void {
  if (series.length < 2) return;
  ctx.beginPath();
  series.forEach((s, i) => {
    const x = xScale(s.ga);
    const y = yScale(s[highKey]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  for (let i = series.length - 1; i >= 0; i--) {
    ctx.lineTo(xScale(series[i]!.ga), yScale(series[i]![lowKey]));
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawPercentileLine(
  ctx: CanvasRenderingContext2D,
  series: Array<{ ga: number } & IgPercentiles>,
  xScale: (ga: number) => number,
  yScale: (v: number) => number,
  key: keyof IgPercentiles,
  color: string,
  dash: number[],
  width: number,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  series.forEach((s, i) => {
    const x = xScale(s.ga);
    const y = yScale(s[key]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const items: Array<{ color: string; dash: number[]; label: string }> = [
    { color: COLORS.teal, dash: [], label: "P50" },
    { color: COLORS.tealLight, dash: [4, 3], label: "P10/P90" },
    { color: COLORS.gold, dash: [3, 3], label: "P3/P97" },
  ];
  ctx.font = "8px Inter, system-ui, sans-serif";
  items.forEach((it, i) => {
    const ly = y + i * 12;
    ctx.strokeStyle = it.color;
    ctx.lineWidth = i === 0 ? 2 : 1;
    ctx.setLineDash(it.dash);
    ctx.beginPath();
    ctx.moveTo(x, ly + 4);
    ctx.lineTo(x + 18, ly + 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "left";
    ctx.fillText(it.label, x + 22, ly + 7);
  });
}

function drawTooltip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  maxW: number,
): void {
  ctx.font = "10px Inter, system-ui, sans-serif";
  const tw = ctx.measureText(text).width + 16;
  let tx = x + 12;
  let ty = y - 28;
  if (tx + tw > maxW - 8) tx = x - tw - 12;
  if (ty < 4) ty = y + 16;

  ctx.fillStyle = "rgba(10, 92, 92, 0.92)";
  roundRect(ctx, tx, ty, tw, 22, 6);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.fillText(text, tx + 8, ty + 14);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Détecte le point patient le plus proche du curseur */
export function hitTestChart(
  canvas: HTMLCanvasElement,
  opts: GrowthChartOptions,
  clientX: number,
  clientY: number,
): number | null {
  const rect = canvas.getBoundingClientRect();
  const mx = clientX - rect.left;
  const my = clientY - rect.top;
  const meta = PARAM_META[opts.paramKey];
  const gaMin = meta.gaMin;
  const gaMax = meta.gaMax;
  const W = rect.width;
  const H = rect.height;
  const gW = W - PAD_L - PAD_R;
  const gH = H - PAD_T - PAD_B;

  const series = buildCurveSeries(getTable(opts.paramKey), gaMin, gaMax, 0.5);
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const s of series) {
    yMin = Math.min(yMin, s.p3);
    yMax = Math.max(yMax, s.p97);
  }
  for (const m of opts.measures) {
    yMin = Math.min(yMin, m.value);
    yMax = Math.max(yMax, m.value);
  }
  const yPad = (yMax - yMin) * 0.08 || 5;
  yMin -= yPad;
  yMax += yPad;

  const xScale = (ga: number) => PAD_L + ((ga - gaMin) / (gaMax - gaMin)) * gW;
  const yScale = (v: number) => PAD_T + gH - ((v - yMin) / (yMax - yMin || 1)) * gH;

  let bestIdx: number | null = null;
  let bestDist = Infinity;
  opts.measures.forEach((m, i) => {
    const dx = mx - xScale(m.ga);
    const dy = my - yScale(m.value);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 16 && dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  });
  return bestIdx;
}
