import Link from "next/link";
import { content } from "@/data/content";

export default function LifestyleBlock() {
  return (
    <section className="section bg-[var(--foreground)] text-[var(--background)]">
      <div className="container">
        <div className="max-w-3xl">
          {/* Header */}
          <p className="text-h3 opacity-60 mb-0">
            {content.lifestyle.preHeading}
          </p>
          <h2 className="text-h1 font-serif">
            {content.lifestyle.heading}
          </h2>
          <p className="text-h1 font-serif opacity-60 mb-8">
            {content.lifestyle.subHeading}
          </p>

          {/* Description */}
          <p className="text-lg leading-relaxed opacity-80 mb-8 max-w-xl">
            {content.lifestyle.description}
          </p>

          {/* CTA */}
          <Link
            href="/daily"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-widest border-b border-current pb-1 hover:opacity-70 transition-opacity"
          >
            {content.lifestyle.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
