"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { useTranslations } from "next-intl";

interface BusinessPackageCardProps {
  tierName: string;
  tierLabel: string;
  businessTypes: string;
  quantity: string;
  pods: string;
  expressMachine: string;
  expressPrice: string;
  boxes: number;
  perBoxPrice: number;
  productName: string;
  productImage: string;
  businessImage: string;
  highlighted?: boolean;
}

export default function BusinessPackageCard({
  tierName,
  tierLabel,
  businessTypes,
  quantity,
  pods,
  boxes,
  perBoxPrice,
  productName,
  productImage,
  businessImage,
  highlighted = false,
}: BusinessPackageCardProps) {
  const t = useTranslations("shopPage");
  const { addItem, setSubscription } = useCart();
  const totalPrice = boxes * perBoxPrice;

  const handleAddPackageToCart = () => {
    addItem({
      productSlug: "classic-cialde",
      productName,
      productType: "cialde",
      quantity: boxes,
      price: perBoxPrice,
      image: productImage || "/images/placeholder.svg"
    });
    setSubscription(true);
  };

  return (
    <div
      className={`relative flex flex-col p-6 border transition-all duration-200 ${
        highlighted
          ? "border-[var(--foreground)] shadow-[0_0_0_1px_var(--foreground)]"
          : "border-[var(--border)] hover:border-[var(--foreground)]"
      }`}
    >
      {/* Most Popular Badge */}
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-[var(--foreground)] text-[var(--background)] px-4 py-1 text-xs uppercase tracking-wider whitespace-nowrap">
            {t("packagesMostPopular")}
          </span>
        </div>
      )}

      {/* Business Types */}
      <div className="relative w-full aspect-[16/9] mb-4 overflow-hidden">
        <Image
          src={businessImage}
          alt={businessTypes}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
      </div>

      {/* Price */}
      <div className="mb-8 mt-auto">
        <div className="flex items-baseline gap-1">
          <span className="text-h3 font-serif">{formatPrice(perBoxPrice)}</span>
          <span className="text-xs text-[var(--muted)]">
            {t("packagesPerBox")}
          </span>
        </div>
        <p className="text-sm text-[var(--foreground)] mt-2 font-medium">
          {t("packagesTotalPerMonth", { amount: formatPrice(totalPrice) })}
        </p>
      </div>


      {/* Quantity & Pods */}
      <div className="mb-6 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">{quantity}</span>
          <span className="text-xs text-[var(--muted)]">{pods}</span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        type="button"
        className={`w-full text-center ${highlighted ? "btn-primary" : "btn"}`}
        onClick={handleAddPackageToCart}
      >
        {t("packagesCta")}
      </button>
      <div className="mt-2 text-center">
        <p className="text-xs tracking-wide text-green-700 font-medium">
          {t("packagesMachineIncluded")}
        </p>
      </div>
    </div>
  );
}
