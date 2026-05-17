import type { ReactNode } from "react";
import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--cream)] px-4 py-10 sm:py-14">
      <div className="mb-6 flex items-center gap-3 sm:mb-8">
        <div className="hawae-brand-mark h-12 w-12 text-2xl">✦</div>
        <div>
          <Link
            href="/"
            className="font-display text-xl font-extrabold tracking-tight text-[var(--ink)]"
          >
            HawaeMD
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[var(--muted)]">
            Intelligence clinique
          </p>
        </div>
      </div>

      <div className="hawae-panel w-full max-w-[min(28rem,calc(100vw-2rem))] p-6 sm:p-8">
        <h1 className="font-display text-xl font-bold text-[var(--ink)]">{title}</h1>
        {subtitle ? (
          <p className="mt-1.5 text-sm text-[var(--muted)]">{subtitle}</p>
        ) : null}
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 border-t border-[var(--border)] pt-5">{footer}</div> : null}
      </div>
    </div>
  );
}
