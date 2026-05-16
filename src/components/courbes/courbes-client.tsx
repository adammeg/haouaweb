"use client";

import { useMemo, useState } from "react";
import {
  buildGrowthCurve,
  CURVE_META,
  type SalomonKey,
} from "@/lib/growth-curves/hadlock";
import { useModulesWorkspace } from "@/stores/modules-store";

const KEYS: SalomonKey[] = ["bip", "pc", "ca", "lf", "pfe"];

export function CourbesClient() {
  const ws = useModulesWorkspace();
  const teach = ws.teachMode;
  const [key, setKey] = useState<SalomonKey>("bip");
  const pts = useMemo(() => buildGrowthCurve(key), [key]);
  const meta = CURVE_META[key];

  const w = 520;
  const h = 240;
  const pad = 36;
  const gaMin = 18;
  const gaMax = 40;

  function x(ga: number) {
    return pad + ((ga - gaMin) / (gaMax - gaMin)) * (w - pad * 2);
  }
  function y(v: number) {
    const vals = pts.flatMap((p) => [p.p5, p.p95]);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    return h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
  }

  function pathLine(getV: (p: (typeof pts)[0]) => number) {
    return pts
      .map((p, i) => (i ? "L" : "M") + x(p.ga) + " " + y(getV(p)))
      .join(" ");
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--border)] pb-6">
        <h1 className="font-display text-2xl font-bold">Courbes de croissance</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Percentiles Salomon / Hadlock — 18 à 40 SA.
          {teach ? " Mode enseignement actif." : ""}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKey(k)}
            className={
              "rounded-full px-4 py-2 text-xs font-semibold " +
              (k === key
                ? "bg-[var(--teal)] text-white"
                : "border border-[var(--border)] bg-white")
            }
          >
            {CURVE_META[k].label}
          </button>
        ))}
      </div>

      <svg
        viewBox={"0 0 " + w + " " + h}
        className="w-full max-w-2xl rounded-2xl border bg-white"
      >
        <path d={pathLine((p) => p.p5)} fill="none" stroke="#d97706" strokeWidth={1.5} />
        <path d={pathLine((p) => p.p50)} fill="none" stroke={meta.color} strokeWidth={2} />
        <path d={pathLine((p) => p.p95)} fill="none" stroke="#dc2626" strokeWidth={1.5} />
        <text x={w / 2} y={18} textAnchor="middle" fontSize={12} fill="#0a5c5c">
          {meta.label} ({meta.unit})
        </text>
      </svg>

      {teach ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <strong>Mode enseignement :</strong> P5 / P50 / P95 selon Salomon 2011.
          Interpolation linéaire entre semaines de référence.
        </div>
      ) : null}
    </div>
  );
}
