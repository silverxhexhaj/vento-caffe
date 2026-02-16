"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { getContent } from "@/data/content";

export default function CartDrawer() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations();
  const {
    items,
    isOpen,
    isSubscription,
    closeCart,
    removeItem,
    updateQuantity,
    setSubscription,
    totalItems,
    totalPrice,
    hasCialde,
    hasFreeMachine,
  } = useCart();

  const { contact } = getContent(t);

  const buildLocaleHref = (href: string) => {
    const normalized = href === "/" ? "" : href;
    return `/${locale}${normalized}`;
  };

  const lineItems = useMemo(() => {
    return items
      .map((item) => {
        const freeLabel = item.isFreeWithSubscription ? ` (${t("common.free")})` : "";
        return `- ${item.productName} x${item.quantity}${freeLabel}`;
      })
      .join("\n");
  }, [items, t]);

  const whatsappMessage = `${t("cart.whatsappIntro")}\n\n${lineItems}\n\n${t("cart.whatsappTotal", {
    total: formatPrice(totalPrice),
  })}${isSubscription ? `\n\n${t("cart.whatsappSubscriptionNote")}` : ""}`;

  const whatsappUrl = `https://wa.me/${contact.whatsappNumber.replace(/\+/g, "")}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, closeCart]);

  const handleSubscriptionToggle = () => {
    setSubscription(!isSubscription);
  };

  return (
    <div
      className={`fixed inset-0 z-[70] transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`absolute top-0 right-0 h-full w-full max-w-md bg-[var(--background)] shadow-xl transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-lg font-medium">
            {t("cart.title", { totalItems })}
          </h2>
          <button
            onClick={closeCart}
            className="p-2 -mr-2 hover:opacity-70 transition-opacity"
            aria-label={t("cart.close")}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted mb-4">{t("cart.empty")}</p>
              <Link
                href={buildLocaleHref("/shop")}
                onClick={closeCart}
                className="btn"
              >
                {t("cart.shopNow")}
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-6">
                {items.map((item) => (
                  <li
                    key={item.productSlug}
                    className="flex gap-4"
                  >
                    {/* Product Image */}
                    <div className="relative w-20 h-20 bg-[var(--border)] flex-shrink-0">
                      <Image
                        src={item.image || "/images/placeholder.svg"}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                      {item.isFreeWithSubscription && (
                        <div className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] uppercase px-2 py-0.5 font-medium">
                          {t("cart.freeBadge")}
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm uppercase tracking-wide">
                        {item.productName}
                      </h3>
                      <p className="text-xs text-muted mt-1 capitalize">
                        {item.productType === "cialde"
                          ? t("common.coffeeCialde")
                          : t("common.espressoMachine")}
                      </p>

                      {/* Quantity Controls - not for free machine */}
                      {!item.isFreeWithSubscription && (
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() =>
                              updateQuantity(item.productSlug, item.quantity - 1)
                            }
                            className="w-6 h-6 border border-[var(--border)] flex items-center justify-center hover:border-[var(--foreground)] transition-colors"
                            aria-label={t("cart.decreaseQuantity")}
                          >
                            -
                          </button>
                          <span className="text-sm w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productSlug, item.quantity + 1)
                            }
                            className="w-6 h-6 border border-[var(--border)] flex items-center justify-center hover:border-[var(--foreground)] transition-colors"
                            aria-label={t("cart.increaseQuantity")}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Price & Remove */}
                    <div className="flex flex-col items-end justify-between">
                      <span className="text-sm">
                        {item.isFreeWithSubscription ? (
                          <span className="text-green-600 font-medium">
                            {t("common.free")}
                          </span>
                        ) : (
                          formatPrice(item.price * item.quantity)
                        )}
                      </span>
                      <button
                        onClick={() => removeItem(item.productSlug)}
                        className="text-xs text-muted hover:text-[var(--foreground)] transition-colors"
                        aria-label={t("cart.remove")}
                      >
                        {t("cart.remove")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Subscription Toggle */}
              {hasCialde && (
                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSubscription}
                      onChange={handleSubscriptionToggle}
                      className="mt-0.5 w-5 h-5 border-2 border-[var(--border)] rounded-none accent-[var(--foreground)]"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-sm block">
                        {t("cart.subscribeMonthlyLabel")}
                      </span>
                      <span className="text-xs text-muted block mt-1">
                        {t("cart.subscribeMonthlyDescription")}
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[var(--border)] p-6 space-y-4">
            {hasFreeMachine && (
              <div className="flex items-center justify-between text-sm pb-4 border-b border-[var(--border)]">
                <span className="text-muted">{t("cart.machineLabel")}</span>
                <span className="text-green-600 font-medium">
                  {t("common.free")}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm uppercase tracking-wide">
                {t("cart.total")}
              </span>
              <span className="text-lg font-medium">{formatPrice(totalPrice)}</span>
            </div>
            <button
              onClick={() => {
                closeCart();
                router.push(buildLocaleHref("/checkout"));
              }}
              className="btn btn-primary w-full"
            >
              {t("cart.placeOrder")}
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn w-full inline-flex items-center justify-center gap-2 border border-[var(--border)] hover:border-[var(--foreground)] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t("cart.orderWhatsapp")}
            </a>
            <p className="text-xs text-center text-muted">
              {isSubscription ? t("cart.statusMonthly") : t("cart.statusOneTime")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
