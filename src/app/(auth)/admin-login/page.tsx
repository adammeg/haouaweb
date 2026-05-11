import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata = {
  title: "Connexion admin — HawaeMD",
};

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) {
    if (session.role === "app_admin") redirect("/admin");
    if (session.role === "clinic_admin") redirect("/clinic");
    redirect("/dossier");
  }
  return <AdminLoginForm />;
}

