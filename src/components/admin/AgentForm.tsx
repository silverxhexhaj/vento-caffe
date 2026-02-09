"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createAgent, updateAgent, type AdminAgent } from "@/lib/actions/admin";

interface AgentFormProps {
  agent?: AdminAgent | null;
}

export default function AgentForm({ agent }: AgentFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    full_name: agent?.full_name || "",
    email: agent?.email || "",
    phone: agent?.phone || "",
    role_title: agent?.role_title || "",
    notes: agent?.notes || "",
  });

  const updateField = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!formState.full_name.trim()) {
      setError("Agent name is required.");
      return;
    }

    const payload = {
      full_name: formState.full_name.trim(),
      email: formState.email || null,
      phone: formState.phone || null,
      role_title: formState.role_title || null,
      notes: formState.notes || null,
    };

    startTransition(async () => {
      if (agent?.id) {
        const result = await updateAgent(agent.id, payload);
        if (result.error) {
          setError(result.error);
          return;
        }
        router.refresh();
        return;
      }

      const result = await createAgent(payload);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.agent?.id) {
        router.push(`/${locale}/admin/agents/${result.agent.id}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-neutral-500">Full name</label>
          <input
            value={formState.full_name}
            onChange={(event) => updateField("full_name", event.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Role title</label>
          <input
            value={formState.role_title}
            onChange={(event) => updateField("role_title", event.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            placeholder="Sales Rep, Account Manager..."
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Email</label>
          <input
            value={formState.email}
            onChange={(event) => updateField("email", event.target.value)}
            type="email"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Phone</label>
          <input
            value={formState.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-neutral-500">Notes</label>
        <textarea
          value={formState.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
      >
        {isPending ? "Saving..." : agent ? "Update Agent" : "Create Agent"}
      </button>
    </form>
  );
}
