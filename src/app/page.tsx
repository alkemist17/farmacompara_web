import Hero from "@/components/Hero";
import TrustBanner from "@/components/TrustBanner";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedComparisons from "@/components/FeaturedComparisons";
import HowItWorks from "@/components/HowItWorks";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBanner />
      <CategoryGrid />
      <FeaturedComparisons />
      <HowItWorks />
    </>
  );
}
