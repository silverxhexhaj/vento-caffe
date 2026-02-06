"use client";

import { useCart } from "@/lib/cart";
import { useTranslations } from "next-intl";

export default function FloatingCartButton() {
  const { totalItems, toggleCart } = useCart();
  const t = useTranslations();

  return (
    <button
      onClick={toggleCart}
      className="fixed right-4 bottom-24 md:right-6 md:bottom-6 z-[60] w-14 h-14 rounded-full bg-[var(--foreground)] text-[var(--background)] shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
      aria-label={t("cart.title", { totalItems })}
    >
      {/* Shopping bag icon */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>

      {/* Badge */}
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-[var(--background)] text-[var(--foreground)] text-xs font-semibold flex items-center justify-center px-1 border border-[var(--border)]">
          {totalItems}
        </span>
      )}
    </button>
  );
}
