"use client";

import { useState, FormEvent } from "react";
import { content } from "@/data/content";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        aria-label="Email address"
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
