"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { stageClasses } from "./BusinessPipelineBadge";

const stageFilterOptions = [
  { value: "all", label: "All" },
  { value: "lead", label: "Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "sample_sent", label: "Sample Sent" },
  { value: "negotiating", label: "Negotiating" },
  { value: "active_client", label: "Active Client" },
  { value: "churned", label: "Churned" },
];

export default function BusinessStageFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const currentStage = searchParams.get("stage") || "active_client";

  return (
    <div className="flex flex-wrap gap-2">
      {stageFilterOptions.map((option) => {
        const isActive = currentStage === option.value;
        const stageClass =
          option.value === "all"
            ? "bg-neutral-100 text-neutral-600"
            : stageClasses[option.value] || "bg-neutral-100 text-neutral-700";
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => updateParam("stage", option.value)}
            className={clsx(
              "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              stageClass,
              isActive
                ? "ring-2 ring-neutral-400 ring-offset-1"
                : "hover:opacity-90"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
