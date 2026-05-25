import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NavigationProgress from "@/components/NavigationProgress";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: {
    default: "FarmaCompara — Compara precios de medicamentos en Colombia",
    template: "%s | FarmaCompara",
  },
  description:
    "Compara precios de medicamentos en tiempo real en todas las droguerías de Colombia. Tu ahorro, nuestra fórmula.",
  keywords: ["farmacompara", "medicamentos", "precios", "droguerías", "colombia", "ahorro", "genéricos"],
  authors: [{ name: "FarmaCompara" }],
  metadataBase: new URL("https://farmacompara.co"),
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://farmacompara.co",
    siteName: "FarmaCompara",
    title: "FarmaCompara — Tu ahorro, nuestra fórmula",
    description: "Compara precios de medicamentos en tiempo real en todas las droguerías de Colombia.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "FarmaCompara" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FarmaCompara",
    description: "Compara precios de medicamentos en Colombia.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-gray-100">
        <Providers>
          <Suspense>
            <NavigationProgress />
          </Suspense>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
