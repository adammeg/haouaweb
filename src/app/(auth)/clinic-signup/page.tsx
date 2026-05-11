import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ClinicSignupForm } from "@/components/clinic/clinic-signup-form";

export const metadata = {
  title: "Créer une clinique — HawaeMD",
};

export default async function ClinicSignupPage() {
  const session = await getSession();
  if (session) {
    if (session.role === "clinic_admin") redirect("/clinic");
    if (session.role === "app_admin") redirect("/admin");
    redirect("/dossier");
  }
  return <ClinicSignupForm />;
}

