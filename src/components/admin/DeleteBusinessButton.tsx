"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { deleteBusiness } from "@/lib/actions/admin";

interface DeleteBusinessButtonProps {
  businessId: string;
  businessName: string;
  variant?: "icon" | "button";
}

export default function DeleteBusinessButton({
  businessId,
  businessName,
  variant = "button",
}: DeleteBusinessButtonProps) {
  const router = useRouter();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteBusiness(businessId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsOpen(false);
      router.push(`/${locale}/admin/businesses`);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        className={
          variant === "icon"
            ? "inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
            : "rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        }
        aria-label={variant === "icon" ? "Delete business" : undefined}
      >
        <svg
          className={variant === "icon" ? "h-3.5 w-3.5" : "h-4 w-4"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0h8m-7 4v6m6-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"
          />
        </svg>
        {variant === "button" ? "Delete business" : null}
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleBackdropClick}
        >
          <div
            ref={modalRef}
            className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-business-title"
          >
            <div className="space-y-3">
              <h2
                id="delete-business-title"
                className="text-lg font-semibold text-neutral-900"
              >
                Delete business
              </h2>
              <p className="text-sm text-neutral-600">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-neutral-900">
                  {businessName}
                </span>
                ? This will also remove all associated activities. This action
                cannot be undone.
              </p>
            </div>

            {error ? (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
