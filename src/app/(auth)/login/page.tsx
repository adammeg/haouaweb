import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Connexion — HawaeMD",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const session = await getSession();
  if (session) {
    if (session.role === "app_admin") redirect("/admin");
    if (session.role === "clinic_admin") redirect("/clinic");
    redirect("/dossier");
  }

  const sp = await searchParams;
  return <LoginForm from={sp.from} errorKey={sp.error} />;
}
