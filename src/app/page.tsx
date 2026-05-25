import type { Metadata } from "next";
import Hero from "@/components/Hero";
import TrustBanner from "@/components/TrustBanner";
import CategoryGrid from "@/components/CategoryGrid";
import DescuentosCarrusel from "@/components/DescuentosCarrusel";
import TrendingProducts from "@/components/TrendingProducts";
import HowItWorks from "@/components/HowItWorks";

const SITE = "https://farmacompara.co";

export const metadata: Metadata = {
  alternates: { canonical: SITE },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      name: "FarmaCompara",
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
      name: "FarmaCompara",
      url: SITE,
      logo: { "@type": "ImageObject", url: `${SITE}/og-default.png` },
      contactPoint: { "@type": "ContactPoint", email: "info@farmacompara.co", contactType: "customer service" },
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
      <HowItWorks />
    </>
  );
}
