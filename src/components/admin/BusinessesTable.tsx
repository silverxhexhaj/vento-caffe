"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import BusinessPipelineBadge from "./BusinessPipelineBadge";
import DeleteBusinessButton from "./DeleteBusinessButton";
import { updateBusinessStage, type AdminBusiness } from "@/lib/actions/admin";

const stageOptions = [
  "lead",
  "contacted",
  "sample_sent",
  "negotiating",
  "active_client",
  "churned",
];

interface BusinessesTableProps {
  businesses: AdminBusiness[];
}

export default function BusinessesTable({ businesses }: BusinessesTableProps) {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStageChange = (businessId: string, stage: string) => {
    setUpdatingId(businessId);
    startTransition(async () => {
      await updateBusinessStage(businessId, stage);
      setUpdatingId(null);
    });
  };

  if (!businesses.length) {
    return (
      <div className="text-center py-12 text-neutral-400">
        <p className="text-sm">No businesses found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left py-3 px-4 font-medium text-neutral-500">
              Business
            </th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">
              Contact
            </th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">
              Type
            </th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">
              Stage
            </th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">
              Tags
            </th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {businesses.map((business) => (
            <tr
              key={business.id}
              className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <td className="py-3 px-4">
                <p className="font-medium text-neutral-900">{business.name}</p>
                <p className="text-xs text-neutral-400">
                  Created{" "}
                  {new Date(business.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </td>
              <td className="py-3 px-4">
                <p className="text-neutral-700">
                  {business.contact_name || "-"}
                </p>
                <p className="text-xs text-neutral-400">
                  {business.email || business.phone || "-"}
                </p>
              </td>
              <td className="py-3 px-4 capitalize text-neutral-600">
                {business.business_type || "-"}
              </td>
              <td className="py-3 px-4 space-y-2">
                <BusinessPipelineBadge stage={business.pipeline_stage} />
                <select
                  value={business.pipeline_stage}
                  onChange={(event) =>
                    handleStageChange(business.id, event.target.value)
                  }
                  disabled={isPending && updatingId === business.id}
                  className="block w-full text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:opacity-50"
                >
                  {stageOptions.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-3 px-4">
                {business.tags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {business.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-neutral-400">-</span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/${locale}/admin/businesses/${business.id}`}
                    className="text-xs font-medium text-neutral-700 hover:text-neutral-900 underline"
                  >
                    View
                  </Link>
                  <DeleteBusinessButton
                    businessId={business.id}
                    businessName={business.name}
                    variant="icon"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
