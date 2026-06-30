import {
  PARTO_ACTION_OFFSET_H,
  PARTO_ALERT_OFFSET_H,
  PARTO_MAX_HOURS,
} from "./constants";
import type { PartoCanvasEntry } from "./canvas-types";
import { toHoursFromFirst } from "./canvas-types";

function drawCurve(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  color: string,
  dash: number[],
  width: number,
) {
  if (pts.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawZoneA(
  ctx: CanvasRenderingContext2D,
  ml: number,
  gW: number,
  hA: number,
  yA: number,
  maxH: number,
  xScale: (t: number) => number,
  yDil: (d: number) => number,
  yDesc: (d: number) => number,
  initDil: number,
) {
  ctx.fillStyle = "rgba(244,214,218,0.25)";
  ctx.fillRect(ml, yA, xScale(4) - ml, hA);
  ctx.fillStyle = "rgba(209,250,229,0.35)";
  ctx.fillRect(xScale(4), yA, ml + gW - xScale(4), hA);

  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 1;
  ctx.strokeRect(ml, yA, gW, hA);

  for (let d = 0; d <= 10; d++) {
    const y = yDil(d);
    ctx.strokeStyle = d === 5 ? "rgba(220,38,38,0.12)" : "#ebebeb";
    ctx.lineWidth = d === 5 ? 1.2 : 0.6;
    ctx.beginPath();
    ctx.moveTo(ml, y);
    ctx.lineTo(ml + gW, y);
    ctx.stroke();
    ctx.fillStyle = "#4b5563";
    ctx.font = "9px Inter, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(d + " cm", ml - 5, y + 3);
  }

  for (let h = 0; h <= maxH; h++) {
    const x = xScale(h);
    ctx.strokeStyle = h % 4 === 0 ? "#d1d5db" : "#f3f4f6";
    ctx.lineWidth = h % 4 === 0 ? 0.7 : 0.35;
    ctx.beginPath();
    ctx.moveTo(x, yA);
    ctx.lineTo(x, yA + hA);
    ctx.stroke();
  }

  ctx.fillStyle = "#16a34a";
  ctx.textAlign = "left";
  ctx.font = "8px Inter, system-ui, sans-serif";
  [5, 4, 3, 2, 1, 0].forEach((d) => {
    ctx.fillText(d + "/5", ml + gW + 5, yDesc(d) + 3);
  });

  ctx.fillStyle = "rgba(100,116,139,0.65)";
  ctx.font = "bold 8px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("LATENTE", ml + (xScale(4) - ml) / 2, yA + 11);
  ctx.fillStyle = "rgba(22,163,74,0.7)";
  ctx.fillText("ACTIVE (4–10 cm)", xScale(4) + (gW - (xScale(4) - ml)) / 2, yA + 11);

  ctx.fillStyle = "#111827";
  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Dilatation cervicale & descente de la présentation", ml + 2, yA - 6);

  const omsPts: { x: number; y: number }[] = [];
  for (let d = initDil; d <= 10; d += 0.2) {
    const h = d - initDil;
    if (h <= maxH) omsPts.push({ x: xScale(h), y: yDil(d) });
  }

  const alertPts = omsPts
    .map((p) => ({
      x: p.x + (PARTO_ALERT_OFFSET_H / maxH) * gW,
      y: p.y,
    }))
    .filter((p) => p.x <= ml + gW);
  const actionPts = omsPts
    .map((p) => ({
      x: p.x + (PARTO_ACTION_OFFSET_H / maxH) * gW,
      y: p.y,
    }))
    .filter((p) => p.x <= ml + gW);

  drawCurve(ctx, omsPts, "rgba(10,92,92,0.4)", [], 1.3);
  drawCurve(ctx, alertPts, "rgba(220,38,38,0.75)", [7, 4], 2);
  drawCurve(ctx, actionPts, "rgba(220,38,38,0.9)", [], 2.2);

  if (alertPts.length) {
    ctx.fillStyle = "#dc2626";
    ctx.font = "bold 8px Inter, system-ui, sans-serif";
    ctx.fillText("⚠ ALERTE", alertPts[0]!.x + 3, alertPts[0]!.y - 5);
  }
  if (actionPts.length) {
    ctx.fillStyle = "#dc2626";
    ctx.fillText("🚨 ACTION", actionPts[0]!.x + 3, actionPts[0]!.y - 5);
  }
}

function drawZoneB(
  ctx: CanvasRenderingContext2D,
  ml: number,
  gW: number,
  hB: number,
  yB: number,
) {
  ctx.fillStyle = "#fafaf8";
  ctx.fillRect(ml, yB, gW, hB);
  ctx.strokeStyle = "#d1d5db";
  ctx.strokeRect(ml, yB, gW, hB);
  ctx.fillStyle = "#111827";
  ctx.font = "bold 9px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Contractions utérines (/10 min)", ml + 2, yB - 4);
  for (let n = 0; n <= 5; n++) {
    const y = yB + hB - (n / 5) * hB;
    ctx.strokeStyle = "#ebebeb";
    ctx.beginPath();
    ctx.moveTo(ml, y);
    ctx.lineTo(ml + gW, y);
    ctx.stroke();
    ctx.fillStyle = "#9ca3af";
    ctx.font = "8px Inter, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(String(n), ml - 4, y + 3);
  }
}

function drawZoneC(
  ctx: CanvasRenderingContext2D,
  ml: number,
  gW: number,
  hC: number,
  yC: number,
  yBCF: (b: number) => number,
) {
  ctx.fillStyle = "#fff7ed";
  ctx.fillRect(ml, yC, gW, hC);
  ctx.fillStyle = "rgba(234,88,12,0.08)";
  ctx.fillRect(ml, yBCF(160), gW, yBCF(110) - yBCF(160));
  ctx.strokeStyle = "#d1d5db";
  ctx.strokeRect(ml, yC, gW, hC);
  ctx.fillStyle = "#111827";
  ctx.font = "bold 9px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("BCF — rythme cardiaque fœtal (bpm)", ml + 2, yC - 4);
  [80, 110, 140, 160, 200].forEach((b) => {
    const y = yBCF(b);
    ctx.strokeStyle =
      b === 110 || b === 160 ? "rgba(234,88,12,0.3)" : "#ebebeb";
    ctx.beginPath();
    ctx.moveTo(ml, y);
    ctx.lineTo(ml + gW, y);
    ctx.stroke();
    ctx.fillStyle = "#9ca3af";
    ctx.font = "8px Inter, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(String(b), ml - 4, y + 3);
  });
  ctx.fillStyle = "rgba(234,88,12,0.5)";
  ctx.font = "7px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Zone normale 110–160", ml + 4, yBCF(155));
}

