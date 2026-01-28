import Hero from "@/components/home/Hero";
import BrandStatement from "@/components/home/BrandStatement";
import ProductPreview from "@/components/home/ProductPreview";
import LifestyleBlock from "@/components/home/LifestyleBlock";
import StoresPreview from "@/components/home/StoresPreview";
import PlaylistSection from "@/components/home/PlaylistSection";

export default function Home() {
  return (
    <>
      <Hero />
      <BrandStatement />
      <ProductPreview />
      <LifestyleBlock />
      <StoresPreview />
      <PlaylistSection />
    </>
  );
}
