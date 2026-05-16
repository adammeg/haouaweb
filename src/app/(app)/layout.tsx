import type { ReactNode } from "react";
import Script from "next/script";
import { redirect } from "next/navigation";
import { AppChrome } from "@/components/layout/app-chrome";
import { StoreHydration } from "@/components/providers/store-hydration";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { getSession } from "@/lib/auth/session";
import { isDoctorActive } from "@/lib/auth/require-active";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(await isDoctorActive(session.sub))) redirect("/login?error=disabled");

  return (
    <>
      <Script
        id="hawae-doctor-scope"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.__HAWAE_DOCTOR_ID__=${JSON.stringify(session.sub)};`,
        }}
      />
      <PwaRegister />
      <StoreHydration doctorId={session.sub}>
        <AppChrome
          doctor={{
            email: session.email,
            name: session.name,
            role: session.role,
          }}
        >
          {children}
        </AppChrome>
      </StoreHydration>
    </>
  );
}
