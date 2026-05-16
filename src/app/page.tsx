import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();
  if (session) {
    if (session.role === "app_admin") redirect("/admin");
    if (session.role === "clinic_admin") redirect("/clinic");
    redirect("/dossier");
  }

  return <LandingPage />;
}
