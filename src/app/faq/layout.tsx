import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Resuelve tus dudas sobre FarmaCompara: cómo funciona el comparador, con qué droguerías trabajamos y cómo buscar medicamentos.",
  alternates: { canonical: "https://farmacompara.co/faq" },
  openGraph: {
    title: "Preguntas frecuentes — FarmaCompara",
    description: "Resuelve tus dudas sobre FarmaCompara: cómo funciona el comparador, con qué droguerías trabajamos y cómo buscar medicamentos.",
    url: "https://farmacompara.co/faq",
    type: "website",
    siteName: "FarmaCompara",
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