function plotZoneA(
  ctx: CanvasRenderingContext2D,
  entries: PartoCanvasEntry[],
  toH: (iso: string) => number,
  xScale: (t: number) => number,
  yDil: (d: number) => number,
  yDesc: (d: number) => number,
) {
  const dilPts: { x: number; y: number; v: number }[] = [];
  const descPts: { x: number; y: number }[] = [];
  entries.forEach((e) => {
    const x = xScale(toH(e.time));
    if (e.dil != null) dilPts.push({ x, y: yDil(e.dil), v: e.dil });
    if (e.desc != null) descPts.push({ x, y: yDesc(e.desc) });
  });

  if (dilPts.length > 1) {
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dilPts[0]!.x, dilPts[0]!.y);
    dilPts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
  }
  dilPts.forEach((p) => {
    ctx.fillStyle = "#2563eb";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#1e40af";
    ctx.font = "bold 8px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(String(p.v), p.x + 7, p.y - 3);
  });

  if (descPts.length > 1) {
    ctx.strokeStyle = "#16a34a";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(descPts[0]!.x, descPts[0]!.y);
    descPts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.setLineDash([]);
  }
  descPts.forEach((p) => {
    ctx.fillStyle = "#16a34a";
    ctx.beginPath();
    const s = 6;
    ctx.moveTo(p.x, p.y - s);
    ctx.lineTo(p.x - s * 0.85, p.y + s * 0.6);
    ctx.lineTo(p.x + s * 0.85, p.y + s * 0.6);
    ctx.closePath();
    ctx.fill();
  });

  entries.forEach((e) => {
    if (!e.la || e.dil == null) return;
    const x = xScale(toH(e.time));
    const y = yDil(e.dil) - 12;
    ctx.fillStyle =
      e.la === "M" ? "#dc2626" : e.la === "S" ? "#b91c1c" : "#0a5c5c";
    ctx.font = "bold 9px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(e.la, x, y);
  });
}

