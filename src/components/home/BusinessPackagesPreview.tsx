import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BUSINESS_PACKAGES } from "@/lib/data/businessPackages";
import BusinessPackageCard from "@/components/shop/BusinessPackageCard";
import type { Product } from "@/lib/data/products";

interface BusinessPackagesPreviewProps {
  classicCialde: Product | undefined;
  locale: string;
}

export default async function BusinessPackagesPreview({
  classicCialde,
  locale,
}: BusinessPackagesPreviewProps) {
  const t = await getTranslations({ locale });

  return (
    <section className="section">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="mb-12">
          <h2 className="text-h2 font-serif mb-4">
            {t("shopPage.packagesTitle")}
          </h2>
          <p className="text-sm text-[var(--muted)]">
            {t("shopPage.packagesSubtitle")}
          </p>
        </div>

        {/* Business Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
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

        <div className="flex justify-center">
          <Link href={`/${locale}/shop#packages`} className="btn">
            {t("common.shop")}
          </Link>
        </div>
      </div>
    </section>
  );
}
