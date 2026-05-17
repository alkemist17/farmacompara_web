import Hero from "@/components/Hero";
import TrustBanner from "@/components/TrustBanner";
import CategoryGrid from "@/components/CategoryGrid";
import DescuentosCarrusel from "@/components/DescuentosCarrusel";
import FeaturedComparisons from "@/components/FeaturedComparisons";
import HowItWorks from "@/components/HowItWorks";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <DescuentosCarrusel />
      <FeaturedComparisons />
      <TrustBanner />
      <HowItWorks />
    </>
  );
}
