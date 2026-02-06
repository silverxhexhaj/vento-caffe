"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import type { AdminClient } from "@/lib/actions/admin";

interface ClientsTableProps {
  clients: AdminClient[];
}

export default function ClientsTable({ clients }: ClientsTableProps) {
  const locale = useLocale();

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
        <p className="text-sm">No clients found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Client</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Phone</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Orders</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Total Spent</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">Joined</th>
            <th className="text-right py-3 px-4 font-medium text-neutral-500"></th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr
              key={client.id}
              className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <td className="py-3 px-4">
                <p className="font-medium text-neutral-900">
                  {client.full_name || "No name"}
                </p>
                {client.email && (
                  <p className="text-xs text-neutral-400">{client.email}</p>
                )}
              </td>
              <td className="py-3 px-4 text-neutral-600">
                {client.phone || "-"}
              </td>
              <td className="py-3 px-4">
                <span className="font-medium">{client.orders_count ?? 0}</span>
              </td>
              <td className="py-3 px-4 font-medium">
                &euro;{(client.total_spent ?? 0).toFixed(2)}
              </td>
              <td className="py-3 px-4 text-neutral-500">
                {new Date(client.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="py-3 px-4 text-right">
                <Link
                  href={`/${locale}/admin/clients/${client.id}`}
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900 underline-offset-2 hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
