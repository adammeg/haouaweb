import type { Metadata, Viewport } from "next";
import { DM_Sans, Noto_Naskh_Arabic, Poppins } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { QuickAiBubble } from "@/components/assist/quick-ai-bubble";
import { getSession } from "@/lib/auth/session";

const display = Poppins({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700", "800"],
});

const arabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "600"],
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HawaeMD — Intelligence clinique pour la gynéco-obstétrique",
  description:
    "Plateforme de dossiers patientes, consultations, scores cliniques et assistante Hawae pour la gynécologie, l'obstétrique et la fertilité.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
  appleWebApp: { capable: true, title: "HawaeMD" },
};

export const viewport: Viewport = {
  themeColor: "#0A5C5C",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  return (
    <html lang="fr">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=JSON.parse(localStorage.getItem('hawae-prefs-v1')||'{}');var r=document.documentElement;if(p.theme==='dark')r.setAttribute('data-theme','dark');if(p.accent){r.style.setProperty('--teal',p.accent);r.style.setProperty('--color-teal',p.accent);r.style.setProperty('--teal-light',p.accent);r.style.setProperty('--accent',p.accent);}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${display.variable} ${body.variable} ${arabic.variable} font-sans antialiased`}
      >
        <PwaRegister />
        {children}
        <QuickAiBubble
          key={session ? `${session.sub}:${session.role}` : "guest"}
          access={!session ? "sign-in" : session.role === "secretary" ? "restricted" : "enabled"}
        />
      </body>
    </html>
  );
}
