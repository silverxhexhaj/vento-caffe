"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { mainNavItems } from "@/data/navigation";
import { AuthButton } from "@/components/auth";
import { useCart } from "@/lib/cart";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
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
        <nav className="max-w-screen-2xl mx-auto px-6 md:px-8 h-full grid grid-cols-2 md:grid-cols-3 items-center">
          {/* Left: Navigation Links (desktop) / Logo (mobile) */}
          <div className="hidden md:flex items-center gap-6">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={buildLocaleHref(item.href)}
                className={`text-sm font-medium link-underline ${
                  localePathname === buildLocaleHref(item.href)
                    ? "opacity-100"
                    : "opacity-70 hover:opacity-100"
                } transition-opacity`}
              >
                {t(item.label)}
              </Link>
            ))}
          </div>

          {/* Mobile: Logo on the left */}
          <Link
            href={buildLocaleHref("/")}
            className="md:hidden hover:opacity-70 transition-opacity"
          >
            <Image
              src="/images/logo.png"
              alt="Vento Caffè"
              width={120}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Center: Logo (desktop only) */}
          <Link
            href={buildLocaleHref("/")}
            className="hidden md:block justify-self-center hover:opacity-70 transition-opacity"
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

          {/* Right: Auth + Language */}
          <div className="flex items-center justify-end gap-4">
            {/* Language Toggle - All screens */}
            <div className="flex items-center gap-1 text-sm">
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
            {/* Cart Button - All screens */}
            <button
              onClick={toggleCart}
              className="relative flex items-center opacity-70 hover:opacity-100 transition-opacity text-sm font-medium"
              aria-label={t("cart.title", { totalItems })}
            >
              <span className="relative flex items-center justify-center w-10 h-10">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold flex items-center justify-center px-1">
                    {totalItems}
                  </span>
                )}
              </span>
              <span className="hidden sm:inline">{t("navigation.cartButton", { totalItems })}</span>
            </button>
            {/* Auth Button - Desktop only (on mobile it's in bottom nav) */}
            <div className="hidden md:block">
              <AuthButton />
            </div>
          </div>
        </nav>
      </header>

    </>
  );
}
