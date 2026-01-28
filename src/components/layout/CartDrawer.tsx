"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { grindOptions } from "@/data/products";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    totalItems,
    totalPrice,
  } = useCart();

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

  const getGrindLabel = (grindId: string) => {
    return grindOptions.find((g) => g.id === grindId)?.label || grindId;
  };

  const handleCheckout = () => {
    alert("Checkout functionality coming soon! This is a demo site.");
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
          <h2 className="text-lg font-medium">Cart ({totalItems})</h2>
          <button
            onClick={closeCart}
            className="p-2 -mr-2 hover:opacity-70 transition-opacity"
            aria-label="Close cart"
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
              <p className="text-muted mb-4">Your cart is empty</p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="btn"
              >
                Shop Now
              </Link>
            </div>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li
                  key={`${item.productSlug}-${item.grind}`}
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
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm uppercase tracking-wide">
                      {item.productName}
                    </h3>
                    <p className="text-xs text-muted mt-1">
                      {getGrindLabel(item.grind)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() =>
                          updateQuantity(item.productSlug, item.grind, item.quantity - 1)
                        }
                        className="w-6 h-6 border border-[var(--border)] flex items-center justify-center hover:border-[var(--foreground)] transition-colors"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="text-sm w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productSlug, item.grind, item.quantity + 1)
                        }
                        className="w-6 h-6 border border-[var(--border)] flex items-center justify-center hover:border-[var(--foreground)] transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Price & Remove */}
                  <div className="flex flex-col items-end justify-between">
                    <span className="text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.productSlug, item.grind)}
                      className="text-xs text-muted hover:text-[var(--foreground)] transition-colors"
                      aria-label="Remove item"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[var(--border)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm uppercase tracking-wide">Total</span>
              <span className="text-lg font-medium">{formatPrice(totalPrice)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="btn btn-primary w-full"
            >
              Checkout
            </button>
            <p className="text-xs text-center text-muted">
              Shipping calculated at checkout
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
