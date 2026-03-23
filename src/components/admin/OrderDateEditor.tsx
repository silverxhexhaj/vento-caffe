"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderDate } from "@/lib/actions/admin";

function isoToLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

function localDatetimeValueToIso(value: string): string {
  const d = new Date(value);
  return d.toISOString();
}

interface OrderDateEditorProps {
  orderId: string;
  currentDate: string;
  canEdit: boolean;
}

export default function OrderDateEditor({
  orderId,
  currentDate,
  canEdit,
}: OrderDateEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(() =>
    isoToLocalDatetimeValue(currentDate)
  );

  const formatted = new Date(currentDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleStartEdit = () => {
    setError(null);
    setInputValue(isoToLocalDatetimeValue(currentDate));
    setEditing(true);
  };

  const handleCancel = () => {
    setError(null);
    setInputValue(isoToLocalDatetimeValue(currentDate));
    setEditing(false);
  };

  const handleSave = () => {
    setError(null);
    const iso = localDatetimeValueToIso(inputValue);
    startTransition(async () => {
      const result = await updateOrderDate(orderId, iso);
      if (result.success) {
        setEditing(false);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to update date");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!editing ? (
        <>
          <span className="text-sm text-neutral-500">{formatted}</span>
          {canEdit && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center justify-center rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
              aria-label="Edit order date"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                />
              </svg>
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <label className="block text-xs font-medium text-neutral-500">
            Order date &amp; time
          </label>
          <input
            type="datetime-local"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="px-3 py-2 text-sm font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-600 w-full">{error}</p>}
    </div>
  );
}
