import Link from "next/link";
import type { ReactNode } from "react";

export type ComingSoonFeature = {
  title: string;
  description: string;
};

export function ComingSoon({
  eyebrow,
  title,
  description,
  features,
  primary,
  secondary,
  illustration,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  features?: ComingSoonFeature[];
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  illustration?: ReactNode;
}) {
  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col gap-6 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-s)] sm:p-10 lg:flex-row lg:items-center lg:gap-10">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--teal)] to-[var(--teal-mid)] text-white shadow-[0_14px_40px_rgba(10,92,92,0.25)]">
          {illustration ?? (
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 2.5 13.7 8 19 9.7 13.7 11.5 12 17l-1.7-5.5L5 9.7 10.3 8 12 2.5Z" />
              <path d="M18.5 16 19.5 18.5 22 19.5 19.5 20.5 18.5 23 17.5 20.5 15 19.5 17.5 18.5 18.5 16Z" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          {eyebrow ? (
            <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--teal-pale)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--teal)]">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-mid)]">
            {description}
          </p>
          {(primary || secondary) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {primary ? (
                <Link
                  href={primary.href}
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--teal)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
                >
                  {primary.label}
                </Link>
              ) : null}
              {secondary ? (
                <Link
                  href={secondary.href}
                  className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--teal-pale)]/40"
                >
                  {secondary.label}
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {features && features.length > 0 ? (
        <div>
          <h2 className="mb-4 font-display text-lg font-bold text-[var(--ink)]">
            Ce que vous pourrez faire ici
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow-s)]"
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--teal-pale)] text-[var(--teal)]">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h3 className="font-display text-sm font-bold text-[var(--ink)]">
                  {f.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
