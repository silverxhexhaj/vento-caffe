"use client";

import { useMemo, useState, useTransition } from "react";
import {
  assignAgentToBusiness,
  unassignAgentFromBusiness,
  type AdminAgent,
} from "@/lib/actions/admin";

interface BusinessAgentAssignerProps {
  businessId: string;
  agents: AdminAgent[];
  assignedAgents: AdminAgent[];
}

export default function BusinessAgentAssigner({
  businessId,
  agents,
  assignedAgents,
}: BusinessAgentAssignerProps) {
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const availableAgents = useMemo(() => {
    const assignedIds = new Set(assignedAgents.map((agent) => agent.id));
    return agents.filter((agent) => !assignedIds.has(agent.id));
  }, [agents, assignedAgents]);

  const handleAssign = () => {
    if (!selectedAgentId) return;
    setError(null);
    startTransition(async () => {
      const result = await assignAgentToBusiness(businessId, selectedAgentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSelectedAgentId("");
    });
  };

  const handleUnassign = (agentId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await unassignAgentFromBusiness(businessId, agentId);
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-neutral-500">
          Assign agent
        </label>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedAgentId}
            onChange={(event) => setSelectedAgentId(event.target.value)}
            className="min-w-[220px] rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            disabled={isPending}
          >
            <option value="">Select an agent</option>
            {availableAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.full_name}
                {agent.role_title ? ` • ${agent.role_title}` : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!selectedAgentId || isPending}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            Assign
          </button>
        </div>
        {availableAgents.length === 0 ? (
          <p className="text-xs text-neutral-400">
            All agents are already assigned to this business.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-neutral-500">Assigned agents</p>
        {assignedAgents.length ? (
          <div className="space-y-2">
            {assignedAgents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {agent.full_name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {agent.role_title || "No role title"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnassign(agent.id)}
                  disabled={isPending}
                  className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-400">No agents assigned yet.</p>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
