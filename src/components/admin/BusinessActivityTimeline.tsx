"use client";

import type { AdminBusinessActivity } from "@/lib/actions/admin";

interface BusinessActivityTimelineProps {
  activities: AdminBusinessActivity[];
}

export default function BusinessActivityTimeline({
  activities,
}: BusinessActivityTimelineProps) {
  if (!activities.length) {
    return (
      <div className="py-8 text-center text-sm text-neutral-400">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="rounded-lg border border-neutral-200 p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-neutral-900 capitalize">
              {activity.type.replace(/_/g, " ")}
            </p>
            <p className="text-xs text-neutral-400">
              {new Date(activity.created_at).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <p className="mt-2 text-sm text-neutral-600">{activity.description}</p>
        </div>
      ))}
    </div>
  );
}
