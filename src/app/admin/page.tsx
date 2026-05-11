import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { isDoctorActive } from "@/lib/auth/require-active";

export const metadata = {
  title: "Admin — HawaeMD",
};

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/admin-login");
  if (!(await isDoctorActive(session.sub))) redirect("/admin-login");
  if (session.role !== "app_admin") redirect("/dossier");
  return <AdminDashboard adminName={session.name} />;
}

