"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const t = useTranslations();

  // Use placeholder if no images
  const displayImages = images.length > 0 ? images : ["/images/placeholder.svg"];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-[var(--border)] overflow-hidden">
        <Image
          src={displayImages[selectedIndex]}
          alt={t("productGallery.imageAlt", {
            productName,
            index: selectedIndex + 1,
          })}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative w-16 h-16 bg-[var(--border)] overflow-hidden transition-opacity ${
                selectedIndex === index
                  ? "ring-1 ring-[var(--foreground)]"
                  : "opacity-60 hover:opacity-100"
              }`}
              aria-label={t("productGallery.viewImage", { index: index + 1 })}
            >
              <Image
                src={image}
                alt={t("productGallery.thumbnailAlt", {
                  productName,
                  index: index + 1,
                })}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