function plotZoneB(
  ctx: CanvasRenderingContext2D,
  entries: PartoCanvasEntry[],
  toH: (iso: string) => number,
  xScale: (t: number) => number,
  yB: number,
  hB: number,
  gW: number,
) {
  const barW = Math.max(8, (gW / PARTO_MAX_HOURS) * 0.6);
  const colors = ["#86efac", "#22c55e", "#15803d"];
  entries.forEach((e) => {
    if (e.cxNb == null) return;
    const x = xScale(toH(e.time)) - barW / 2;
    const h = (e.cxNb / 5) * hB * 0.85;
    ctx.fillStyle = colors[(e.cxInt ?? 2) - 1] ?? "#22c55e";
    ctx.fillRect(x, yB + hB - h, barW, h);
    if (e.cxDur) {
      ctx.fillStyle = "#374151";
      ctx.font = "7px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(e.cxDur + "s", x + barW / 2, yB + hB + 10);
    }
  });
}

function plotZoneC(
  ctx: CanvasRenderingContext2D,
  entries: PartoCanvasEntry[],
  toH: (iso: string) => number,
  xScale: (t: number) => number,
  yBCF: (b: number) => number,
) {
  const pts = entries
    .filter((e) => e.bcf != null)
    .map((e) => ({
      x: xScale(toH(e.time)),
      y: yBCF(e.bcf!),
      v: e.bcf!,
    }));
  if (pts.length > 1) {
    ctx.strokeStyle = "#ea580c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pts[0]!.x, pts[0]!.y);
    pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
  }
  pts.forEach((p) => {
    ctx.fillStyle = p.v < 110 || p.v > 160 ? "#dc2626" : "#ea580c";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** Dessine le partogramme OMS complet sur le canvas */
export function drawPartogramCanvas(
  canvas: HTMLCanvasElement,
  entries: PartoCanvasEntry[],
  containerWidth?: number,
): void {
  const wrapW = containerWidth ?? canvas.parentElement?.clientWidth ?? 900;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const displayW = Math.min(900, wrapW);
  const displayH = Math.round(displayW * (620 / 900));
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

  const ml = 52;
  const mr = 44;
  const mt = 20;
  const mb = 28;
  const gW = W - ml - mr;
  const totalH = H - mt - mb;
  const hA = Math.round(totalH * 0.52);
  const hB = Math.round(totalH * 0.26);
  const hC = totalH - hA - hB - 12;
  const yA = mt;
  const yB = yA + hA + 6;
  const yC = yB + hB + 6;
  const maxH = PARTO_MAX_HOURS;

  const xScale = (t: number) => ml + (t / maxH) * gW;
  const yDil = (d: number) => yA + hA - (d / 10) * hA;
  const yDesc = (d: number) => yA + (d / 5) * hA;
  const yBCF = (b: number) => yC + hC - ((b - 80) / 120) * hC;

  ctx.fillStyle = "#fafaf8";
  ctx.fillRect(0, 0, W, H);

  const initDil = entries.length
    ? Math.max(4, entries[0]!.dil ?? 4)
    : 4;

  drawZoneA(ctx, ml, gW, hA, yA, maxH, xScale, yDil, yDesc, initDil);
  drawZoneB(ctx, ml, gW, hB, yB);
  drawZoneC(ctx, ml, gW, hC, yC, yBCF);

  ctx.fillStyle = "#374151";
  ctx.font = "9px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  for (let h = 0; h <= maxH; h += 2) {
    ctx.fillStyle = "#6b7280";
    ctx.fillText("H+" + h, xScale(h), yC + hC + 16);
  }
  ctx.font = "bold 9px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#374151";
  ctx.fillText("Temps depuis admission (heures)", ml + gW / 2, yC + hC + 26);

  if (!entries.length) return;

  const toH = (iso: string) => toHoursFromFirst(entries, iso);
  plotZoneA(ctx, entries, toH, xScale, yDil, yDesc);
  plotZoneB(ctx, entries, toH, xScale, yB, hB, gW);
  plotZoneC(ctx, entries, toH, xScale, yBCF);
}
