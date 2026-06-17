"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { getContent } from "@/data/content";

export default function CheckoutPage() {
  const locale = useLocale();
  const t = useTranslations();
  const {
    items,
    isSubscription,
    totalPrice,
    totalItems,
    hasFreeMachine,
    clearCart,
  } = useCart();

  const { contact } = getContent(t);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string>("");

  // Customer details (collected for the WhatsApp message — no account required)
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  const buildLocaleHref = (href: string) => {
    const normalized = href === "/" ? "" : href;
    return `/${locale}${normalized}`;
  };

  const buildWhatsappUrl = () => {
    const lineItems = items
      .map((item) => {
        const freeLabel = item.isFreeWithSubscription
          ? ` (${t("common.free")})`
          : "";
        return `- ${item.productName} x${item.quantity}${freeLabel}`;
      })
      .join("\n");

    const details: string[] = [];
    if (fullName) details.push(`${t("checkout.fullName")}: ${fullName}`);
    if (phone) details.push(`${t("checkout.phone")}: ${phone}`);
    if (address) details.push(`${t("checkout.address")}: ${address}`);
    if (city) details.push(`${t("checkout.city")}: ${city}`);
    if (notes) details.push(`${t("checkout.notes")}: ${notes}`);

    const detailsBlock = details.length
      ? `\n\n${t("checkout.shippingTitle")}:\n${details.join("\n")}`
      : "";

    const message =
      `${t("cart.whatsappIntro")}\n\n${lineItems}\n\n` +
      `${t("cart.whatsappTotal", { total: formatPrice(totalPrice) })}` +
      `${isSubscription ? `\n\n${t("cart.whatsappSubscriptionNote")}` : ""}` +
      detailsBlock;

    return `https://wa.me/${contact.whatsappNumber.replace(/\+/g, "")}?text=${encodeURIComponent(
      message
    )}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const url = buildWhatsappUrl();
    setWhatsappUrl(url);

    // Open WhatsApp with the prefilled order message
    window.open(url, "_blank", "noopener,noreferrer");

    // Clear the cart locally and show confirmation
    clearCart();
    setOrderSent(true);
    setIsSubmitting(false);
  };

  // Success state — order handed off to WhatsApp
  if (orderSent) {
    return (
      <div className="md:py-24 py-8">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#25D366]/15 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <h1 className="text-h2 font-serif mb-4">
              {t("checkout.whatsappSuccessTitle")}
            </h1>
            <p className="text-muted mb-8">
              {t("checkout.whatsappSuccessMessage")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white border-none"
              >
                {t("checkout.openWhatsapp")}
              </a>
              <Link href={buildLocaleHref("/shop")} className="btn">
                {t("checkout.continueShopping")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="md:py-24 py-8">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
          <div className="max-w-lg mx-auto text-center py-16">
            <p className="text-muted mb-6">{t("checkout.emptyCart")}</p>
            <Link href={buildLocaleHref("/shop")} className="btn btn-primary">
              {t("common.shopNow")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main checkout form — collects details and hands the order off to WhatsApp
  return (
    <div className="md:py-24 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <h1 className="text-h1 font-serif mb-3">{t("checkout.title")}</h1>
        <p className="text-muted mb-8 max-w-2xl">
          {t("checkout.whatsappIntroNote")}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Details Form - Left */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} id="checkout-form">
              <h2 className="text-h3 font-serif mb-6">
                {t("checkout.shippingTitle")}
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm mb-1">
                      {t("checkout.fullName")} *
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input"
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm mb-1">
                      {t("checkout.phone")} *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input"
                      required
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm mb-1">
                    {t("checkout.address")}
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input"
                    autoComplete="street-address"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm mb-1">
                    {t("checkout.city")}
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input"
                    autoComplete="address-level2"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm mb-1">
                    {t("checkout.notes")}
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input min-h-[80px] resize-y"
                    placeholder={t("checkout.notesPlaceholder")}
                    rows={3}
                  />
                </div>
              </div>

              {/* Submit button - visible on mobile below the form */}
              <div className="mt-8 lg:hidden">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white border-none"
                >
                  {isSubmitting
                    ? t("checkout.submitting")
                    : t("checkout.sendOrder")}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary - Right */}
          <div className="lg:col-span-1">
            <div className="border border-[var(--border)] p-6 lg:sticky lg:top-24">
              <h2 className="text-h3 font-serif mb-6">
                {t("checkout.orderSummary")}
              </h2>

              <ul className="space-y-4 mb-6">
                {items.map((item) => (
                  <li key={item.productSlug} className="flex gap-3">
                    <div className="relative w-14 h-14 bg-[var(--border)] flex-shrink-0">
                      <Image
                        src={item.image || "/images/placeholder.svg"}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs text-muted">x{item.quantity}</p>
                    </div>
                    <span className="text-sm flex-shrink-0">
                      {item.isFreeWithSubscription ? (
                        <span className="text-green-600 font-medium">
                          {t("checkout.freeItem")}
                        </span>
                      ) : (
                        formatPrice(item.price * item.quantity)
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {hasFreeMachine && (
                <div className="flex items-center justify-between text-sm pb-4 mb-4 border-b border-[var(--border)]">
                  <span className="text-muted">{t("cart.machineLabel")}</span>
                  <span className="text-green-600 font-medium">
                    {t("common.free")}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 mb-2">
                <span className="text-sm uppercase tracking-wide">
                  {t("cart.total")}
                </span>
                <span className="text-lg font-medium">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <p className="text-xs text-muted mb-6">
                {isSubscription
                  ? t("checkout.subscription")
                  : t("checkout.oneTime")}
                {" · "}
                {t("checkout.items", { count: totalItems })}
              </p>

              {/* Submit button - visible on desktop in sidebar */}
              <div className="hidden lg:block">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting}
                  className="btn w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white border-none"
                >
                  {isSubmitting
                    ? t("checkout.submitting")
                    : t("checkout.sendOrder")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
