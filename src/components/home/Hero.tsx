import Link from "next/link";
import { content } from "@/data/content";
import { RotatingText } from "@/components/ui/RotatingText";

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center">
      <div className="container text-center">
        <h1 className="sr-only">Vento Caffè - Premium Coffee Cialde Delivered Monthly</h1>
                
        {/* Main Bold Typography */}
        <div className="mb-10" aria-hidden="true">
          <span className="block text-6xl md:text-8xl font-bold leading-[0.9] tracking-tight">
            ESPRESSO
          </span>
          <span className="block text-6xl md:text-8xl font-bold leading-[0.9] tracking-tight">
            FOR YOUR <RotatingText words={content.hero.businessCategories} />
          </span>
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
