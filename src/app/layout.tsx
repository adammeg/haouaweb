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
    "Plateforme de dossiers patientes, consultations, scores cliniques et assistante Hawae pour la gynécologie, l'obstétrique et la fertilité.",
  manifest: "/manifest.webmanifest",
  themeColor: "#007070",
  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
  appleWebApp: { capable: true, title: "HawaeMD" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        className={`${display.variable} ${body.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
