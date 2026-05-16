import type { ReactNode } from "react";

export function StatCard({
  value,
  label,
  accent,
  children,
}: {
  value: ReactNode;
  label: string;
  accent?: "teal" | "gold" | "ink";
  children?: ReactNode;
}) {
  const valueColor =
    accent === "gold"
      ? "text-[var(--gold)]"
      : accent === "ink"
        ? "text-[var(--ink)]"
        : "text-[var(--teal)]";

  return (
    <div className="hawae-stat">
      <div className={`hawae-stat-value ${valueColor}`}>{value}</div>
      <p className="hawae-stat-label">{label}</p>
      {children}
    </div>
  );
}
