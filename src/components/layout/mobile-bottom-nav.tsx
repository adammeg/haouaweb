"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

function NavIcon({
  children,
  active,
}: {
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
        active ? "bg-[var(--teal)] text-white shadow-sm" : "text-[var(--muted)]"
      }`}
    >
      {children}
    </span>
  );
}

function IconWaiting(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden {...props}>
      <path d="M6 3v4a6 6 0 0 0 12 0V3M6 21v-4a6 6 0 0 1 12 0v4M4 3h16M4 21h16" strokeLinecap="round" />
    </svg>
  );
}

function IconFolder(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" strokeLinecap="round" />
    </svg>
  );
}

function IconDashboard(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden {...props}>
      <rect x="3" y="3" width="8" height="10" rx="2" />
      <rect x="13" y="3" width="8" height="6" rx="2" />
      <rect x="13" y="11" width="8" height="10" rx="2" />
      <rect x="3" y="15" width="8" height="6" rx="2" />
    </svg>
  );
}

function IconMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

const ITEMS = [
  { href: "/salle-attente", label: "Attente", icon: IconWaiting },
  { href: "/dossier", label: "Dossier", icon: IconFolder },
  { href: "/dashboard", label: "Stats", icon: IconDashboard },
] as const;

export function MobileBottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[180] border-t border-[var(--border)] bg-white/95 px-2 pt-1 shadow-[0_-4px_24px_rgba(10,92,92,0.08)] backdrop-blur-lg sm:hidden"
      style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom, 0px))" }}
      aria-label="Navigation rapide"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex min-h-[var(--bottom-nav-h)] min-w-[4.5rem] flex-col items-center justify-center gap-0.5 px-2 py-1"
            >
              <NavIcon active={active}>
                <Icon className="h-5 w-5" />
              </NavIcon>
              <span
                className={`text-[10px] font-semibold ${active ? "text-[var(--teal)]" : "text-[var(--muted)]"}`}
              >
                {label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex min-h-[var(--bottom-nav-h)] min-w-[4.5rem] flex-col items-center justify-center gap-0.5 px-2 py-1"
          aria-label="Ouvrir le menu complet"
        >
          <NavIcon active={false}>
            <IconMenu className="h-5 w-5" />
          </NavIcon>
          <span className="text-[10px] font-semibold text-[var(--muted)]">Menu</span>
        </button>
      </div>
    </nav>
  );
}
