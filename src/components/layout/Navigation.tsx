"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { mainNavItems, languages } from "@/data/navigation";
import { useCart } from "@/lib/cart";
import MobileMenu from "./MobileMenu";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const pathname = usePathname();
  const { totalItems, toggleCart } = useCart();

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
        Skip to content
      </a>
      
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-[var(--border)] ${
          isScrolled ? "bg-[var(--background)]/95 backdrop-blur-sm" : "bg-[var(--background)]"
        }`}
        style={{ height: "var(--nav-height)" }}
      >
        <nav className="container h-full grid grid-cols-3 items-center">
          {/* Left: Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-base font-medium link-underline ${
                  pathname === item.href ? "opacity-100" : "opacity-70 hover:opacity-100"
                } transition-opacity`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile: Menu Button (left side on mobile) */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2"
              aria-label="Open menu"
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
            href="/"
            className="justify-self-center hover:opacity-70 transition-opacity"
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

          {/* Right: Cart + Language */}
          <div className="flex items-center justify-end gap-4">
            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="text-sm link-underline flex items-center gap-1"
              aria-label={`Cart with ${totalItems} items`}
            >
              cart ({totalItems})
            </button>

            {/* Language Toggle - Desktop */}
            <div className="hidden md:flex items-center gap-1 text-sm">
              {languages.map((lang, index) => (
                <span key={lang.code} className="flex items-center">
                  <button
                    onClick={() => setCurrentLang(lang.code)}
                    className={`link-underline ${
                      currentLang === lang.code
                        ? "opacity-100"
                        : "opacity-50 hover:opacity-100"
                    } transition-opacity`}
                    aria-label={`Switch to ${lang.label}`}
                  >
                    {lang.label}
                  </button>
                  {index < languages.length - 1 && (
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
        currentLang={currentLang}
        onLangChange={setCurrentLang}
      />

      {/* Spacer for fixed header */}
      <div style={{ height: "var(--nav-height)" }} />
    </>
  );
}
