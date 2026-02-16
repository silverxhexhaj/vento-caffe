export interface NavItem {
  label: string;
  href: string;
}

export const mainNavItems: NavItem[] = [
  { label: "navigation.home", href: "/" },
  { label: "navigation.shop", href: "/shop" },
  { label: "navigation.about", href: "/about" },
];

export const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/ventocaffealbania/", icon: "instagram" },
  { label: "WhatsApp", href: "https://wa.me/355689188161", icon: "whatsapp" },
];
