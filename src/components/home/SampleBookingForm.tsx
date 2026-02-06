"use client";

import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getContent } from "@/data/content";
import Calendar from "@/components/ui/Calendar";
import { bookSample } from "@/lib/actions/bookSample";

interface SampleBookingFormProps {
  currentCategoryIndex?: number;
}

export default function SampleBookingForm({ currentCategoryIndex }: SampleBookingFormProps) {
  const locale = useLocale();
  const t = useTranslations();
  const content = getContent(t);
  const { sampleBooking } = content;
  const businessCategories = content.hero.businessCategories;

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  // Auto-select business type based on rotating hero category
  const effectiveBusinessType = businessType || (
    currentCategoryIndex !== undefined ? businessCategories[currentCategoryIndex] : ""
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale === "sq" ? "sq-AL" : locale === "it" ? "it-IT" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedDate) {
      setError(sampleBooking.errorDate);
      return;
    }
    if (!fullName.trim() || !phone.trim() || !effectiveBusinessType || !address.trim() || !city.trim()) {
      setError(sampleBooking.errorRequired);
      return;
    }

    setIsSubmitting(true);

    const bookingDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

    const result = await bookSample({
      fullName: fullName.trim(),
      phone: phone.trim(),
      businessType: effectiveBusinessType,
      address: address.trim(),
      city: city.trim(),
      bookingDate: bookingDateStr,
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
    } else {
      setError(result.error || sampleBooking.errorGeneric);
    }
  };

  const whatsappUrl = `https://wa.me/${content.contact.whatsappNumber.replace(/\+/g, "")}`;

  // Success state
  if (isSuccess && selectedDate) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-8 w-full max-w-md">
        <div className="text-center space-y-4">
          {/* Checkmark */}
          <div className="mx-auto w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">{sampleBooking.successTitle}</h3>
          <p className="text-white/80 text-sm">
            {sampleBooking.successMessage.replace("{date}", formatDate(selectedDate))}
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-lg text-sm hover:bg-white/90 transition-colors mt-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {sampleBooking.successWhatsapp}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 md:p-6 w-full max-w-md">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold tracking-widest uppercase bg-white text-black px-2 py-0.5 rounded">
            {sampleBooking.freeBadge}
          </span>
          <span className="text-[11px] text-white/60">{sampleBooking.includes}</span>
        </div>
        <h3 className="text-lg font-bold text-white leading-tight">{sampleBooking.heading}</h3>
        <p className="text-xs text-white/60 mt-0.5">{sampleBooking.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Calendar */}
        <div>
          <label className="block text-[11px] font-medium text-white/70 mb-1.5">
            {sampleBooking.selectDate}
          </label>
          <Calendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            minDate={tomorrow}
          />
          <p className="text-[10px] text-white/40 mt-1">{sampleBooking.todayNote}</p>
        </div>

        {/* Form fields */}
        <div className="space-y-2.5 pt-1">
          {/* Name & Phone row */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={sampleBooking.fullName}
              className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/50 transition-colors"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={sampleBooking.phone}
              className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/50 transition-colors"
            />
          </div>

          {/* Business Type */}
          <select
            value={effectiveBusinessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/50 transition-colors appearance-none cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            <option value="" disabled className="bg-neutral-900 text-white">
              {sampleBooking.selectBusinessType}
            </option>
            {businessCategories.map((cat: string) => (
              <option key={cat} value={cat} className="bg-neutral-900 text-white">
                {cat}
              </option>
            ))}
          </select>

          {/* Address & City row */}
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={sampleBooking.address}
              className="col-span-2 w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/50 transition-colors"
            />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={sampleBooking.city}
              className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/50 transition-colors"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-300 text-xs">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-white text-black font-bold py-3 rounded-lg text-sm hover:bg-white/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? sampleBooking.submitting : sampleBooking.submit}
        </button>
      </form>
    </div>
  );
}
