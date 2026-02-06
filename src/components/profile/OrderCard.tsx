"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import OrderStatusBadge from "./OrderStatusBadge";
import { cancelOrder } from "@/lib/actions/orders";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

interface OrderItemProduct {
  slug: string;
  name_key: string;
  images: string[];
}

interface OrderItemData {
  id: string;
  quantity: number;
  price_at_purchase: number;
  is_free: boolean;
  products: OrderItemProduct | null;
}

interface ShippingAddressData {
  fullName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

interface OrderData {
  id: string;
  status: OrderStatus;
  total: number;
  is_subscription: boolean;
  shipping_address: ShippingAddressData;
  notes: string | null;
  created_at: string;
  order_items: OrderItemData[];
}

interface OrderCardProps {
  order: OrderData;
}

export default function OrderCard({ order }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const t = useTranslations("profile.orders");
  const tProducts = useTranslations();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} Lekë`;
  };

  const getProductName = (item: OrderItemData): string => {
    if (!item.products) return "Unknown Product";
    const nameKey = item.products.name_key;
    try {
      return tProducts(nameKey);
    } catch {
      return nameKey;
    }
  };

  const handleCancel = async () => {
    if (!confirm(t("cancelConfirm"))) return;
    setCancelling(true);
    await cancelOrder(order.id);
    setCancelling(false);
  };

  const itemCount = order.order_items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div className="border border-[var(--border)] transition-colors">
      {/* Summary row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-4 flex items-center justify-between gap-4 hover:bg-[var(--border)]/20 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="text-left min-w-0">
            <p className="text-sm font-medium truncate">
              {t("orderNumber", { id: order.id.slice(0, 8) })}
            </p>
            <p className="text-xs text-muted">{formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {order.is_subscription && (
            <span className="hidden sm:inline text-xs text-muted uppercase tracking-wide">
              {t("subscription")}
            </span>
          )}
          <OrderStatusBadge status={order.status} />
          <span className="text-sm font-medium whitespace-nowrap">
            {formatPrice(order.total)}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--border)]">
          {/* Order items */}
          <div className="mt-4 space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-muted">
              {t("items")}
            </h4>
            {order.order_items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  {item.products?.images?.[0] && (
                    <div className="w-10 h-10 bg-[var(--border)]/30 flex-shrink-0">
                      <img
                        src={item.products.images[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-sm">{getProductName(item)}</p>
                    <p className="text-xs text-muted">x{item.quantity}</p>
                  </div>
                </div>
                <p className="text-sm">
                  {item.is_free ? (
                    <span className="text-green-600 uppercase text-xs font-medium">
                      Free
                    </span>
                  ) : (
                    formatPrice(item.price_at_purchase * item.quantity)
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Shipping address */}
          {order.shipping_address && (
            <div className="mt-4 pt-4 border-t border-[var(--border)]/50">
              <h4 className="text-xs uppercase tracking-widest text-muted mb-2">
                {t("shippingAddress")}
              </h4>
              <p className="text-sm">
                {order.shipping_address.fullName && (
                  <>{order.shipping_address.fullName}<br /></>
                )}
                {order.shipping_address.address && (
                  <>{order.shipping_address.address}<br /></>
                )}
                {(order.shipping_address.city || order.shipping_address.postalCode) && (
                  <>
                    {[order.shipping_address.city, order.shipping_address.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                    <br />
                  </>
                )}
                {order.shipping_address.country}
              </p>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="mt-4 pt-4 border-t border-[var(--border)]/50">
              <h4 className="text-xs uppercase tracking-widest text-muted mb-2">
                {t("notes")}
              </h4>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}

          {/* Summary row */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]/50 flex items-center justify-between">
            <div className="text-sm text-muted">
              {itemCount} {t("items").toLowerCase()} &middot;{" "}
              {order.is_subscription ? t("subscription") : t("oneTime")}
            </div>

            {order.status === "pending" && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {t("cancel")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
