"use client";

import clsx from "clsx";

export const stageLabels: Record<string, string> = {
  lead: "Lead",
  contacted: "Contacted",
  sample_sent: "Sample Sent",
  negotiating: "Negotiating",
  active_client: "Active Client",
  churned: "Churned",
};

export const stageClasses: Record<string, string> = {
  lead: "bg-yellow-50 text-yellow-700",
  contacted: "bg-blue-50 text-blue-700",
  sample_sent: "bg-purple-50 text-purple-700",
  negotiating: "bg-indigo-50 text-indigo-700",
  active_client: "bg-green-50 text-green-700",
  churned: "bg-neutral-100 text-neutral-600",
};

export default function BusinessPipelineBadge({ stage }: { stage: string }) {
  const label = stageLabels[stage] || stage;
  const classes = stageClasses[stage] || "bg-neutral-100 text-neutral-700";

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        classes
      )}
    >
      {label}
    </span>
  );
}
