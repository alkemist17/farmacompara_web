import type { Metadata } from "next";
import Hero from "@/components/Hero";
import TrustBanner from "@/components/TrustBanner";
import CategoryGrid from "@/components/CategoryGrid";
import DescuentosCarrusel from "@/components/DescuentosCarrusel";
import TrendingProducts from "@/components/TrendingProducts";
import HowItWorks from "@/components/HowItWorks";
import TrustBadges from "@/components/TrustBadges";

export const dynamic = "force-dynamic";

const SITE = "https://mediofertas.co";

export const metadata: Metadata = {
  alternates: { canonical: SITE },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      name: "MediOfertas",
      url: SITE,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE}/comparar?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "MediOfertas",
      url: SITE,
      logo: { "@type": "ImageObject", url: `${SITE}/og-default.png` },
      contactPoint: { "@type": "ContactPoint", email: "contacto@mediofertas.co", contactType: "customer service" },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Hero />
      <CategoryGrid />
      <DescuentosCarrusel />
      <TrendingProducts />
      <TrustBanner />
      <TrustBadges />
      <HowItWorks />
    </>
  );
}
