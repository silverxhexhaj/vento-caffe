"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { mainNavItems } from "@/data/navigation";
import Image from "next/image";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: string;
  onLangChange: (lang: string) => void;
}

export default function MobileMenu({
  isOpen,
  onClose,
  currentLang,
  onLangChange,
}: MobileMenuProps) {
  const locale = useLocale();
  const t = useTranslations();

  const buildLocaleHref = (href: string) => {
    const normalized = href === "/" ? "" : href;
    return `/${locale}${normalized}`;
  };
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--background)]"
        onClick={onClose}
      />

      {/* Menu Content */}
      <div
        className={`relative h-full flex flex-col p-8 transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "-translate-y-4"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2"
          aria-label={t("navigation.closeMenu")}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <Link
          href={buildLocaleHref("/")}
          onClick={onClose}
          className="font-serif text-xl tracking-tight mb-12"
        >
          <Image
              src="/images/logo.png"
              alt="Vento Caffè"
              width={120}
              height={48}
              className="h-10 w-auto"
              priority
            />
        </Link>

        {/* Navigation Links */}
        <nav className="flex-1">
          <ul className="space-y-6">
            {mainNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={buildLocaleHref(item.href)}
                  onClick={onClose}
                  className="text-h2 font-serif link-underline"
                >
                  {t(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Language Toggle */}
        <div className="flex items-center gap-4 pt-8 border-t border-[var(--border)]">
          {["en", "it", "sq"].map((lang) => (
            <button
              key={lang}
              onClick={() => onLangChange(lang)}
              className={`text-sm ${
                currentLang === lang
                  ? "opacity-100"
                  : "opacity-50 hover:opacity-100"
              } transition-opacity`}
            >
              {t("languages." + lang)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
