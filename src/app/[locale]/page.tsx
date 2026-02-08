import Hero from "@/components/home/Hero";
import ProductShowcase from "@/components/home/ProductShowcase";
import ProductPreview from "@/components/home/ProductPreview";
import TrustBadges from "@/components/shop/TrustBadges";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBadges />
      <ProductPreview />
      <ProductShowcase />
    </>
  );
}
