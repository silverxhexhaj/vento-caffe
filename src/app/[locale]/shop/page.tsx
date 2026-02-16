import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCialdeProducts, getMachineProduct } from "@/lib/data/products";
import { BUSINESS_PACKAGES } from "@/lib/data/businessPackages";
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
  const cialdeProducts = await getCialdeProducts(locale);
  const machine = await getMachineProduct(locale);
  const classicCialde =
    cialdeProducts.find((product) => product.slug === "classic-cialde") ||
    cialdeProducts[0];

  return (
    <div className="md:py-24 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-h1 font-serif mb-4">{t("shopPage.title")}</h1>
        </div>

        {/* Products Grid */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cialdeProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
            {machine && <ProductCard key={machine.slug} product={machine} />}
          </div>
        </div>

        {/* Business Packages */}
        <div id="packages" className="border-t border-[var(--border)] pt-16">
          <div className="mb-12">
            <h2 className="text-h2 font-serif mb-4">
              {t("shopPage.packagesTitle")}
            </h2>
            <p className="text-sm text-[var(--muted)]">
              {t("shopPage.packagesSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BUSINESS_PACKAGES.map((pkg) => (
              <BusinessPackageCard
                key={pkg.key}
                tierName={t(`shopPage.${pkg.key}.name`)}
                tierLabel={t(`shopPage.${pkg.key}.tier`)}
                businessTypes={t(`shopPage.${pkg.key}.businessTypes`)}
                quantity={t(`shopPage.${pkg.key}.quantity`)}
                pods={t(`shopPage.${pkg.key}.pods`)}
                boxes={pkg.boxes}
                perBoxPrice={pkg.perBoxPrice}
                productName={classicCialde?.name || "Classic Cialde"}
                productImage={
                  classicCialde?.images[0] || "/images/placeholder.svg"
                }
                businessImage={pkg.businessImage}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
