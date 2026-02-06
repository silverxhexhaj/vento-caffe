"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "./AuthProvider";
import AuthModal from "./AuthModal";

export default function AuthButton() {
  const { user, isLoading, isAdmin, signOut } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("auth");
  const tProfile = useTranslations("profile");
  const locale = useLocale();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await signOut();
  };

  if (isLoading) {
    return (
      <div className="w-20 h-5 bg-[var(--border)] animate-pulse" />
    );
  }

  if (user) {
    const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || t("account");
    
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="text-base link-underline flex items-center gap-1"
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="opacity-70"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="hidden sm:inline max-w-[100px] truncate">{displayName}</span>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--background)] border border-[var(--border)] shadow-lg z-50">
            <div className="p-3 border-b border-[var(--border)]">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
            <div className="py-1">
              {isAdmin && (
                <Link
                  href={`/${locale}/admin`}
                  onClick={() => setIsDropdownOpen(false)}
                  className="block w-full text-left px-3 py-2 text-sm font-medium hover:bg-[var(--border)] transition-colors"
                >
                  Admin Panel
                </Link>
              )}
              <Link
                href={`/${locale}/profile`}
                onClick={() => setIsDropdownOpen(false)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-[var(--border)] transition-colors"
              >
                {tProfile("title")}
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--border)] transition-colors"
              >
                {t("signOut")}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-base link-underline flex items-center gap-1"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span className="hidden sm:inline">{t("login")}</span>
      </button>

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode="login"
      />
    </>
  );
}
