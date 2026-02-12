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
    <div className="overflow-x-auto w-full">
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
              Orders
            </th>
            <th className="text-right py-3 px-4 font-medium text-neutral-500" />
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
                <Link
                  href={`/${locale}/admin/businesses/${business.id}`}
                  className="group/orders relative inline-flex font-medium text-neutral-700 hover:text-neutral-900 underline-offset-2 hover:underline"
                >
                  {business.orders_count ?? 0}
                  {(business.orders_preview?.length ?? 0) > 0 ? (
                    <span
                      role="tooltip"
                      className="pointer-events-none invisible absolute left-0 top-full z-50 mt-1 max-h-64 w-72 overflow-y-auto rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-xs shadow-lg group-hover/orders:visible"
                    >
                      {business.orders_preview!.map((order) => (
                        <div
                          key={order.id}
                          className="border-b border-neutral-100 pb-2 last:border-0 last:pb-0 mb-2 last:mb-0"
                        >
                          <p className="font-medium text-neutral-800">
                            {new Date(order.created_at).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}{" "}
                            · {order.status}
                          </p>
                          <ul className="mt-1 space-y-0.5 text-neutral-600">
                            {order.items.map((item, i) => (
                              <li key={i}>
                                {item.product_name} × {item.quantity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </span>
                  ) : (business.orders_count ?? 0) === 0 ? (
                    <span
                      role="tooltip"
                      className="pointer-events-none invisible absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-xs text-neutral-500 shadow-lg group-hover/orders:visible"
                    >
                      No orders yet
                    </span>
                  ) : (
                    <span
                      role="tooltip"
                      className="pointer-events-none invisible absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-xs text-neutral-500 shadow-lg group-hover/orders:visible"
                    >
                      View orders
                    </span>
                  )}
                </Link>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-3">
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
