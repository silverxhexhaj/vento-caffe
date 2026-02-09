"use client";

import { useState, useTransition } from "react";
import { autoLinkProfiles } from "@/lib/actions/admin";

export default function ImportSignupsButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleImport = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await autoLinkProfiles();
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setMessage(
        result.created
          ? `Imported ${result.created} signups into businesses.`
          : "No new signups to import."
      );
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleImport}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
      >
        {isPending ? "Importing..." : "Import Signups"}
      </button>
      {message && <p className="text-xs text-neutral-500">{message}</p>}
    </div>
  );
}
