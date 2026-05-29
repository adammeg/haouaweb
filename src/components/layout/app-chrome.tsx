"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode, SVGProps } from "react";
import type { NavItem } from "@/components/layout/nav-types";
import { ToolsNavGroups } from "@/components/layout/tools-nav-groups";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { useMemo, useState, useEffect } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import { UserSwitcher } from "@/components/users/user-switcher";
import { LogoutControl } from "@/components/auth/logout-control";
import { HawaeLogo } from "@/components/brand/hawae-logo";
import { NewPatientModal } from "@/components/patient/new-patient-modal";
import { useModulesWorkspace } from "@/stores/modules-store";
import { todayIso } from "@/lib/waiting-room/utils";

function IconWaiting(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M6 3v4a6 6 0 0 0 12 0V3" />
      <path d="M6 21v-4a6 6 0 0 1 12 0v4" />
      <path d="M4 3h16" />
      <path d="M4 21h16" />
    </svg>
  );
}

function IconFolder(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function IconDashboard(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="3" y="3" width="8" height="10" rx="2" />
      <rect x="13" y="3" width="8" height="6" rx="2" />
      <rect x="13" y="11" width="8" height="10" rx="2" />
      <rect x="3" y="15" width="8" height="6" rx="2" />
    </svg>
  );
}

function IconPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconHospital(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M4 21V9l8-5 8 5v12" />
      <path d="M9 21V12h6v9" />
      <path d="M12 6v3M10.5 7.5h3" />
    </svg>
  );
}

function IconShield(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M12 3 4 6v6c0 4.5 3.2 8.5 8 9 4.8-.5 8-4.5 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconSparkles(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2.5 13.7 8 19 9.7 13.7 11.5 12 17l-1.7-5.5L5 9.7 10.3 8 12 2.5Zm6.5 11 .9 2.6L22 17l-2.6.9-.9 2.6-.9-2.6L15 17l2.6-.9.9-2.6Z" />
    </svg>
  );
}

const PRIMARY_NAV: NavItem[] = [
  {
    href: "/salle-attente",
    label: "Salle d'attente",
    sub: "Patients du jour",
    icon: IconWaiting,
  },
  {
    href: "/dossier",
    label: "Dossier patiente",
    sub: "Anamnèse & Hawae",
    icon: IconFolder,
  },
  {
    href: "/dashboard",
    label: "Tableau de bord",
    sub: "Statistiques cabinet",
    icon: IconDashboard,
  },
  {
    href: "/assist",
    label: "Hawae",
    sub: "Assistante clinique · 16 scores",
    icon: IconSparkles,
  },
];

