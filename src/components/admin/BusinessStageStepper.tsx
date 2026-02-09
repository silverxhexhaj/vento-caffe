"use client";

import { useState, useTransition } from "react";
import { updateBusinessStage } from "@/lib/actions/admin";

const stages = [
  { value: "lead", label: "Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "sample_sent", label: "Sample Sent" },
  { value: "negotiating", label: "Negotiating" },
  { value: "active_client", label: "Active Client" },
  { value: "churned", label: "Churned" },
];

interface BusinessStageStepperProps {
  businessId: string;
  stage: string;
}

export default function BusinessStageStepper({
  businessId,
  stage,
}: BusinessStageStepperProps) {
  const [current, setCurrent] = useState(stage);
  const [isPending, startTransition] = useTransition();

  const handleStageChange = (nextStage: string) => {
    setCurrent(nextStage);
    startTransition(async () => {
      await updateBusinessStage(businessId, nextStage);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {stages.map((item) => {
        const isActive = item.value === current;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => handleStageChange(item.value)}
            disabled={isPending}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
