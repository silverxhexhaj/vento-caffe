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
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="container relative z-10">
        <h1 className="sr-only">{t("metadata.titleDefault")}</h1>
        
        <div className="max-w-4xl text-left text-white flex flex-col gap-6 md:gap-2">
          {/* Main Bold Typography */}
          <div className="mb-6 flex flex-col gap-2 " aria-hidden="true">
            <span className="block text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              {content.hero.mainText[0]}
            </span>
            <span className="block text-4xl md:text-5xl lg:text-6xl font-bold leading-[0.9] tracking-tight ">
              {content.hero.mainText[1]}{" "}
              <RotatingText
                words={content.hero.businessCategories}
                interval={2000}
                onIndexChange={setCurrentIndex}
              />
            </span>
          </div>
          
          <div >
            <div className="flex flex-col justify-start">
              {/* Includes List */}
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-2 mb-6 sm:mb-8 max-w-lg">
                {directOffer.includes.map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 text-white/80" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              {/* Price Section */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3 justify-start flex-wrap">
                  <span className="text-4xl sm:text-5xl md:text-6xl font-bold">{directOffer.price}{directOffer.currency}</span>
                </div>
              </div>
              
            </div>
              {/* CTA Button */}
            <div className="flex items-center justify-start gap-4 mb-4">
              <Link 
                href={buildLocaleHref(directOffer.ctaHref)} 
                className="bg-white text-black font-bold px-8 py-4 text-lg hover:bg-white/90 transition-colors"
              >
                {directOffer.ctaText}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
