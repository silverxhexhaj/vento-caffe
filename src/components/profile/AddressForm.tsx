"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/lib/actions/profile";
import type { ProfileData, ShippingAddress } from "@/lib/actions/profile";

interface AddressFormProps {
  profile: ProfileData;
}

export default function AddressForm({ profile }: AddressFormProps) {
  const t = useTranslations("profile.address");
  const tForm = useTranslations("profile.form");

  const existing = profile.default_shipping_address;
  const [address, setAddress] = useState(existing?.address || "");
  const [city, setCity] = useState(existing?.city || "");
  const [postalCode, setPostalCode] = useState(existing?.postalCode || "");
  const [country, setCountry] = useState(existing?.country || "Albania");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const shippingAddress: ShippingAddress = {
      fullName: profile.full_name || "",
      email: "",
      phone: profile.phone || "",
      address,
      city,
      postalCode,
      country,
    };

    const result = await updateProfile({
      default_shipping_address: shippingAddress,
    });

    if (result.success) {
      setMessage({ type: "success", text: tForm("saved") });
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
          htmlFor="address"
          className="block text-xs uppercase tracking-widest text-muted mb-2"
        >
          {t("address")}
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2.5 bg-transparent border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="city"
            className="block text-xs uppercase tracking-widest text-muted mb-2"
          >
            {t("city")}
          </label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3 py-2.5 bg-transparent border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="postalCode"
            className="block text-xs uppercase tracking-widest text-muted mb-2"
          >
            {t("postalCode")}
          </label>
          <input
            id="postalCode"
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className="w-full px-3 py-2.5 bg-transparent border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="country"
          className="block text-xs uppercase tracking-widest text-muted mb-2"
        >
          {t("country")}
        </label>
        <input
          id="country"
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full px-3 py-2.5 bg-transparent border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[var(--foreground)] text-[var(--background)] text-sm uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {saving ? tForm("saving") : tForm("save")}
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
