import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700", "800"],
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HawaeMD — Intelligence clinique pour la gynéco-obstétrique",
  description:
    "Plateforme de dossiers patientes, consultations, scores cliniques et assistant Hawae IA pour la gynécologie, l'obstétrique et la fertilité.",
  manifest: "/manifest.webmanifest",
  themeColor: "#0A5C5C",
  appleWebApp: { capable: true, title: "HawaeMD" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${display.variable} ${body.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
