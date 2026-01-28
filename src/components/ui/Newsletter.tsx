"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { getContent } from "@/data/content";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations();
  const content = getContent(t);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // Mock submission - in production, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setIsSubmitted(true);
    setIsLoading(false);
    setEmail("");
  };

  if (isSubmitted) {
    return (
      <p className="text-sm">{content.newsletter.successMessage}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={content.newsletter.placeholder}
        required
        className="input flex-1"
        aria-label={t("newsletter.emailLabel")}
      />
      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary px-6"
      >
        {isLoading ? "..." : content.newsletter.buttonText}
      </button>
    </form>
  );
}
