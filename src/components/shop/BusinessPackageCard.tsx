"use client";

import { formatPrice } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface BusinessPackageCardProps {
  tierName: string;
  tierLabel: string;
  businessTypes: string;
  quantity: string;
  pods: string;
  price: number;
  savings?: number;
  highlighted?: boolean;
}

export default function BusinessPackageCard({
  tierName,
  tierLabel,
  businessTypes,
  quantity,
  pods,
  price,
  savings,
  highlighted = false,
}: BusinessPackageCardProps) {
  const t = useTranslations("shopPage");

  return (
    <div
      className={`relative flex flex-col p-8 border transition-all duration-200 ${
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

      {/* Tier Label */}
      <div className="mb-6">
        <h3 className="text-lg font-medium tracking-wide uppercase mb-1">
          {tierName}
        </h3>
        <p className="text-xs uppercase tracking-widest text-[var(--muted)]">
          {tierLabel}
        </p>
      </div>

      {/* Business Types */}
      <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
        {businessTypes}
      </p>

      {/* Divider */}
      <div className="w-full h-px bg-[var(--border)] mb-6" />

      {/* Quantity & Pods */}
      <div className="mb-6 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">{quantity}</span>
          <span className="text-xs text-[var(--muted)]">{pods}</span>
        </div>
      </div>

      {/* Price */}
      <div className="mb-8 mt-auto">
        <div className="flex items-baseline gap-1">
          <span className="text-h3 font-serif">{formatPrice(price)}</span>
          <span className="text-xs text-[var(--muted)]">
            {t("packagesPerMonth")}
          </span>
        </div>
        {savings && (
          <p className="text-sm text-[var(--foreground)] mt-2 font-medium">
            {t("packagesSave", { amount: formatPrice(savings) })}
          </p>
        )}
      </div>

      {/* CTA Button */}
      <a
        href="https://wa.me/355689188161"
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full text-center ${
          highlighted ? "btn-primary" : "btn"
        } btn`}
      >
        {t("packagesCta")}
      </a>
    </div>
  );
}
