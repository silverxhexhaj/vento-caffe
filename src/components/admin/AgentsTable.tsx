"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import DeleteAgentButton from "./DeleteAgentButton";
import { type AdminAgent } from "@/lib/actions/admin";

interface AgentsTableProps {
  agents: AdminAgent[];
}

export default function AgentsTable({ agents }: AgentsTableProps) {
  const locale = useLocale();

  if (!agents.length) {
    return (
      <div className="text-center py-12 text-neutral-400">
        <p className="text-sm">No agents found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left py-3 px-4 font-medium text-neutral-500">
              Agent
            </th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">
              Contact
            </th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">
              Role
            </th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">
              Businesses
            </th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr
              key={agent.id}
              className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <td className="py-3 px-4">
                <p className="font-medium text-neutral-900">{agent.full_name}</p>
                <p className="text-xs text-neutral-400">
                  Created{" "}
                  {new Date(agent.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </td>
              <td className="py-3 px-4">
                <p className="text-neutral-700">{agent.email || "-"}</p>
                <p className="text-xs text-neutral-400">{agent.phone || "-"}</p>
              </td>
              <td className="py-3 px-4 text-neutral-600">
                {agent.role_title || "-"}
              </td>
              <td className="py-3 px-4 text-neutral-600">
                {agent.assigned_count ?? 0}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/${locale}/admin/agents/${agent.id}`}
                    className="text-xs font-medium text-neutral-700 hover:text-neutral-900 underline"
                  >
                    View
                  </Link>
                  <Link
                    href={`/${locale}/admin/agents/${agent.id}/edit`}
                    className="text-xs font-medium text-neutral-700 hover:text-neutral-900 underline"
                  >
                    Edit
                  </Link>
                  <DeleteAgentButton
                    agentId={agent.id}
                    agentName={agent.full_name}
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
