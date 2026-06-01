import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Resuelve tus dudas sobre MedioFertas: cómo funciona el comparador, con qué droguerías trabajamos y cómo buscar medicamentos.",
  alternates: { canonical: "https://mediofertas.co/faq" },
  openGraph: {
    title: "Preguntas frecuentes — MedioFertas",
    description: "Resuelve tus dudas sobre MedioFertas: cómo funciona el comparador, con qué droguerías trabajamos y cómo buscar medicamentos.",
    url: "https://mediofertas.co/faq",
    type: "website",
    siteName: "MedioFertas",
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
