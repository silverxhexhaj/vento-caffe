"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/lib/actions/admin";

const statusFlow = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

interface OrderStatusControlProps {
  orderId: string;
  currentStatus: string;
}

export default function OrderStatusControl({
  orderId,
  currentStatus,
}: OrderStatusControlProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = (newStatus: string) => {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus);
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  if (currentStatus === "cancelled") {
    return (
      <p className="text-sm text-red-600 font-medium">Order Cancelled</p>
    );
  }

  const currentIndex = statusFlow.indexOf(currentStatus);

  return (
    <div className="space-y-3">
      {/* Status stepper */}
      <div className="flex items-center gap-1">
        {statusFlow.map((status, idx) => (
          <div key={status} className="flex items-center">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                idx <= currentIndex
                  ? "bg-neutral-900"
                  : "bg-neutral-200"
              }`}
            />
            {idx < statusFlow.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  idx < currentIndex
                    ? "bg-neutral-900"
                    : "bg-neutral-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {currentStatus !== "delivered" && (
          <>
            {currentIndex < statusFlow.length - 1 && (
              <button
                onClick={() => handleStatusChange(statusFlow[currentIndex + 1])}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Updating..." : `Move to ${statusFlow[currentIndex + 1]}`}
              </button>
            )}
            <button
              onClick={() => handleStatusChange("cancelled")}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Cancel Order
            </button>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
