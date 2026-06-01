import type { Metadata } from "next";
import { Manrope } from "next/font/google";

export const dynamic = "force-dynamic";
import { Suspense } from "react";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsletterBanner from "@/components/NewsletterBanner";
import NavigationProgress from "@/components/NavigationProgress";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: {
    default: "MedioFertas — Compara precios de medicamentos en Colombia",
    template: "%s | MedioFertas",
  },
  description:
    "Compara precios de medicamentos en tiempo real en todas las droguerías de Colombia. Tu ahorro, nuestra fórmula.",
  keywords: ["mediofertas", "medicamentos", "precios", "droguerías", "colombia", "ahorro", "genéricos"],
  authors: [{ name: "MedioFertas" }],
  metadataBase: new URL("https://mediofertas.co"),
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://mediofertas.co",
    siteName: "MedioFertas",
    title: "MedioFertas — Tu ahorro, nuestra fórmula",
    description: "Compara precios de medicamentos en tiempo real en todas las droguerías de Colombia.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "MedioFertas" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MedioFertas",
    description: "Compara precios de medicamentos en Colombia.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={manrope.variable}>
      <body className="min-h-screen flex flex-col bg-gray-100 font-sans">
        <Providers>
          <Suspense>
            <NavigationProgress />
          </Suspense>
          <Header />
          <main className="flex-1">{children}</main>
          <NewsletterBanner />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
