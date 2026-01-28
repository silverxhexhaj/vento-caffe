import { Metadata } from "next";
import { content } from "@/data/content";

export const metadata: Metadata = {
  title: "About",
  description: "We are Vento, a brand of specialty coffee, roasted in Milano. Raw and singular coffee shops. Sharp and minimalist.",
};

export default function AboutPage() {
  return (
    <div className="section">
      <div className="container">
        {/* Manifesto */}
        <div className="max-w-3xl mb-24">
          {content.about.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={`text-h3 font-serif leading-relaxed ${
                index < content.about.paragraphs.length - 1 ? "mb-8" : ""
              }`}
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Founders */}
        <div className="border-t border-[var(--border)] pt-16">
          <p className="text-xs uppercase tracking-widest text-muted mb-4">
            {content.about.founders.heading}
          </p>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {content.about.founders.names.map((name) => (
              <p key={name} className="text-lg font-serif">
                {name}
              </p>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted mb-4">
              Sustainability
            </h3>
            <p className="text-sm leading-relaxed">
              We are for sustainable engagement and for full responsibility. 
              Our beans are sourced directly from farmers committed to 
              environmental stewardship.
            </p>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted mb-4">
              Quality
            </h3>
            <p className="text-sm leading-relaxed">
              We are for the beautiful and the good, to compose and to share. 
              Each batch is roasted with precision to express the unique 
              character of its origin.
            </p>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted mb-4">
              Design
            </h3>
            <p className="text-sm leading-relaxed">
              We are for architectural lines, and for expressive and subtle beans. 
              Our spaces are raw, minimal, and designed for the ritual of coffee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
