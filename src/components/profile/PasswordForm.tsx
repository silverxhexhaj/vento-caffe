"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updatePassword } from "@/lib/actions/profile";

export default function PasswordForm() {
  const t = useTranslations("profile.password");
  const tForm = useTranslations("profile.form");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      setSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      setSaving(false);
      return;
    }

    const result = await updatePassword(newPassword);

    if (result.success) {
      setMessage({ type: "success", text: t("updated") });
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setMessage({ type: "error", text: result.error || "Error" });
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-base font-medium">{t("title")}</h3>

      <div>
        <label
          htmlFor="newPassword"
          className="block text-xs uppercase tracking-widest text-muted mb-2"
        >
          {t("new")}
        </label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-3 py-2.5 bg-transparent border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors"
          minLength={6}
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-xs uppercase tracking-widest text-muted mb-2"
        >
          {t("confirm")}
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2.5 bg-transparent border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors"
          minLength={6}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving || !newPassword || !confirmPassword}
          className="px-6 py-2.5 bg-[var(--foreground)] text-[var(--background)] text-sm uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {saving ? tForm("saving") : t("update")}
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
