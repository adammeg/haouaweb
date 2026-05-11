import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ClinicDashboard } from "@/components/clinic/clinic-dashboard";
import { isDoctorActive } from "@/lib/auth/require-active";

export const metadata = {
  title: "Dashboard clinique — HawaeMD",
};

export default async function ClinicPage() {
  const session = await getSession();
  if (!session) redirect("/clinic-login");
  if (!(await isDoctorActive(session.sub))) redirect("/clinic-login");
  if (session.role !== "clinic_admin" || !session.clinicId) redirect("/dossier");

  return <ClinicDashboard clinicId={session.clinicId} adminName={session.name} />;
}

