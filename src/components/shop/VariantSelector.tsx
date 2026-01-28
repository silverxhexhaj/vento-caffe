"use client";

import { grindOptions } from "@/data/products";

interface VariantSelectorProps {
  selectedGrind: string;
  onGrindChange: (grind: string) => void;
}

export default function VariantSelector({
  selectedGrind,
  onGrindChange,
}: VariantSelectorProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs uppercase tracking-widest text-muted mb-3">
        Grind
      </legend>
      <div className="flex flex-wrap gap-2">
        {grindOptions.map((option) => (
          <label
            key={option.id}
            className={`cursor-pointer px-4 py-2 border text-sm transition-colors ${
              selectedGrind === option.id
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                : "border-[var(--border)] hover:border-[var(--foreground)]"
            }`}
          >
            <input
              type="radio"
              name="grind"
              value={option.id}
              checked={selectedGrind === option.id}
              onChange={(e) => onGrindChange(e.target.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
