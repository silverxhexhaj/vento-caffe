import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCialdeProducts, getMachineProduct } from "@/data/products";
import ProductCard from "@/components/shop/ProductCard";
import BusinessPackageCard from "@/components/shop/BusinessPackageCard";

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
    <div className="md:py-24 py-8">
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

        {/* Business Packages */}
        <div className="border-t border-[var(--border)] pt-16">
          <div className="mb-12">
            <h2 className="text-h2 font-serif mb-4">
              {t("shopPage.packagesTitle")}
            </h2>
            <p className="text-sm text-[var(--muted)] max-w-2xl">
              {t("shopPage.packagesSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <BusinessPackageCard
              tierName={t("shopPage.starter.name")}
              tierLabel={t("shopPage.starter.tier")}
              businessTypes={t("shopPage.starter.businessTypes")}
              quantity={t("shopPage.starter.quantity")}
              pods={t("shopPage.starter.pods")}
              price={5500}
            />
            <BusinessPackageCard
              tierName={t("shopPage.professional.name")}
              tierLabel={t("shopPage.professional.tier")}
              businessTypes={t("shopPage.professional.businessTypes")}
              quantity={t("shopPage.professional.quantity")}
              pods={t("shopPage.professional.pods")}
              price={15000}
              savings={1500}
              highlighted
            />
            <BusinessPackageCard
              tierName={t("shopPage.premium.name")}
              tierLabel={t("shopPage.premium.tier")}
              businessTypes={t("shopPage.premium.businessTypes")}
              quantity={t("shopPage.premium.quantity")}
              pods={t("shopPage.premium.pods")}
              price={42000}
              savings={2000}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
