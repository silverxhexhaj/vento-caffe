import Hero from "@/components/home/Hero";
import ProductShowcase from "@/components/home/ProductShowcase";
import ProductPreview from "@/components/home/ProductPreview";
import TrustBadges from "@/components/shop/TrustBadges";
import { getFeaturedProducts } from "@/lib/data/products";

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  const featuredProducts = await getFeaturedProducts(locale);

  return (
    <>
      <Hero />
      <TrustBadges />
      <ProductPreview products={featuredProducts} />
      <ProductShowcase />
    </>
  );
}
