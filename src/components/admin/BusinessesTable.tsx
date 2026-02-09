"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import BusinessPipelineBadge from "./BusinessPipelineBadge";
import DeleteBusinessButton from "./DeleteBusinessButton";
import { type AdminBusiness } from "@/lib/actions/admin";

interface BusinessesTableProps {
  businesses: AdminBusiness[];
}

export default function BusinessesTable({ businesses }: BusinessesTableProps) {
  const locale = useLocale();
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
              Agents
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
              <td className="py-3 px-4">
                {business.agents?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {business.agents.map((agent) => (
                      <span
                        key={agent.id}
                        className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
                      >
                        {agent.full_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-neutral-400">-</span>
                )}
              </td>
              <td className="py-3 px-4 capitalize text-neutral-600">
                {business.business_type || "-"}
              </td>
              <td className="py-3 px-4">
                <BusinessPipelineBadge stage={business.pipeline_stage} />
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
                    href={`/${locale}/admin/businesses/${business.id}/edit`}
                    className="text-xs font-medium text-neutral-700 hover:text-neutral-900 underline"
                  >
                    Edit
                  </Link>
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
