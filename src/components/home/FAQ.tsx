"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const t = useTranslations();
  const items = t.raw("faq.items") as FAQItem[];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-screen-md mx-auto px-4 md:px-8">
        <h2 className="text-h2 font-serif mb-4 text-center">
          {t("faq.heading")}
        </h2>
        <p className="text-sm text-[var(--muted)] text-center mb-12">
          {t("faq.subtitle")}
        </p>

        <div className="divide-y divide-[var(--border)]">
          {items.map((item, index) => (
            <div key={index}>
              <button
                type="button"
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between py-5 text-left gap-4"
              >
                <span className="text-sm font-medium leading-snug">
                  {item.question}
                </span>
                <svg
                  className={`w-4 h-4 flex-shrink-0 text-[var(--muted)] transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? "max-h-96 pb-5" : "max-h-0"
                }`}
              >
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
