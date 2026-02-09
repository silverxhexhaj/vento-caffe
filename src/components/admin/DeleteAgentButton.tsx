"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { deleteAgent } from "@/lib/actions/admin";

interface DeleteAgentButtonProps {
  agentId: string;
  agentName: string;
  variant?: "icon" | "button";
}

export default function DeleteAgentButton({
  agentId,
  agentName,
  variant = "button",
}: DeleteAgentButtonProps) {
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
      const result = await deleteAgent(agentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsOpen(false);
      router.push(`/${locale}/admin/agents`);
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
        aria-label={variant === "icon" ? "Delete agent" : undefined}
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
        {variant === "button" ? "Delete agent" : null}
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
            aria-labelledby="delete-agent-title"
          >
            <div className="space-y-3">
              <h2
                id="delete-agent-title"
                className="text-lg font-semibold text-neutral-900"
              >
                Delete agent
              </h2>
              <p className="text-sm text-neutral-600">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-neutral-900">
                  {agentName}
                </span>
                ? This will remove all assignments. This action cannot be undone.
              </p>
            </div>

            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-neutral-300"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
