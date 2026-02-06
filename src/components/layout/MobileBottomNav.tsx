"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/AuthProvider";
import AuthModal from "@/components/auth/AuthModal";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  const { user, isLoading, signOut } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  const isActive = (href: string) => {
    const localizedHref = buildLocaleHref(href);
    if (href === "/") {
      return localePathname === localizedHref;
    }
    return localePathname.startsWith(localizedHref);
  };

  const handleAuthClick = () => {
    if (user) {
      setShowUserMenu(!showUserMenu);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut();
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

        {/* Login / Account button */}
        <div className="relative flex-1 h-full">
          <button
            onClick={handleAuthClick}
            className="flex flex-col items-center justify-center gap-0.5 w-full h-full opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
            aria-label={user ? t("auth.account") : t("auth.login")}
          >
            {isLoading ? (
              <div className="w-[22px] h-[22px] bg-[var(--border)] animate-pulse rounded-full" />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
            <span className="text-[10px] font-medium tracking-wide uppercase">
              {isLoading
                ? "..."
                : user
                ? (user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || t("auth.account"))
                : t("auth.login")}
            </span>
          </button>

          {/* Signed-in user menu */}
          {showUserMenu && user && (
            <div className="absolute bottom-full mb-2 right-0 w-48 bg-[var(--background)] border border-[var(--border)] shadow-lg z-50">
              <div className="p-3 border-b border-[var(--border)]">
                <p className="text-sm font-medium truncate">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
              <div className="py-1">
                <Link
                  href={`/${locale}/profile`}
                  onClick={() => setShowUserMenu(false)}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-[var(--border)] transition-colors"
                >
                  {t("profile.title")}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--border)] transition-colors"
                >
                  {t("auth.signOut")}
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode="login"
      />
    </div>
  );
}
