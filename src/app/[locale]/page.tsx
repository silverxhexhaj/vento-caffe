import Hero from "@/components/home/Hero";
import ProductShowcase from "@/components/home/ProductShowcase";
import ProductPreview from "@/components/home/ProductPreview";
import BusinessPackagesPreview from "@/components/home/BusinessPackagesPreview";
import TrustBadges from "@/components/shop/TrustBadges";
import HowItWorks from "@/components/home/HowItWorks";
// import FreeMachineOffer from "@/components/home/FreeMachineOffer";
import FAQ from "@/components/home/FAQ";
import Testimonials from "@/components/home/Testimonials";
import { getFeaturedProducts, getCialdeProducts } from "@/lib/data/products";

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  const [featuredProducts, cialdeProducts] = await Promise.all([
    getFeaturedProducts(locale),
    getCialdeProducts(locale),
  ]);
  const classicCialde =
    cialdeProducts.find((product) => product.slug === "classic-cialde") ||
    cialdeProducts[0];

  return (
    <>
      <Hero />
      <TrustBadges />
      <ProductPreview products={featuredProducts} />
      <BusinessPackagesPreview classicCialde={classicCialde} locale={locale} />
      <HowItWorks />
      {/* <FreeMachineOffer /> */}
      <ProductShowcase />
      <Testimonials />
      <FAQ />
    </>
  );
}
