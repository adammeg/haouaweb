"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TEAL = "#007070";
const GOLD = "#B8963E";
const BLUSH = "#C17A7A";
const INK = "#1A1A2E";
const MUTED = "#94a3b8";

const SPEC_COLORS: Record<string, string> = {
  gyn: BLUSH,
  obst: TEAL,
  inf: GOLD,
  "—": MUTED,
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-chart-tooltip">
      {label ? <p className="dash-chart-tooltip-label">{label}</p> : null}
      <ul className="dash-chart-tooltip-list">
        {payload.map((p) => (
          <li key={p.name}>
            <span className="dash-chart-tooltip-dot" style={{ background: p.color }} />
            <span>{p.name}</span>
            <strong>{p.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ActivityChart({
  data,
}: {
  data: { label: string; dossiers: number; consultations: number }[];
}) {
  if (data.length === 0) {
    return <p className="dash-chart-empty">Pas encore de données sur cette période.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="gradDossiers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity={0.35} />
            <stop offset="100%" stopColor={TEAL} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradConsult" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
            <stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: MUTED }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: MUTED }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(v) => <span style={{ color: INK }}>{v}</span>}
        />
        <Area
          type="monotone"
          dataKey="dossiers"
          name="Dossiers modifiés"
          stroke={TEAL}
          strokeWidth={2}
          fill="url(#gradDossiers)"
        />
        <Area
          type="monotone"
          dataKey="consultations"
          name="Consultations"
          stroke={GOLD}
          strokeWidth={2}
          fill="url(#gradConsult)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SpecialtyPieChart({
  data,
  activeKey,
  onSelect,
}: {
  data: { name: string; key: string; value: number }[];
  activeKey: string | null;
  onSelect: (key: string | null) => void;
}) {
  if (data.length === 0) {
    return <p className="dash-chart-empty">Aucun dossier.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={2}
          onClick={(_, i) => {
            const key = data[i]?.key;
            if (!key) return;
            onSelect(activeKey === key ? null : key);
          }}
          style={{ cursor: "pointer" }}
        >
          {data.map((entry) => (
            <Cell
              key={entry.key}
              fill={SPEC_COLORS[entry.key] ?? MUTED}
              stroke={activeKey === entry.key ? INK : "transparent"}
              strokeWidth={activeKey === entry.key ? 3 : 0}
              opacity={activeKey && activeKey !== entry.key ? 0.45 : 1}
            />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          wrapperStyle={{ fontSize: 12 }}
          formatter={(v) => <span style={{ color: INK }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AgeBarChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
        <XAxis type="number" domain={[0, max]} hide />
        <YAxis
          type="category"
          dataKey="label"
          width={88}
          tick={{ fontSize: 11, fill: INK }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,112,112,0.06)" }} />
        <Bar dataKey="count" name="Patientes" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {data.map((_, i) => (
            <Cell key={i} fill={i % 2 === 0 ? TEAL : "#0d8a8a"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ClinicalRisksChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: MUTED }}
          axisLine={false}
          tickLine={false}
          angle={-32}
          textAnchor="end"
          height={56}
          interval={0}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={28} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(193,122,122,0.08)" }} />
        <Bar dataKey="value" name="Cas" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((_, i) => (
            <Cell key={i} fill={i < 4 ? BLUSH : GOLD} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RdvTypeChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  const filtered = data.filter((d) => d.count > 0);
  if (filtered.length === 0) {
    return <p className="dash-chart-empty">Aucun rendez-vous enregistré.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={filtered} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={28} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="count" name="RDV" fill={TEAL} radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
