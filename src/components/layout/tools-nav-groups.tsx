"use client";

import { useMemo, useState, type ReactNode, type SVGProps } from "react";
import type { NavItem } from "./nav-types";

function IconCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function IconBell(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden {...props}>
      <path d="M6 8a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7Z" strokeLinecap="round" />
      <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}

function IconStethoscope(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden {...props}>
      <path d="M6 3v6a4 4 0 0 0 8 0V3M10 13v3a4 4 0 0 0 8 0v-2M18 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" strokeLinecap="round" />
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

function IconSparkles(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2.5 13.7 8 19 9.7 13.7 11.5 12 17l-1.7-5.5L5 9.7 10.3 8 12 2.5Z" />
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

function IconShield(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden {...props}>
      <path d="M12 3 4 6v6c0 4.5 3.2 8.5 8 9 4.8-.5 8-4.5 8-9V6l-8-3Z" strokeLinecap="round" />
    </svg>
  );
}

function IconHospital(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden {...props}>
      <path d="M4 21V9l8-5 8 5v12M9 21V12h6v9M12 6v3M10.5 7.5h3" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" strokeLinecap="round" />
    </svg>
  );
}

export const TOOL_GROUPS: { id: string; label: string; items: NavItem[] }[] = [
  {
    id: "planning",
    label: "Planning",
    items: [
      { href: "/agenda", label: "Agenda & RDV", sub: "Planning semaine", icon: IconCalendar },
      { href: "/rappels", label: "Rappels", sub: "RDV à confirmer", icon: IconBell },
    ],
  },
  {
    id: "clinique",
    label: "Clinique",
    items: [
      { href: "/scores", label: "Scores cliniques", sub: "Bishop, Manning…", icon: IconStethoscope },
      { href: "/partogramme", label: "Partogramme", sub: "Travail & dilatation", icon: IconCalendar },
      { href: "/certificats", label: "Certificats", sub: "PDF médicaux", icon: IconFolder },
      { href: "/courbes", label: "Courbes croissance", sub: "Salomon / Hadlock", icon: IconDashboard },
      { href: "/protocoles", label: "Protocoles", sub: "Fiches procédurales", icon: IconShield },
      { href: "/bridge", label: "Bridge écho", sub: "DICOM SR & OCR", icon: IconHospital },
    ],
  },
  {
    id: "archives",
    label: "Archives",
    items: [
      { href: "/documents", label: "Documents", sub: "Galerie & backup", icon: IconFolder },
      { href: "/settings", label: "Paramètres", sub: "Profil & préférences", icon: IconSettings },
    ],
  },
];

export function ToolsNavGroups({
  isActive,
  onNavigate,
  renderItem,
}: {
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
  renderItem: (props: {
    item: NavItem;
    active: boolean;
    onClick?: () => void;
  }) => ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({
    planning: true,
    clinique: true,
    archives: true,
  });

  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return TOOL_GROUPS;
    return TOOL_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter(
        (i) =>
          i.label.toLowerCase().includes(t) ||
          (i.sub?.toLowerCase().includes(t) ?? false),
      ),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <>
      <div className="px-2.5 pb-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un outil…"
          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/15"
          aria-label="Rechercher dans les outils"
        />
      </div>
      {filtered.map((group) => {
        const expanded = open[group.id] ?? true;
        return (
          <div key={group.id} className="mb-1">
            <button
              type="button"
              onClick={() =>
                setOpen((s) => ({ ...s, [group.id]: !expanded }))
              }
              className="flex w-full items-center justify-between px-2.5 py-1.5 text-left text-[9px] font-bold uppercase tracking-[1.8px] text-white/35 hover:text-white/55"
              aria-expanded={expanded}
            >
              {group.label}
              <span className="text-white/40">{expanded ? "−" : "+"}</span>
            </button>
            {expanded
              ? group.items.map((item) =>
                  renderItem({
                    item,
                    active: isActive(item.href),
                    onClick: onNavigate,
                  }),
                )
              : null}
          </div>
        );
      })}
      {query && filtered.length === 0 ? (
        <p className="px-3 py-2 text-xs text-white/45">Aucun outil trouvé.</p>
      ) : null}
    </>
  );
}
