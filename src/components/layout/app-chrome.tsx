"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { BackupModal } from "@/components/backup/backup-modal";
import { NotificationBell } from "@/components/layout/notification-bell";
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

const PRIMARY_NAV: NavItem[] = [
  {
    href: "/salle-attente",
    label: "Salle d'attente",
    icon: IconWaiting,
    emoji: "🚪",
  },
  {
    href: "/dossier",
    label: "Dossier patiente",
    icon: IconFolder,
    emoji: "📋",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: IconDashboard,
    emoji: "📊",
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
      className={`sidebar-nav-item group relative flex items-center gap-3 ${
        active
          ? "border-[var(--blush)] bg-white/[0.13] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "border-transparent hover:border-white/20 hover:bg-white/[0.08]"
      }`}
    >
      <span
        className={`sidebar-nav-icon flex shrink-0 items-center justify-center transition-transform group-hover:scale-[1.04] ${
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
        <span className="sidebar-nav-badge flex h-5 min-w-5 shrink-0 items-center justify-center px-1">
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
    role: "doctor" | "secretary" | "clinic_admin" | "app_admin";
  };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const saveDraft = useHawaeStore((s) => s.saveDraft);
  const draft = useHawaeStore((s) => s.draft);
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
    if (pathname.startsWith("/dossier")) return "Dossier patiente";
    if (pathname.startsWith("/salle-attente")) return "Salle d'attente";
    if (pathname.startsWith("/dashboard")) return "Dashboard";
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
    <div className="hawae-app-shell min-h-screen bg-[var(--cream)]">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-[190] bg-black/45 backdrop-blur-[2px] sm:hidden"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        className={`app-sidebar fixed bottom-0 left-0 top-0 z-[200] flex w-[var(--sidebar-w)] flex-col transition-transform sm:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--gradient-sidebar)" }}
        aria-label="Navigation principale"
      >
        <div className="sidebar-logo flex shrink-0 items-center gap-3">
          <HawaeLogo
            size={42}
            rounded="lg"
            className="sidebar-logo-icon ring-1 ring-white/25"
          />
          <div className="sidebar-logo-text min-w-0">
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
          className="sidebar-nav hawae-scroll flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-3.5"
          aria-label="Sections principales"
        >
          <div className="sidebar-nav-label">
            Espaces
          </div>
          {(doctor.role === "secretary"
            ? PRIMARY_NAV.filter((item) => item.href === "/salle-attente")
            : PRIMARY_NAV
          ).map((item) => (
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

          <div className="sidebar-nav-label">
            Outils
          </div>
          {doctor.role !== "secretary" ? (
          <button
            type="button"
            onClick={() => {
              setNewPatientOpen(true);
              closeMobile();
            }}
            className="sidebar-nav-item group flex w-full items-center gap-3 text-left"
          >
            <span className="sidebar-nav-icon flex shrink-0 items-center justify-center">
              +
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-semibold leading-tight text-white/90">
                Nouvelle patiente
              </span>
            </span>
          </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              router.push("/agenda");
              closeMobile();
            }}
            className="sidebar-nav-item group flex w-full items-center gap-3 text-left"
          >
            <span className="sidebar-nav-icon flex shrink-0 items-center justify-center">
              ＋
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-semibold leading-tight text-white/90">
                Nouveau RDV
              </span>
            </span>
          </button>
          {doctor.role !== "secretary" ? (
          <button
            type="button"
            onClick={() => {
              setBackupOpen(true);
              closeMobile();
            }}
            className="sidebar-nav-item group flex w-full items-center gap-3 text-left"
          >
            <span className="sidebar-nav-icon flex shrink-0 items-center justify-center">
              ↓
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-semibold leading-tight text-white/90">
                Backup
              </span>
            </span>
          </button>
          ) : null}
          {doctor.role !== "secretary" ? <ToolsNavGroups
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
          /> : null}

          {doctor.role === "clinic_admin" || doctor.role === "app_admin" ? (
            <>
              <div className="sidebar-nav-label">
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

        <div className="sidebar-footer border-t border-white/10">
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

      <div className="app-main-zone min-h-screen sm:pl-[var(--sidebar-w)]">
        <div className="app-topbar sticky top-0 z-[150]">
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
              <span className="topbar-space-title truncate font-display text-base tracking-tight sm:text-[17px]">
                {pageTitle}
              </span>
            </div>
            <div className="topbar-actions flex shrink-0 items-center gap-1.5 sm:gap-2">
              <UserSwitcher
                triggerClassName="hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-left hover:bg-[var(--cream)] sm:inline-flex"
                avatar={
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: currentUser?.color ?? "#1a9a9a" }}
                  >
                    {currentUser?.initials ?? "?"}
                  </div>
                }
                nameLine={
                  <span className="max-w-[100px] truncate text-xs font-semibold text-[var(--ink)]">
                    {currentUser?.name ?? "Utilisateur"}
                  </span>
                }
              />
              <NotificationBell />
              {doctor.role !== "secretary" ? (
              <>
              <button
                type="button"
                onClick={() => saveDraft()}
                className="btn-header hidden sm:inline-flex"
                title="Sauvegarder le dossier en cours"
              >
                💾 Sauvegarder
              </button>
              </>
              ) : null}
              <Link
                href="/agenda"
                className="btn-header hidden sm:inline-flex"
                style={{
                  background: "var(--teal-pale)",
                  color: "var(--teal)",
                  borderColor: "var(--teal)",
                }}
                title="Prendre un RDV"
              >
                📅 RDV
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (draft?.id) saveDraft();
                  router.push("/salle-attente");
                }}
                className="btn-header hidden sm:inline-flex"
                title="Envoyer en salle d'attente"
                style={{
                  background: "#fef9e7",
                  color: "#92400e",
                  borderColor: "#fde68a",
                }}
              >
                🚪 Attente
              </button>
            </div>
          </div>
        </div>

        <main
          key={pathname}
          className="hawae-page hawae-page-enter mx-auto min-h-[calc(100vh-var(--topbar-h))] max-w-[var(--content-max)] px-4 pt-6 sm:px-8 sm:pt-7"
        >
          {children}
        </main>
      </div>

      <MobileBottomNav onOpenMenu={() => setMobileOpen(true)} secretary={doctor.role === "secretary"} />

      <NewPatientModal
        open={newPatientOpen}
        onClose={() => setNewPatientOpen(false)}
      />
      <BackupModal open={backupOpen} onClose={() => setBackupOpen(false)} />
    </div>
  );
}
