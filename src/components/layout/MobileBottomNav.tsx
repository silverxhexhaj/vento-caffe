"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

const localeOrder = ["en", "it", "sq"];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();

  const localePathname = useMemo(() => {
    if (!pathname) return `/${locale}`;
    const segments = pathname.split("/");
    if (segments.length > 1) {
      segments[1] = locale;
    }
    return segments.join("/") || `/${locale}`;
  }, [locale, pathname]);

  const buildLocaleHref = (href: string) => {
    const normalized = href === "/" ? "" : href;
    return `/${locale}${normalized}`;
  };

  const handleLanguageCycle = () => {
    const currentIndex = localeOrder.indexOf(locale);
    const nextLocale = localeOrder[(currentIndex + 1) % localeOrder.length];
    const segments = localePathname.split("/");
    if (segments.length > 1) {
      segments[1] = nextLocale;
    }
    const nextPath = segments.join("/") || `/${nextLocale}`;
    router.push(nextPath);
  };

  const isActive = (href: string) => {
    const localizedHref = buildLocaleHref(href);
    if (href === "/") {
      return localePathname === localizedHref;
    }
    return localePathname.startsWith(localizedHref);
  };

  const navItems = [
    {
      label: t("navigation.home"),
      href: "/",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: t("navigation.shop"),
      href: "/shop",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      ),
    },
    {
      label: t("navigation.about"),
      href: "/about",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--background)] border-t border-[var(--border)]">
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={buildLocaleHref(item.href)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-opacity ${
                active ? "opacity-100" : "opacity-50"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium tracking-wide uppercase">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Language toggle button */}
        <button
          onClick={handleLanguageCycle}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
          aria-label={t("languages." + locale)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          <span className="text-[10px] font-medium tracking-wide uppercase">
            {locale.toUpperCase()}
          </span>
        </button>
      </nav>
    </div>
  );
}
