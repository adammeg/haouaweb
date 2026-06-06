"use client";

import { useMemo, useState } from "react";
import type { ConsultationEntry, PatientSnapshot } from "@/types/domain";

/**
 * Courbes biologiques — port du bloc v50 « Courbes biologiques » de l'onglet
 * Historique : trace l'évolution d'un paramètre (TA, Hb, Glycémie, Poids,
 * Terme) sur l'ensemble des consultations archivées + la consultation en cours.
 */

type MetricKey = "ta" | "hb" | "gly" | "poids" | "terme";

type Metric = {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  extract: (d: PatientSnapshot) => number | null;
};

function num(v: string | undefined): number | null {
  if (!v) return null;
  const m = String(v).replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return Number.isFinite(n) ? n : null;
}

const METRICS: Metric[] = [
  {
    key: "ta",
    label: "TA systolique",
    unit: "mmHg",
    color: "#ef4444",
    extract: (d) => num(d.ec_ta) ?? num(d.o_ta),
  },
  {
    key: "hb",
    label: "Hémoglobine",
    unit: "g/dL",
    color: "#0d6e6e",
    extract: (d) => num(d.bio_hb) ?? num(d.o_hb),
  },
  {
    key: "gly",
    label: "Glycémie",
    unit: "g/L",
    color: "#d97706",
    extract: (d) => num(d.bio_gly) ?? num(d.o_gly),
  },
  {
    key: "poids",
    label: "Poids",
    unit: "kg",
    color: "#7c3aed",
    extract: (d) => num(d.ec_poids) ?? num(d.o_poids),
  },
  {
    key: "terme",
    label: "Terme",
    unit: "SA",
    color: "#0369a1",
    extract: (d) => num(d.o_terme),
  },
];

type Pt = { date: string; value: number };

export function BioCurvesPanel({
  entries,
  draft,
}: {
  entries: ConsultationEntry[];
  draft: PatientSnapshot | null;
}) {
  const [key, setKey] = useState<MetricKey>("ta");
  const metric = METRICS.find((m) => m.key === key)!;

  const points = useMemo<Pt[]>(() => {
    const rows: { date: string; data: PatientSnapshot }[] = entries.map((e) => ({
      date: e.date,
      data: e.data,
    }));
    if (draft) {
      rows.push({ date: draft.lastSaved ?? new Date().toISOString(), data: draft });
    }
    return rows
      .map((r) => {
        const v = metric.extract(r.data);
        return v == null ? null : { date: r.date, value: v };
      })
      .filter((p): p is Pt => p !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries, draft, metric]);

  const w = 560;
  const h = 240;
  const pad = 40;

  const { min, max } = useMemo(() => {
    if (points.length === 0) return { min: 0, max: 1 };
    const vals = points.map((p) => p.value);
    let lo = Math.min(...vals);
    let hi = Math.max(...vals);
    if (lo === hi) {
      lo -= 1;
      hi += 1;
    }
    const span = hi - lo;
    return { min: lo - span * 0.1, max: hi + span * 0.1 };
  }, [points]);

  function xAt(i: number) {
    if (points.length <= 1) return w / 2;
    return pad + (i / (points.length - 1)) * (w - pad * 2);
  }
  function yAt(v: number) {
    return h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
  }

  const linePath =
    points.length > 0
      ? points
          .map((p, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + " " + yAt(p.value).toFixed(1))
          .join(" ")
      : "";

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-xs)]">
      <h2 className="mb-3 font-display text-sm font-bold text-[var(--ink)]">
        📈 Courbes biologiques
      </h2>
      <div className="mb-3 flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setKey(m.key)}
            className={
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors " +
              (m.key === key
                ? "text-white"
                : "border border-[var(--border)] bg-white text-[var(--ink-mid)] hover:bg-[var(--cream)]")
            }
            style={m.key === key ? { background: m.color } : undefined}
          >
            {m.label}
          </button>
        ))}
      </div>

      {points.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--muted)]">
          Pas encore de données « {metric.label} » à tracer. Renseignez la valeur
          dans le dossier et archivez des consultations.
        </p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="w-full max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--surface-raised,#fafafa)]"
            role="img"
            aria-label={`Courbe ${metric.label}`}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const val = min + (max - min) * (1 - t);
              const yy = pad + t * (h - pad * 2);
              return (
                <g key={t}>
                  <line
                    x1={pad}
                    y1={yy}
                    x2={w - pad}
                    y2={yy}
                    stroke="#e5e7eb"
                    strokeDasharray="4 4"
                  />
                  <text x={6} y={yy + 4} fontSize={9} fill="#9ca3af">
                    {val.toFixed(1)}
                  </text>
                </g>
              );
            })}
            {linePath ? (
              <path d={linePath} fill="none" stroke={metric.color} strokeWidth={2} />
            ) : null}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={xAt(i)} cy={yAt(p.value)} r={4} fill={metric.color} />
                <text
                  x={xAt(i)}
                  y={yAt(p.value) - 8}
                  fontSize={9}
                  fill="#374151"
                  textAnchor="middle"
                >
                  {p.value}
                </text>
              </g>
            ))}
            <text x={w / 2} y={16} textAnchor="middle" fontSize={11} fill={metric.color}>
              {metric.label} ({metric.unit})
            </text>
          </svg>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--muted)]">
            {points.map((p, i) => (
              <span key={i}>
                {new Date(p.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
                {" : "}
                <strong style={{ color: metric.color }}>{p.value}</strong>
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
