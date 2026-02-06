"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import StatusBadge from "./StatusBadge";
import type { AdminOrder } from "@/lib/actions/admin";

interface OrdersTableProps {
  orders: AdminOrder[];
  compact?: boolean;
}

export default function OrdersTable({ orders, compact = false }: OrdersTableProps) {
  const locale = useLocale();

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
        <p className="text-sm">No orders found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Order</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Client</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Status</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Total</th>
            {!compact && (
              <th className="text-left py-3 px-4 font-medium text-neutral-500">Items</th>
            )}
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Date</th>
            <th className="text-right py-3 px-4 font-medium text-neutral-500"></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <td className="py-3 px-4">
                <span className="font-mono text-xs text-neutral-600">
                  {order.id.slice(0, 8)}...
                </span>
                {order.is_subscription && (
                  <span className="ml-2 text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                    Sub
                  </span>
                )}
              </td>
              <td className="py-3 px-4">
                <p className="font-medium text-neutral-900">
                  {order.profiles?.full_name || "Unknown"}
                </p>
                {order.profiles?.phone && (
                  <p className="text-xs text-neutral-400">{order.profiles.phone}</p>
                )}
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={order.status} />
              </td>
              <td className="py-3 px-4 font-medium">
                &euro;{Number(order.total).toFixed(2)}
              </td>
              {!compact && (
                <td className="py-3 px-4 text-neutral-500">
                  {order.order_items?.length ?? 0} items
                </td>
              )}
              <td className="py-3 px-4 text-neutral-500">
                {new Date(order.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="py-3 px-4 text-right">
                <Link
                  href={`/${locale}/admin/orders/${order.id}`}
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900 underline-offset-2 hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
