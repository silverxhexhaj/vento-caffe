"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/lib/actions/profile";
import type { ProfileData } from "@/lib/actions/profile";

interface ProfileFormProps {
  profile: ProfileData;
  email: string;
}

export default function ProfileForm({ profile, email }: ProfileFormProps) {
  const t = useTranslations("profile.form");
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const result = await updateProfile({
      full_name: fullName,
      phone: phone || undefined,
    });

    if (result.success) {
      setMessage({ type: "success", text: t("saved") });
    } else {
      setMessage({ type: "error", text: result.error || "Error" });
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="fullName"
          className="block text-xs uppercase tracking-widest text-muted mb-2"
        >
          {t("fullName")}
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3 py-2.5 bg-transparent border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-xs uppercase tracking-widest text-muted mb-2"
        >
          {t("email")}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          disabled
          className="w-full px-3 py-2.5 bg-[var(--border)]/30 border border-[var(--border)] text-sm text-muted cursor-not-allowed"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-xs uppercase tracking-widest text-muted mb-2"
        >
          {t("phone")}
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2.5 bg-transparent border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[var(--foreground)] text-[var(--background)] text-sm uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {saving ? t("saving") : t("save")}
        </button>

        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
