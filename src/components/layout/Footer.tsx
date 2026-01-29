import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { getContent } from "@/data/content";

function InstagramIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const locale = useLocale();
  const t = useTranslations();
  const content = getContent(t);

  const buildLocaleHref = (href: string) => {
    const normalized = href === "/" ? "" : href;
    return `/${locale}${normalized}`;
  };

  const socialLinks = [
    {
      name: "Instagram",
      href: "https://instagram.com/ventocaffe",
      icon: InstagramIcon,
      label: t("footer.socialInstagram"),
    },
    {
      name: "Facebook",
      href: "https://facebook.com/ventocaffe",
      icon: FacebookIcon,
      label: t("footer.socialFacebook"),
    },
    {
      name: "WhatsApp",
      href: `https://wa.me/${content.contact.whatsappNumber.replace(/\+/g, "")}`,
      icon: WhatsAppIcon,
      label: t("footer.socialWhatsApp"),
    },
  ];

  return (
    <footer className="border-t border-[var(--border)]">
      {/* Main Footer: Logo + Tagline | Social Links */}
      <div className="container">
        <div className="py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Brand Section */}
          <div className="flex flex-col gap-4">
            <Link
              href={buildLocaleHref("/")}
              className="hover:opacity-70 transition-opacity"
            >
              <Image
                src="/images/logo.png"
                alt={content.brand.name}
                width={100}
                height={40}
                className="h-12 w-auto"
              />
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-muted hover:text-[var(--foreground)] transition-colors"
                aria-label={social.label}
              >
                <social.icon />
              </a>
            ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="container py-6 border-t border-[var(--border)]">
        <div className="flex flex-col gap-4 py-6">
          {/* Legal + Copyright Row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Legal Links */}
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
              {content.footer.legal.map((link, index) => (
                <span key={link.href} className="flex items-center">
                  <Link
                    href={buildLocaleHref(link.href)}
                    className="hover:text-[var(--foreground)] transition-colors"
                  >
                    {link.label}
                  </Link>
                  {index < content.footer.legal.length - 1 && (
                    <span className="ml-4 opacity-30">·</span>
                  )}
                </span>
              ))}
            </nav>

            {/* Copyright */}
            <p className="text-xs text-muted">
              {t("footer.copyright", { year: currentYear })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
