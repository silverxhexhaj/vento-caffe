"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const stageOptions = [
  { value: "all", label: "All stages" },
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

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={searchParams.get("stage") || "all"}
        onChange={(event) => updateParam("stage", event.target.value)}
        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
      >
        {stageOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
  );
}
