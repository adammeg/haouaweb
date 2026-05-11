import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ClinicLoginForm } from "@/components/clinic/clinic-login-form";

export const metadata = {
  title: "Connexion clinique — HawaeMD",
};

export default async function ClinicLoginPage() {
  const session = await getSession();
  if (session) {
    if (session.role === "clinic_admin") redirect("/clinic");
    if (session.role === "app_admin") redirect("/admin");
    redirect("/dossier");
  }
  return <ClinicLoginForm />;
}

