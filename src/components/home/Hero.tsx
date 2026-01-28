import { content } from "@/data/content";

export default function Hero() {
  return (
    <section className="min-h-[70vh] flex items-center">
      <div className="container">
        <h1 className="sr-only">Vento Caffè - Specialty Coffee Roasted in Milano</h1>
        <div className="max-w-4xl" aria-hidden="true">
          {content.hero.lines.map((line, index) => (
            <span
              key={index}
              className={`block font-serif ${
                index === 0
                  ? "text-display"
                  : "text-display text-muted"
              }`}
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {line}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
