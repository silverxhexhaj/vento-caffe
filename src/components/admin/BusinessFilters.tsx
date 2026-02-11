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

const sourceOptions = [
  { value: "all", label: "All sources" },
  { value: "manual", label: "Manual" },
  { value: "sample_booking", label: "Sample Booking" },
  { value: "signup", label: "Signup" },
  { value: "referral", label: "Referral" },
];

interface BusinessFiltersProps {
  businessTypes: string[];
  agents: { id: string; full_name: string }[];
}

export default function BusinessFilters({
  businessTypes,
  agents,
}: BusinessFiltersProps) {
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

  const currentStage = searchParams.get("stage") || "all";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider shrink-0">
          Pipeline stage
        </span>
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
                    ? "ring-2 ring-neutral-900 ring-offset-1"
                    : "hover:opacity-90"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
      <select
        value={searchParams.get("source") || "all"}
        onChange={(event) => updateParam("source", event.target.value)}
        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
      >
        {sourceOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        value={searchParams.get("type") || "all"}
        onChange={(event) => updateParam("type", event.target.value)}
        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
      >
        <option value="all">All types</option>
        {businessTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <select
        value={searchParams.get("agent") || "all"}
        onChange={(event) => updateParam("agent", event.target.value)}
        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
      >
        <option value="all">All agents</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.full_name}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={searchParams.get("tag") || ""}
        onChange={(event) => updateParam("tag", event.target.value)}
        placeholder="Filter by tag"
        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
      />
      </div>
    </div>
  );
}
