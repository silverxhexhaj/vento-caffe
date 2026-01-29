"use client";

import { Player } from "@remotion/player";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ProductShowcaseVideo,
  productShowcaseConfig,
} from "@/components/remotion/ProductShowcaseVideo";

export default function ProductShowcase() {
  const t = useTranslations("content.productShowcase");
  const locale = useLocale();
  const router = useRouter();

  const navigateToShop = () => {
    router.push(`/${locale}/shop`);
  };

  return (
    <section className="section bg-neutral-950">
      <div className="container">

        {/* Remotion Player */}
        <div className="relative w-full mx-auto aspect-video rounded-xl overflow-hidden shadow-2xl">
          <Player
            component={ProductShowcaseVideo}
            durationInFrames={productShowcaseConfig.durationInFrames}
            fps={productShowcaseConfig.fps}
            compositionWidth={productShowcaseConfig.width}
            compositionHeight={productShowcaseConfig.height}
            style={{
              width: "100%",
              height: "100%",
            }}
            loop
            autoPlay
            controls
          />
        </div>

        {/* Action buttons and info below video */}
        <div className="text-center mt-10">
          {/* Shop Now Button */}
          <button
            onClick={navigateToShop}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-800 to-amber-700 
              hover:from-amber-700 hover:to-amber-600 text-white font-semibold 
              px-8 py-4 rounded-lg shadow-lg shadow-amber-900/30 
              transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-amber-900/40"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            {t("ctaButton")}
          </button>
        </div>
      </div>
    </section>
  );
}
