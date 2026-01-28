import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getContent } from "@/data/content";
import { getFeaturedProducts } from "@/data/products";
import ProductCard from "@/components/shop/ProductCard";

export default function ProductPreview() {
  const locale = useLocale();
  const t = useTranslations();
  const content = getContent(t);
  const featuredProducts = getFeaturedProducts(t);

  const buildLocaleHref = (href: string) => {
    const normalized = href === "/" ? "" : href;
    return `/${locale}${normalized}`;
  };

  return (
    <section className="section">
      <div className="container">
        {/* Section Header */}
        <div className="mb-12">
          <p className="text-h3 text-muted mb-0">
            {content.productSection.preHeading}
          </p>
          <h2 className="text-h1 font-serif">
            {content.productSection.heading}
          </h2>
          <p className="text-h1 font-serif text-muted">
            {content.productSection.subHeading}
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>

        {/* Shop CTA */}
        <Link href={buildLocaleHref("/shop")} className="btn">
          {t("common.shop")}
        </Link>
      </div>
    </section>
  );
}
