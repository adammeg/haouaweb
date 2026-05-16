import type { ReactNode } from "react";
import Link from "next/link";

export function PageHeader({
  title,
  description,
  actions,
  badge,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  badge?: string;
}) {
  return (
    <header className="hawae-page-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {badge ? (
          <span className="mb-2 inline-flex rounded-full bg-[var(--teal-pale)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--teal)]">
            {badge}
          </span>
        ) : null}
        <h1>{title}</h1>
        {description ? <p className="hawae-lead">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function QuickLink({
  href,
  children,
  primary,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "hawae-btn hawae-btn-primary inline-flex min-h-[44px] px-4 py-2.5 text-sm sm:min-h-[40px]"
          : "hawae-btn hawae-btn-ghost inline-flex min-h-[44px] px-4 py-2.5 text-sm sm:min-h-[40px]"
      }
    >
      {children}
    </Link>
  );
}
