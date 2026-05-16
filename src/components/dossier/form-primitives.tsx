import type { ReactNode } from "react";
import type { PatientSnapshot } from "@/types/domain";

export type FieldPatch = Record<string, string | undefined>;

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-[var(--ink-mid)]">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls = "hawae-input";

export function TextInput({
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  value?: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      className={inputCls}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value?: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      className={inputCls}
      rows={rows}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
}: {
  value?: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      className={inputCls}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value?: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label
          key={o.value}
          className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors ${
            value === o.value
              ? "bg-[var(--teal)] text-white ring-[var(--teal)]"
              : "bg-white text-[var(--ink-mid)] ring-[var(--border)] hover:ring-[var(--teal)]/40"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            className="sr-only"
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-[var(--border)] pb-2 text-sm font-bold uppercase tracking-wide text-[var(--teal)]">
      {children}
    </h3>
  );
}

export function fieldGrid(
  draft: PatientSnapshot,
  onField: (p: FieldPatch) => void,
) {
  return { draft, onField, patch: (k: keyof PatientSnapshot, v: string) => onField({ [k]: v }) };
}
