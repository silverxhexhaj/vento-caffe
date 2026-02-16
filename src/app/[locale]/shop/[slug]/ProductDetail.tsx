"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Product } from "@/data/products";
import { getContent } from "@/data/content";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import ProductGallery from "@/components/shop/ProductGallery";
import QuantityStepper from "@/components/shop/QuantityStepper";
import RelatedProductCard from "@/components/shop/RelatedProductCard";
import MachineSpecsSection from "@/components/shop/MachineSpecsSection";

interface ProductDetailProps {
  product: Product;
  otherProducts: Product[];
} 

export default function ProductDetail({ product, otherProducts }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [wantsSubscription, setWantsSubscription] = useState(false);
  const { addItem, setSubscription } = useCart();
  const locale = useLocale();
  const t = useTranslations();

  const isMachine = product.type === "machine";
  const isCialde = product.type === "cialde";
  const { freeMachineOffer } = getContent(t);

  const buildLocaleHref = (href: string) => {
    const normalized = href === "/" ? "" : href;
    return `/${locale}${normalized}`;
  };

  const whatsappUrl = `https://wa.me/${freeMachineOffer.whatsappNumber.replace(/\+/g, "")}?text=${encodeURIComponent(
    freeMachineOffer.whatsappMessage
  )}`;

  const handleAddToCart = () => {
    if (product.soldOut) return;

    addItem({
      productSlug: product.slug,
      productName: product.name,
      productType: product.type,
      quantity,
      price: product.price,
      image: product.images[0] || "/images/placeholder.svg",
    });

    // If user selected subscription, enable it in cart
    if (wantsSubscription && isCialde) {
      setSubscription(true);
    }
  };

  const handleSubscriptionToggle = () => {
    setWantsSubscription(!wantsSubscription);
  };

  return (
    <div className="md:py-24 py-8 relative">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 relative">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link
            href={buildLocaleHref("/shop")}
            className="text-muted hover:text-[var(--foreground)] transition-colors"
          >
            {t("productDetail.breadcrumbShop")}
          </Link>
          <span className="mx-2 text-muted">/</span>
          <span>{product.name}</span>
        </nav>

        {/* Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 relative">
          <div className="col-span-3 space-y-8">
            {/* Left: Gallery */}
            <ProductGallery images={product.images} productName={product.name} />

              {/* Description */}
            <p className="text-muted leading-relaxed">{product.description}</p>

              {/* Highlights */}
              {product.highlights && (
                <ul className="space-y-2">
                  {product.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-center gap-3 text-sm">
                      <svg
                        className="w-4 h-4 text-muted flex-shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {highlight}
                    </li>
                  ))}
                </ul>
              )}

              {/* Machine specs (Didiesse content) */}
              {isMachine && <MachineSpecsSection />}

          </div>

          {/* Right: Product Info */}
          <div className="col-span-2 sticky top-0 relative">
            <div className="sticky top-18 space-y-8">
              {/* Name & Contents */}
              <div>
                <h1 className="text-h1 font-serif mb-2">{product.name}</h1>
                {product.contents && (
                  <p className="text-lg text-muted">{product.contents}</p>
                )}
              </div>

              {/* Price */}
              <div>
                {product.soldOut ? (
                  <p className="text-h3 text-muted">{t("productDetail.soldOut")}</p>
                ) : isMachine ? (
                  <div>
                    <p className="text-h3">{formatPrice(product.price)}</p>
                    <p className="text-sm text-muted mt-1">
                      {t("productDetail.freeWithMonthlySubscription")}
                    </p>
                  </div>
                ) : (
                  <p className="text-h3">{formatPrice(product.price)}</p>
                )}
              </div>


              {/* You May Also Like */}
              {otherProducts.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-h3 font-serif mb-4">
                    {t("productDetail.youMayAlsoLike")}
                  </h2>
                  <div className="border-t border-[var(--border)]">
                    {otherProducts.map((otherProduct) => (
                      <RelatedProductCard
                        key={otherProduct.slug}
                        product={otherProduct}
                      />
                    ))}
                  </div>
                </div>
        )}

              {/* Subscription Option for Cialde */}
              {!product.soldOut && isCialde && (
                <div className="border border-[var(--border)] p-6">
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wantsSubscription}
                      onChange={handleSubscriptionToggle}
                      className="mt-1 w-5 h-5 border-2 border-[var(--border)] rounded-none accent-[var(--foreground)]"
                    />
                    <div className="flex-1">
                      <span className="font-medium block mb-1">
                        {t("productDetail.subscribeMonthlyHeadline")}
                      </span>
                      <span className="text-sm text-muted block">
                        {t("productDetail.subscribeMonthlyDescription")}
                      </span>
                    </div>
                  </label>

                  {wantsSubscription && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted">{t("productDetail.machineLabel")}</span>
                        <span className="font-medium text-green-600">
                          {t("productDetail.machineFree")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Machine-specific CTA */}
              {!product.soldOut && isMachine && (
                <div className="border border-[var(--border)] p-6 bg-[var(--foreground)]/5">
                  <p className="font-medium mb-2">
                    {t("productDetail.machineCtaTitle")}
                  </p>
                  <p className="text-sm text-muted mb-4">
                    {t("productDetail.machineCtaDescription")}
                  </p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {t("common.contactUsAboutSubscription")}
                  </a>
                </div>
              )}

              {/* Quantity & Add to Cart */}
              {!product.soldOut && (
                <div className="space-y-4">
                  <QuantityStepper
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                  />
                  <button
                    onClick={handleAddToCart}
                    className="btn btn-primary w-full"
                  >
                    {t("productDetail.addToCart", {
                      price: formatPrice(product.price * quantity),
                    })}
                  </button>

                  {wantsSubscription && isCialde && (
                    <p className="text-xs text-center text-muted">
                      {t("productDetail.freeAddedNote")}
                    </p>
                  )}
                </div>
              )}

              {/* Sold Out State */}
              {product.soldOut && (
                <div className="space-y-4">
                  <button
                    disabled
                    className="btn w-full opacity-50 cursor-not-allowed"
                  >
                    {t("productDetail.soldOutButton")}
                  </button>
                  <p className="text-sm text-muted text-center">
                    {t("productDetail.soldOutNote")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* Product Type Indicator */}
        {/* <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-2">
              {t("productDetail.typeLabel")}
            </p>
            <p className="text-sm capitalize">
              {product.type === "cialde"
                ? t("common.coffeeCialde")
                : t("common.espressoMachine")}
            </p>
          </div>
          {product.contents && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted mb-2">
                {t("productDetail.contentsLabel")}
              </p>
              <p className="text-sm">{product.contents}</p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-2">
              {t("productDetail.deliveryLabel")}
            </p>
            <p className="text-sm">{t("productDetail.deliveryValue")}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-2">
              {t("productDetail.subscriptionLabel")}
            </p>
            <p className="text-sm">
              {isCialde
                ? t("productDetail.subscriptionMonthly")
                : t("productDetail.subscriptionFreeMonthly")}
            </p>
          </div>
        </div> */}
      </div>
    </div>
  );
}
