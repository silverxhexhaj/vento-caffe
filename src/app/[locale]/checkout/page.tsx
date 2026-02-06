"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth, AuthModal } from "@/components/auth";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { getProductBySlug } from "@/data/products";
import { createOrder } from "@/lib/actions/orders";
import { clearServerCart } from "@/lib/actions/cart";
import { getProfile } from "@/lib/actions/profile";
import type { ShippingAddress } from "@/lib/actions/orders";

export default function CheckoutPage() {
  const locale = useLocale();
  const t = useTranslations();
  const { user, isLoading: authLoading } = useAuth();
  const {
    items,
    isSubscription,
    totalPrice,
    totalItems,
    hasFreeMachine,
    clearCart,
  } = useCart();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  // Shipping form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Albania");
  const [notes, setNotes] = useState("");

  const buildLocaleHref = (href: string) => {
    const normalized = href === "/" ? "" : href;
    return `/${locale}${normalized}`;
  };

  // Pre-fill from profile when user is available
  useEffect(() => {
    if (!user) return;

    const loadProfileData = async () => {
      const { profile, email: userEmail } = await getProfile();
      if (profile?.default_shipping_address) {
        const addr = profile.default_shipping_address;
        setFullName(addr.fullName || profile.full_name || "");
        setEmail(addr.email || userEmail || "");
        setPhone(addr.phone || profile.phone || "");
        setAddress(addr.address || "");
        setCity(addr.city || "");
        setPostalCode(addr.postalCode || "");
        setCountry(addr.country || "Albania");
      } else {
        // At least fill name and email from profile/auth
        setFullName(profile?.full_name || "");
        setEmail(userEmail || "");
        setPhone(profile?.phone || "");
      }
    };

    loadProfileData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const shippingAddress: ShippingAddress = {
        fullName,
        email,
        phone,
        address,
        city,
        postalCode,
        country,
      };

      const orderItems = items.map((item) => ({
        productSlug: item.productSlug,
        quantity: item.quantity,
        priceAtPurchase: item.price,
        isFree: item.isFreeWithSubscription ?? false,
      }));

      const result = await createOrder({
        items: orderItems,
        total: totalPrice,
        isSubscription,
        shippingAddress,
        notes: notes || undefined,
      });

      if (!result.success) {
        setError(result.error || t("checkout.errorGeneric"));
        setIsSubmitting(false);
        return;
      }

      // Clear cart on success
      clearCart();
      await clearServerCart();
      setSuccessOrderId(result.orderId || null);
    } catch {
      setError(t("checkout.errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="md:py-16 py-8">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted">{t("auth.loading")}</div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (successOrderId) {
    return (
      <div className="md:py-16 py-8">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-h2 font-serif mb-4">
              {t("checkout.successTitle")}
            </h1>
            <p className="text-muted mb-8">{t("checkout.successMessage")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={buildLocaleHref("/profile")}
                className="btn btn-primary"
              >
                {t("checkout.viewOrders")}
              </Link>
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
      <div className="md:py-16 py-8">
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

  // Not logged in state
  if (!user) {
    return (
      <div className="md:py-16 py-8">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
          <h1 className="text-h1 font-serif mb-8">{t("checkout.title")}</h1>
          <div className="max-w-lg mx-auto text-center py-16 border border-[var(--border)]">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-muted mb-6">{t("checkout.loginRequired")}</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="btn btn-primary"
            >
              {t("checkout.loginButton")}
            </button>
          </div>
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialMode="login"
          />
        </div>
      </div>
    );
  }

  // Main checkout form
  return (
    <div className="md:py-16 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <h1 className="text-h1 font-serif mb-8">{t("checkout.title")}</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Shipping Form - Left */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} id="checkout-form">
              <h2 className="text-h3 font-serif mb-6">
                {t("checkout.shippingTitle")}
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm mb-1"
                    >
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
                    <label htmlFor="email" className="block text-sm mb-1">
                      {t("checkout.email")} *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                      required
                      autoComplete="email"
                    />
                  </div>
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

                <div>
                  <label htmlFor="address" className="block text-sm mb-1">
                    {t("checkout.address")} *
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input"
                    required
                    autoComplete="street-address"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm mb-1">
                      {t("checkout.city")} *
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="input"
                      required
                      autoComplete="address-level2"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="postalCode"
                      className="block text-sm mb-1"
                    >
                      {t("checkout.postalCode")}
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="input"
                      autoComplete="postal-code"
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm mb-1">
                      {t("checkout.country")} *
                    </label>
                    <input
                      id="country"
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="input"
                      required
                      autoComplete="country-name"
                    />
                  </div>
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
                  className="btn btn-primary w-full"
                >
                  {isSubmitting
                    ? t("checkout.submitting")
                    : t("checkout.submitOrder")}
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
                        {getProductBySlug(item.productSlug, t)?.name ||
                          item.productName}
                      </p>
                      <p className="text-xs text-muted">
                        x{item.quantity}
                      </p>
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
                  className="btn btn-primary w-full"
                >
                  {isSubmitting
                    ? t("checkout.submitting")
                    : t("checkout.submitOrder")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
