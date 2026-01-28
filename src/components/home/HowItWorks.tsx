import { useTranslations } from "next-intl";
import { getContent } from "@/data/content";

export default function HowItWorks() {
  const t = useTranslations();
  const { subscription } = getContent(t);

  return (
    <section className="section">
      <div className="container">
        <h2 className="text-h2 font-serif mb-12 text-center">
          {subscription.heading}
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {subscription.steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="text-5xl font-serif text-muted mb-4">
                {step.number}
              </div>
              <h3 className="text-lg font-medium mb-2 uppercase tracking-wide">
                {step.title}
              </h3>
              <p className="text-muted leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
