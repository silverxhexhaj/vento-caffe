"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)]" : ""
        }`}
        style={{ height: "var(--nav-height)" }}
      >
        <nav className="container h-full flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="font-serif text-xl tracking-tight hover:opacity-70 transition-opacity"
          >
            Vento Caffè
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm link-underline ${
                  pathname === item.href ? "opacity-100" : "opacity-70 hover:opacity-100"
                } transition-opacity`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side: Language + Cart */}
          <div className="flex items-center gap-4">
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

            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="text-sm link-underline flex items-center gap-1"
              aria-label={`Cart with ${totalItems} items`}
            >
              cart ({totalItems})
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -mr-2"
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
