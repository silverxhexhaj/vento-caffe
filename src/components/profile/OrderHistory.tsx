"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import OrderCard from "./OrderCard";

interface OrderHistoryProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orders: any[];
}

export default function OrderHistory({ orders }: OrderHistoryProps) {
  const t = useTranslations("profile.orders");
  const locale = useLocale();

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="mx-auto mb-4 opacity-30"
        >
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        <p className="text-muted mb-4">{t("empty")}</p>
        <Link
          href={`/${locale}/shop`}
          className="inline-block px-6 py-2.5 bg-[var(--foreground)] text-[var(--background)] text-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          {t("shopNow")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
