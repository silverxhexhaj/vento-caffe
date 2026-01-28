import Link from "next/link";
import { content } from "@/data/content";

export default function Hero() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center">
      <div className="container text-center">
        <h1 className="sr-only">Vento Caffè - Specialty Coffee Roasted in Milano</h1>
        
        {/* Tagline */}
        <p className="font-serif italic text-lg md:text-xl mb-8">
          {content.hero.tagline}
        </p>
        
        {/* Main Bold Typography */}
        <div className="mb-10" aria-hidden="true">
          {content.hero.mainText.map((line, index) => (
            <span
              key={index}
              className="block text-hero font-bold leading-[0.9] tracking-tight"
            >
              {line}
            </span>
          ))}
        </div>
        
        {/* Description */}
        <p className="max-w-xl mx-auto text-base md:text-lg text-[var(--foreground)] mb-10 leading-relaxed">
          {content.hero.description}
        </p>
        
        {/* CTA Button */}
        <Link href={content.hero.ctaHref} className="btn">
          {content.hero.ctaText}
        </Link>
      </div>
    </section>
  );
}