function SidebarItem({
  item,
  active,
  onClick,
  badge,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
  badge?: number;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 transition-all ${
        active
          ? "border-[var(--blush)] bg-white/[0.13] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "border-transparent hover:border-white/20 hover:bg-white/[0.08]"
      }`}
    >
      <span
        className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-[1.04] ${
          active ? "bg-[rgba(193,122,122,0.32)]" : "bg-white/[0.07]"
        }`}
      >
        <Icon className="h-4 w-4 text-white/95" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold leading-tight text-white/90">
          {item.label}
        </span>
        {item.sub ? (
          <span className="block truncate text-[10px] text-white/45">
            {item.sub}
          </span>
        ) : null}
      </span>
      {badge != null && badge > 0 ? (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-amber-950">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
      {item.soon ? (
        <span className="shrink-0 rounded-full bg-[var(--gold)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--teal-deep-nav)]">
          Soon
        </span>
      ) : null}
    </Link>
  );
}

export function AppChrome({
  children,
  doctor,
}: {
  children: ReactNode;
  doctor: {
    email: string;
    name: string;
    role: "doctor" | "clinic_admin" | "app_admin";
  };
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const ws = useModulesWorkspace();
  const waitingBadge = useMemo(() => {
    const today = todayIso();
    return ws.waitingQueue.filter(
      (e) =>
        e.date === today &&
        (e.status === "waiting" || e.status === "in_consult"),
    ).length;
  }, [ws.waitingQueue]);

  const pageTitle = useMemo(() => {
    if (pathname.startsWith("/dossier")) return "Dossier";
    if (pathname.startsWith("/salle-attente")) return "Salle d'attente";
    if (pathname.startsWith("/dashboard")) return "Tableau de bord";
    if (pathname.startsWith("/agenda")) return "Agenda & RDV";
    if (pathname.startsWith("/rappels")) return "Rappels";
    if (pathname.startsWith("/assist")) return "Hawae";
    if (pathname.startsWith("/scores")) return "Scores cliniques";
    if (pathname.startsWith("/settings")) return "Paramètres";
    if (pathname.startsWith("/clinic")) return "Clinique";
    if (pathname.startsWith("/admin")) return "Console admin";
    return "HawaeMD";
  }, [pathname]);

  const currentUser = useHawaeStore((s) => {
    const u = s.users.find((x) => x.id === s.currentUserId);
    return u ?? s.users[0];
  });

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-[190] bg-black/45 backdrop-blur-[2px] sm:hidden"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        className={`fixed bottom-0 left-0 top-0 z-[200] flex w-[var(--sidebar-w)] flex-col shadow-[4px_0_24px_rgba(10,92,92,0.22)] transition-transform sm:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--gradient-sidebar)" }}
        aria-label="Navigation principale"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-[18px] py-[18px]">
          <HawaeLogo
            size={42}
            rounded="lg"
            className="shadow-md ring-1 ring-white/25"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-[17px] font-extrabold leading-tight text-white">
                HawaeMD
              </h1>
            </div>
            <span className="hawae-brand-tagline block truncate">
              Intelligence clinique
            </span>
          </div>
        </div>

        <nav
          className="hawae-scroll flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-3.5"
          aria-label="Sections principales"
        >
          <div className="px-2.5 pb-1 pt-2 text-[9px] font-bold uppercase tracking-[1.8px] text-white/30">
            Consultation
          </div>
          {PRIMARY_NAV.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onClick={closeMobile}
              badge={
                item.href === "/salle-attente" && waitingBadge > 0
                  ? waitingBadge
                  : undefined
              }
            />
          ))}

          <div className="mt-4 px-2.5 pb-1 text-[9px] font-bold uppercase tracking-[1.8px] text-white/30">
            Outils
          </div>
          <button
            type="button"
            onClick={() => {
              setNewPatientOpen(true);
              closeMobile();
            }}
            className="group flex w-full items-center gap-3 rounded-lg border-l-[3px] border-transparent px-3 py-2.5 text-left transition-all hover:border-white/20 hover:bg-white/[0.08]"
          >
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-[rgba(201,168,76,0.18)] transition-transform group-hover:scale-[1.04]">
              <IconPlus className="h-4 w-4 text-white/95" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-semibold leading-tight text-white/90">
                Nouvelle patiente
              </span>
              <span className="block truncate text-[10px] text-white/45">
                Créer un dossier
              </span>
            </span>
          </button>
          <ToolsNavGroups
            isActive={isActive}
            onNavigate={closeMobile}
            renderItem={({ item, active, onClick }) => (
              <SidebarItem
                key={item.href}
                item={item}
                active={active}
                onClick={onClick}
              />
            )}
          />

          {doctor.role === "clinic_admin" || doctor.role === "app_admin" ? (
            <>
              <div className="mt-4 px-2.5 pb-1 text-[9px] font-bold uppercase tracking-[1.8px] text-white/30">
                Administration
              </div>
              {doctor.role === "clinic_admin" ? (
                <SidebarItem
                  item={{
                    href: "/clinic",
                    label: "Clinique",
                    sub: "Équipe & médecins",
                    icon: IconHospital,
                  }}
                  active={isActive("/clinic")}
                  onClick={closeMobile}
                />
              ) : null}
              {doctor.role === "app_admin" ? (
                <SidebarItem
                  item={{
                    href: "/admin",
                    label: "Console admin",
                    sub: "Plateforme",
                    icon: IconShield,
                  }}
                  active={isActive("/admin")}
                  onClick={closeMobile}
                />
              ) : null}
            </>
          ) : null}
        </nav>

        <div className="border-t border-white/10">
          <UserSwitcher
            triggerClassName="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.05]"
            avatar={
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                style={{ background: currentUser?.color ?? "#0d6e6e" }}
              >
                {currentUser?.initials ?? "?"}
              </div>
            }
            nameLine={
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-[var(--cream)]">
                  {currentUser?.name ?? "Utilisateur"}
                </div>
                <div className="text-[10px] text-white/55">
                  Changer d&apos;utilisateur
                </div>
              </div>
            }
          />
          <LogoutControl email={doctor.email} name={doctor.name} />
        </div>
      </aside>

      <div className="min-h-screen bg-[var(--cream)] sm:pl-[var(--sidebar-w)]">
        <div
          className="min-h-screen bg-gradient-to-b from-white/55 via-[var(--cream)] to-[var(--cream-dark)]/30"
          style={{
            paddingTop: "env(safe-area-inset-top, 0px)",
          }}
        >
        <div className="sticky top-0 z-[150] border-b border-[var(--border)] bg-white/92 shadow-[0_1px_0_rgba(10,92,92,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-white/78">
          <div className="mx-auto flex h-[var(--topbar-h)] max-w-[var(--content-max)] items-center gap-3 px-4 sm:px-8">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--ink)] shadow-sm sm:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-display text-base font-extrabold tracking-tight text-[var(--ink)] sm:text-[17px]">
                  {pageTitle}
                </span>
                <span
                  className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline-block ${
                    doctor.role === "app_admin"
                      ? "bg-slate-200/90 text-slate-800"
                      : doctor.role === "clinic_admin"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-[var(--teal-pale)] text-[var(--teal)]"
                  }`}
                >
                  {doctor.role === "clinic_admin"
                    ? "Clinique"
                    : doctor.role === "app_admin"
                      ? "Admin"
                      : "Médecin"}
                </span>
              </div>
              <div className="truncate text-[11px] text-[var(--muted)]">
                <span className="hidden sm:inline">{doctor.name} · </span>
                <span
                  title={doctor.email}
                  className="max-w-[200px] sm:max-w-none"
                >
                  {doctor.email}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNewPatientOpen(true)}
              className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-[var(--teal)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-95 sm:inline-flex"
            >
              <IconPlus className="h-3.5 w-3.5" />
              Nouvelle
            </button>
            {doctor.role === "app_admin" ? (
              <Link
                href="/admin"
                className="hidden shrink-0 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--teal-pale)]/50 sm:inline-flex"
              >
                Console admin
              </Link>
            ) : null}
          </div>
        </div>

        <main className="hawae-page mx-auto min-h-[calc(100vh-var(--topbar-h))] max-w-[var(--content-max)] px-4 pb-12 pt-6 sm:px-8 sm:pt-7">
          {children}
        </main>
        </div>

        <MobileBottomNav onOpenMenu={() => setMobileOpen(true)} />
      </div>

      <NewPatientModal
        open={newPatientOpen}
        onClose={() => setNewPatientOpen(false)}
      />
    </div>
  );
}
