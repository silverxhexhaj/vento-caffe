export interface NavItem {
  label: string;
  href: string;
}

export const mainNavItems: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Shop", href: "/shop" },
  { label: "Collaborations", href: "/collaborations" },
];

export const languages = [
  { code: "en", label: "EN" },
  { code: "it", label: "IT" },
];

export const footerLinks = [
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms & Conditions", href: "/legal/terms" },
  { label: "Shipping & Returns", href: "/legal/shipping" },
];

export const socialLinks = [
  { label: "Instagram", href: "https://instagram.com/ventocaffe", icon: "instagram" },
  { label: "Spotify", href: "https://open.spotify.com", icon: "spotify" },
];
