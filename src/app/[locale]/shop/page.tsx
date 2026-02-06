import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCialdeProducts, getMachineProduct } from "@/data/products";
import ProductCard from "@/components/shop/ProductCard";

interface ShopPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ShopPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("shopPage.metaTitle"),
    description: t("shopPage.metaDescription"),
  };
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const cialdeProducts = getCialdeProducts(t);
  const machine = getMachineProduct(t);

  return (
    <div className="md:py-16 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-h1 font-serif mb-4">{t("shopPage.title")}</h1>
        </div>

        {/* Products Grid */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {cialdeProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
            {machine && <ProductCard key={machine.slug} product={machine} />}
          </div>
        </div>
      </div>
    </div>
  );
}
