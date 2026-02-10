"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import type { AdminProduct } from "@/lib/actions/admin";

interface LowStockAlertProps {
  products: AdminProduct[];
}

export default function LowStockAlert({ products }: LowStockAlertProps) {
  const locale = useLocale();

  const lowStockProducts = products.filter(
    (p) => (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 5) && (p.stock_quantity ?? 0) > 0
  );

  const outOfStockProducts = products.filter((p) => (p.stock_quantity ?? 0) === 0);

  const totalAlerts = lowStockProducts.length + outOfStockProducts.length;

  if (totalAlerts === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-amber-900">
            Low Stock Alert
          </h3>
          <p className="mt-1 text-sm text-amber-800">
            {totalAlerts} {totalAlerts === 1 ? "item" : "items"} {totalAlerts === 1 ? "is" : "are"}{" "}
            low on stock
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {outOfStockProducts.map((product) => (
          <li key={product.id}>
            <Link
              href={`/${locale}/admin/products/${product.id}`}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-amber-100/50 transition-colors group"
            >
              <span className="font-medium text-amber-900 group-hover:text-amber-950">
                {product.slug}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                Out of Stock
              </span>
            </Link>
          </li>
        ))}
        {lowStockProducts.map((product) => (
          <li key={product.id}>
            <Link
              href={`/${locale}/admin/products/${product.id}`}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-amber-100/50 transition-colors group"
            >
              <span className="font-medium text-amber-900 group-hover:text-amber-950">
                {product.slug}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                {product.stock_quantity ?? 0} left
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
