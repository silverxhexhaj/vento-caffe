"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getContent } from "@/data/content";
import { RotatingText } from "@/components/ui/RotatingText";

// Background images matching businessCategories order:
// HOTEL, OFFICE, SALON, AIRBNB, CLINIC, SPA, STUDIO, GYM, RESTAURANT, COWORKING
const categoryImages = [
  '/images/categories/hotel.png',
  '/images/categories/office.png',
  '/images/categories/salon.png',
  '/images/categories/airbnb.png',
  '/images/categories/clinic.png',
  '/images/categories/spa.png',
  '/images/categories/studio.png',
  '/images/categories/gym.png',
  '/images/categories/restaurant.png',
  '/images/categories/coworking.png',
];

export default function Hero() {
  const locale = useLocale();
  const t = useTranslations();
  const content = getContent(t);
  const { directOffer } = content;
  const [currentIndex, setCurrentIndex] = useState(0);

  const buildLocaleHref = (href: string) => {
    const normalized = href === "/" ? "" : href;
    return `/${locale}${normalized}`;
  };

  const whatsappUrl = `https://wa.me/${directOffer.whatsappNumber.replace(/\+/g, "")}?text=${encodeURIComponent(directOffer.whatsappMessage)}`;

  return (
    <section className="min-h-screen flex items-center justify-center py-12 relative overflow-hidden">
      {/* Background Images with Crossfade */}
      <div className="absolute inset-0 z-0">
        {categoryImages.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="container relative z-10">
        <h1 className="sr-only">{t("metadata.titleDefault")}</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Side - Branding */}
          <div className="text-center lg:text-left text-white">
            {/* Main Bold Typography */}
            <div className="mb-8" aria-hidden="true">
              <span className="block text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.9] tracking-tight">
                {content.hero.mainText[0]}
              </span>
              <span className="block text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.9] tracking-tight">
                {content.hero.mainText[1]}
              </span>
              <span className="block text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.9] tracking-tight">
                <RotatingText 
                  words={content.hero.businessCategories} 
                  interval={2000}
                  onIndexChange={setCurrentIndex}
                />
              </span>
            </div>
            
            {/* Description */}
            <p className="max-w-xl mx-auto lg:mx-0 text-base md:text-lg text-white/90 leading-relaxed">
              {content.hero.description}
            </p>
          </div>
          
          {/* Right Side - Direct Offer Card */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md border-2 border-[var(--foreground)] bg-[var(--background)] p-8 relative">
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--foreground)] text-[var(--background)] px-4 py-1 text-sm font-bold tracking-wider">
                {directOffer.badge}
              </div>
              
              {/* Headline */}
              <div className="text-center mb-6 pt-2">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  {directOffer.headline}
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  <span className="line-through">
                    {directOffer.currency}
                    {directOffer.machineValue}
                  </span>{" "}
                  {t("hero.machineValueNote", { free: t("common.free") })}
                </p>
              </div>
              
              {/* Price */}
              <div className="text-center mb-6">
                <span className="text-sm uppercase tracking-wide text-[var(--muted)]">{directOffer.priceLabel}</span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-6xl md:text-7xl font-bold">{directOffer.currency}{directOffer.price}</span>
                </div>
              </div>
              
              {/* Includes List */}
              <ul className="space-y-3 mb-8">
                {directOffer.includes.map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className={index === directOffer.includes.length - 1 ? "font-bold" : ""}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              
              {/* CTA Button */}
              <Link 
                href={buildLocaleHref(directOffer.ctaHref)} 
                className="btn w-full text-center block text-lg py-4"
              >
                {directOffer.ctaText}
              </Link>
              
              {/* Note */}
              <p className="text-center text-sm text-[var(--muted)] mt-4">
                {directOffer.note}
              </p>
              
              {/* WhatsApp Link */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 mt-4 text-sm hover:underline"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {t("common.questionsChat")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
