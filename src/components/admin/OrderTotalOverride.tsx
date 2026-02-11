"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderTotalOverride } from "@/lib/actions/admin";
import { formatPrice } from "@/lib/utils";

interface OrderTotalOverrideProps {
  orderId: string;
  total: number;
  totalOverride: number | null;
  canEdit: boolean;
}

export default function OrderTotalOverride({
  orderId,
  total,
  totalOverride,
  canEdit,
}: OrderTotalOverrideProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  const effectiveTotal = totalOverride ?? total;

  const handleSetOverride = () => {
    const parsed = parseInt(inputValue, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      setError("Enter a valid amount (0 or more)");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateOrderTotalOverride(orderId, parsed);
      if (result.success) {
        setInputValue("");
        router.refresh();
      } else {
        setError(result.error ?? "Failed to update");
      }
    });
  };

  const handleResetToCalculated = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderTotalOverride(orderId, null);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Failed to reset");
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <h3 className="text-sm font-semibold text-neutral-900 mb-3">
        Order Total
      </h3>
      <div className="space-y-3">
        <p className="text-lg font-bold text-neutral-900">
          {formatPrice(effectiveTotal)}
        </p>
        {totalOverride != null && (
          <p className="text-xs text-amber-600 font-medium">
            Custom total set
          </p>
        )}
        {canEdit && (
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            {totalOverride == null ? (
              <>
                <label className="block text-xs font-medium text-neutral-500">
                  Set custom total (Leke)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="0"
                    className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  />
                  <button
                    onClick={handleSetOverride}
                    disabled={isPending || inputValue === ""}
                    className="px-3 py-2 text-sm font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isPending ? "Saving..." : "Apply"}
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={handleResetToCalculated}
                disabled={isPending}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 underline-offset-2 hover:underline disabled:opacity-50"
              >
                {isPending ? "Resetting..." : "Reset to calculated total"}
              </button>
            )}
          </div>
        )}
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
