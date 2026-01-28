import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getContent } from "@/data/content";

export default function FreeMachineOffer() {
  const locale = useLocale();
  const t = useTranslations();
  const { freeMachineOffer } = getContent(t);

  const buildLocaleHref = (href: string) => {
    const normalized = href === "/" ? "" : href;
    return `/${locale}${normalized}`;
  };

  const whatsappUrl = `https://wa.me/${freeMachineOffer.whatsappNumber.replace(/\+/g, "")}?text=${encodeURIComponent(freeMachineOffer.whatsappMessage)}`;

  return (
    <section className="section bg-[var(--foreground)] text-[var(--background)]">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div>
            <p className="text-sm uppercase tracking-wider opacity-70 mb-4">
              {freeMachineOffer.subheading}
            </p>
            <h2 className="text-h2 font-serif mb-6">
              {freeMachineOffer.heading}
            </h2>
            <p className="text-lg opacity-90 mb-8 leading-relaxed">
              {freeMachineOffer.description}
            </p>
            
            {/* Benefits List */}
            <ul className="space-y-3 mb-10">
              {freeMachineOffer.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="opacity-90">{benefit}</span>
                </li>
              ))}
            </ul>
            
            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--background)] text-[var(--foreground)] font-medium uppercase tracking-wide text-sm hover:opacity-90 transition-opacity"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {freeMachineOffer.ctaText}
              </a>
              <Link
                href={buildLocaleHref("/shop")}
                className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--background)] font-medium uppercase tracking-wide text-sm hover:bg-[var(--background)] hover:text-[var(--foreground)] transition-colors"
              >
                {freeMachineOffer.secondaryCta}
              </Link>
            </div>
          </div>
          
          {/* Right: Visual Element */}
          <div className="relative">
            <div className="aspect-square bg-[var(--background)]/10 flex items-center justify-center">
              {/* Coffee machine icon/illustration placeholder */}
              <svg
                className="w-48 h-48 opacity-20"
                viewBox="0 0 100 100"
                fill="currentColor"
              >
                <rect x="20" y="30" width="60" height="50" rx="4" />
                <rect x="30" y="15" width="40" height="15" rx="2" />
                <circle cx="50" cy="55" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
                <rect x="35" y="80" width="10" height="10" />
                <rect x="55" y="80" width="10" height="10" />
              </svg>
            </div>
            
            {/* Price Badge */}
            <div className="absolute -top-4 -right-4 bg-[var(--background)] text-[var(--foreground)] px-4 py-2">
              <p className="text-xs uppercase tracking-wider opacity-70">
                {t("freeMachineOffer.machineBadgeLabel")}
              </p>
              <p className="text-2xl font-bold">{t("common.free")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
