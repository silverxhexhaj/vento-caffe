"use client";

import { useEffect, useRef } from "react";
import SampleBookingForm from "@/components/home/SampleBookingForm";

interface SampleBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCategoryIndex?: number;
}

export default function SampleBookingModal({
  isOpen,
  onClose,
  currentCategoryIndex,
}: SampleBookingModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key and body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div ref={modalRef} className="relative w-full max-w-md" role="dialog" aria-modal="true">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 flex items-center justify-center bg-white text-black rounded-full shadow-lg hover:bg-white/90 transition-colors"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <SampleBookingForm currentCategoryIndex={currentCategoryIndex} />
      </div>
    </div>
  );
}
