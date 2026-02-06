"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ProfileForm from "./ProfileForm";
import AddressForm from "./AddressForm";
import PasswordForm from "./PasswordForm";
import OrderHistory from "./OrderHistory";
import type { ProfileData } from "@/lib/actions/profile";

interface ProfileTabsProps {
  profile: ProfileData;
  email: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orders: any[];
}

export default function ProfileTabs({
  profile,
  email,
  orders,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"info" | "orders">("info");
  const t = useTranslations("profile.tabs");

  const tabs = [
    { id: "info" as const, label: t("info") },
    { id: "orders" as const, label: t("orders") },
  ];

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex border-b border-[var(--border)] mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium tracking-wide uppercase transition-colors relative cursor-pointer ${
              activeTab === tab.id
                ? "text-[var(--foreground)]"
                : "text-muted hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--foreground)]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "info" && (
        <div className="space-y-12">
          <ProfileForm profile={profile} email={email} />
          <div className="border-t border-[var(--border)]" />
          <AddressForm profile={profile} />
          <div className="border-t border-[var(--border)]" />
          <PasswordForm />
        </div>
      )}

      {activeTab === "orders" && <OrderHistory orders={orders} />}
    </div>
  );
}
