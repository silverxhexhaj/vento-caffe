"use client";

import { useTranslations } from "next-intl";

interface QuantityStepperProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
}

export default function QuantityStepper({
  quantity,
  onQuantityChange,
  min = 1,
  max = 10,
}: QuantityStepperProps) {
  const t = useTranslations();
  const decrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const increase = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <div className="flex items-center">
      <span className="text-xs uppercase tracking-widest text-muted mr-4">
        {t("quantityStepper.label")}
      </span>
      <div className="flex items-center border border-[var(--border)]">
        <button
          onClick={decrease}
          disabled={quantity <= min}
          className="w-10 h-10 flex items-center justify-center text-lg hover:bg-[var(--border)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={t("quantityStepper.decrease")}
        >
          −
        </button>
        <span className="w-10 h-10 flex items-center justify-center text-sm border-x border-[var(--border)]">
          {quantity}
        </span>
        <button
          onClick={increase}
          disabled={quantity >= max}
          className="w-10 h-10 flex items-center justify-center text-lg hover:bg-[var(--border)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={t("quantityStepper.increase")}
        >
          +
        </button>
      </div>
    </div>
  );
}
