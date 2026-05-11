import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = {
  title: "Inscription — HawaeMD",
};

export default async function SignupPage() {
  const session = await getSession();
  if (session) {
    if (session.role === "app_admin") redirect("/admin");
    if (session.role === "clinic_admin") redirect("/clinic");
    redirect("/dossier");
  }

  return <SignupForm />;
}
