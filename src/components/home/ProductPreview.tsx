"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getContent } from "@/data/content";
import type { Product } from "@/lib/data/products";
import ProductCard from "@/components/shop/ProductCard";

interface ProductPreviewProps {
  products: Product[];
}

export default function ProductPreview({ products }: ProductPreviewProps) {
  const locale = useLocale();
  const t = useTranslations();
  const content = getContent(t);

  const buildLocaleHref = (href: string) => {
    const normalized = href === "/" ? "" : href;
    return `/${locale}${normalized}`;
  };

  return (
    <section className="section">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="mb-12">
          <h2 className="text-h2 font-serif">
            {content.productSection.heading}
          </h2>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
        <div className="flex justify-center">
          {/* Shop CTA */}
          <Link href={buildLocaleHref("/shop")} className="btn">
            {t("common.shop")}
          </Link>
        </div>
      </div>
    </section>
  );
}
