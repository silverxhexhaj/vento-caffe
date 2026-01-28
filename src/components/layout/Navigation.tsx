"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { mainNavItems } from "@/data/navigation";
import { useCart } from "@/lib/cart";
import { AuthButton } from "@/components/auth";
import MobileMenu from "./MobileMenu";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { totalItems, toggleCart } = useCart();

  const localePathname = useMemo(() => {
    if (!pathname) return `/${locale}`;
    const segments = pathname.split("/");
    if (segments.length > 1) {
      segments[1] = locale;
    }
    return segments.join("/") || `/${locale}`;
  }, [locale, pathname]);

  const buildLocaleHref = (href: string, targetLocale = locale) => {
    const normalized = href === "/" ? "" : href;
    return `/${targetLocale}${normalized}`;
  };

  const handleLanguageChange = (nextLocale: string) => {
    if (nextLocale === locale) return;
    const segments = localePathname.split("/");
    if (segments.length > 1) {
      segments[1] = nextLocale;
    }
    const nextPath = segments.join("/") || `/${nextLocale}`;
    router.push(nextPath);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <a href="#main-content" className="skip-link">
        {t("navigation.skipToContent")}
      </a>
      
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-20 ${
          isScrolled ? "bg-[var(--background)]/95 backdrop-blur-sm" : "bg-[var(--background)]"
        }`}
      >
        <nav className="container h-full grid grid-cols-3 items-center">
          {/* Left: Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={buildLocaleHref(item.href)}
                className={`text-base font-medium link-underline ${
                  localePathname === buildLocaleHref(item.href)
                    ? "opacity-100"
                    : "opacity-70 hover:opacity-100"
                } transition-opacity`}
              >
                {t(item.label)}
              </Link>
            ))}
          </div>

          {/* Mobile: Menu Button (left side on mobile) */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2"
              aria-label={t("navigation.openMenu")}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>

          {/* Center: Logo */}
          <Link
            href={buildLocaleHref("/")}
            className="justify-self-center hover:opacity-70 transition-opacity"
          >
            <Image
              src="/images/logo.png"
              alt="Vento Caffè"
              width={120}
              height={48}
              className="h-14 w-auto"
              priority
            />
          </Link>

          {/* Right: Auth + Cart + Language */}
          <div className="flex items-center justify-end gap-4">
            {/* Auth Button */}
            <AuthButton />

            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="text-sm link-underline flex items-center gap-1"
              aria-label={t("cart.title", { totalItems })}
            >
              {t("navigation.cartButton", { totalItems })}
            </button>

            {/* Language Toggle - Desktop */}
            <div className="hidden md:flex items-center gap-1 text-sm">
              {["en", "it", "sq"].map((lang, index) => (
                <span key={lang} className="flex items-center">
                  <button
                    onClick={() => handleLanguageChange(lang)}
                    className={`link-underline ${
                      locale === lang
                        ? "opacity-100"
                        : "opacity-50 hover:opacity-100"
                    } transition-opacity`}
                    aria-label={t("languages." + lang)}
                  >
                    {t("languages." + lang)}
                  </button>
                  {index < 2 && (
                    <span className="mx-1 opacity-30">/</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentLang={locale}
        onLangChange={handleLanguageChange}
      />

      {/* Spacer for fixed header */}
      <div style={{ height: "var(--nav-height)" }} />
    </>
  );
}
