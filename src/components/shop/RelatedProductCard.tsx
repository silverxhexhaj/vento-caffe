"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Product } from "@/data/products";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";

interface RelatedProductCardProps {
  product: Product;
}

export default function RelatedProductCard({ product }: RelatedProductCardProps) {
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const locale = useLocale();
  const t = useTranslations();

  const buildLocaleHref = (href: string) => {
    const normalized = href === "/" ? "" : href;
    return `/${locale}${normalized}`;
  };

  const handleAddToCart = () => {
    if (product.soldOut) return;

    addItem({
      productSlug: product.slug,
      productName: product.name,
      productType: product.type,
      quantity: 1,
      price: product.price,
      image: product.images[0] || "/images/placeholder.svg",
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-[var(--border)] last:border-b-0">
      {/* Small Thumbnail */}
      <Link
        href={buildLocaleHref(`/shop/${product.slug}`)}
        className="relative w-16 h-16 flex-shrink-0 bg-[var(--border)] overflow-hidden"
      >
        <Image
          src={product.images[0] || "/images/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover"
          sizes="64px"
        />
      </Link>

      {/* Name & Price */}
      <div className="flex-1 min-w-0">
        <Link
          href={buildLocaleHref(`/shop/${product.slug}`)}
          className="text-sm font-medium block truncate hover:underline"
        >
          {product.name}
        </Link>
        <p className="text-sm text-muted">{formatPrice(product.price)}</p>
      </div>

      {/* Add Button */}
      {!product.soldOut ? (
        <button
          onClick={handleAddToCart}
          className={`flex-shrink-0 w-9 h-9 flex items-center justify-center border transition-colors ${
            added
              ? "border-green-600 text-green-600"
              : "border-[var(--border)] hover:border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
          }`}
          aria-label={t("productDetail.relatedProductAdd")}
        >
          {added ? (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
            </svg>
          )}
        </button>
      ) : (
        <span className="text-xs text-muted uppercase tracking-wide flex-shrink-0">
          {t("productCard.soldOut")}
        </span>
      )}
    </div>
  );
}
