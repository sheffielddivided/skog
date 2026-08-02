import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  metadataBase: new URL("https://skogens-utvikling.vercel.app"),
  title: {
    default: "Skogens utvikling – skog, volum, biomasse og karbon i Norge og verden",
    template: "%s · Skogens utvikling",
  },
  description:
    "Interaktiv, kildebelagt visualisering av hvordan skogareal, stående volum, biomasse og karbonlager har utviklet seg i Norge og resten av verden over tid.",
  openGraph: {
    title: "Skogens utvikling",
    description:
      "Tre ganger mer skog enn for hundre år siden. Interaktive grafer om norsk og europeisk skog.",
    locale: "nb_NO",
    type: "website",
  },
  keywords: ["skog", "karbon", "biomasse", "Landsskogtakseringen", "FAO FRA", "SSB", "Norge"],
};

export const viewport: Viewport = {
  themeColor: "#1c5220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb">
      <body className="min-h-screen bg-paper">
        <a
          href="#innhold"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-forest-700 focus:px-4 focus:py-2 focus:text-paper"
        >
          Hopp til innhold
        </a>
        <SiteHeader />
        <main id="innhold">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
