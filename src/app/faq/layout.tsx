import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Resuelve tus dudas sobre MediOfertas: cómo funciona el comparador, con qué droguerías trabajamos y cómo buscar medicamentos.",
  alternates: { canonical: "https://mediofertas.co/faq" },
  openGraph: {
    title: "Preguntas frecuentes — MediOfertas",
    description: "Resuelve tus dudas sobre MediOfertas: cómo funciona el comparador, con qué droguerías trabajamos y cómo buscar medicamentos.",
    url: "https://mediofertas.co/faq",
    type: "website",
    siteName: "MediOfertas",
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
