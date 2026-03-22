"use client";

import { useTranslations } from "next-intl";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export default function Testimonials() {
  const t = useTranslations();
  const heading = t("testimonials.heading");
  const subtitle = t("testimonials.subtitle");
  const items = t.raw("testimonials.items") as Testimonial[];

  return (
    <section className="py-16 md:py-24 bg-[var(--foreground)] text-[var(--background)]">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-h2 font-serif mb-4">{heading}</h2>
          <p className="text-sm opacity-70">{subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8"
            >
              <svg
                className="w-8 h-8 opacity-20 mb-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-sm leading-relaxed opacity-90 mb-6">
                {item.quote}
              </p>
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs opacity-50">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
