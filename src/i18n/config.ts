export const locales = ["en", "it", "sq"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "sq";
export const localePrefix = "always";
