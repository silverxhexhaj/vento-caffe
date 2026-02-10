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
  const classicCialde =
    cialdeProducts.find((product) => product.slug === "classic-cialde") ||
    cialdeProducts[0];
  const businessPackages = [
    {
      key: "package2",
      boxes: 2,
      perBoxPrice: 5500,
      businessImage: "/images/categories/office.png",
    },
    {
      key: "package4",
      boxes: 4,
      perBoxPrice: 5400,
      businessImage: "/images/categories/salon.png",
    },
    {
      key: "package6",
      boxes: 6,
      perBoxPrice: 5300,
      businessImage: "/images/categories/coworking.png",
    },
    {
      key: "package8",
      boxes: 8,
      perBoxPrice: 5200,
      businessImage: "/images/categories/hotel.png",
    },
    {
      key: "package10",
      boxes: 10,
      perBoxPrice: 5000,
      businessImage: "/images/categories/restaurant.png",
    },
  ];

  return (
    <div className="md:py-24 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-h1 font-serif mb-4">{t("shopPage.title")}</h1>
        </div>

        {/* Products Grid */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
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
            <p className="text-sm text-[var(--muted)]">
              {t("shopPage.packagesSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {businessPackages.map((pkg) => (
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
