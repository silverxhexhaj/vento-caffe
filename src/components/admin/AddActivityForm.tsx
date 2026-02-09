"use client";

import { useState, useTransition } from "react";
import { addBusinessActivity } from "@/lib/actions/admin";

interface AddActivityFormProps {
  businessId: string;
}

export default function AddActivityForm({ businessId }: AddActivityFormProps) {
  const [type, setType] = useState("note");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError("Please add a note before saving.");
      return;
    }

    startTransition(async () => {
      const result = await addBusinessActivity(
        businessId,
        type,
        description.trim()
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setDescription("");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label className="text-xs font-medium text-neutral-500">Type</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <option value="note">Note</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
            <option value="status_change">Status Change</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-neutral-500">Note</label>
          <input
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            placeholder="Add a quick note or summary"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Add Activity"}
      </button>
    </form>
  );
}
