import Link from "next/link";
import { content } from "@/data/content";
import { footerLinks } from "@/data/navigation";
import Newsletter from "@/components/ui/Newsletter";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)]">
      {/* Newsletter Section */}
      <div className="container section">
        <div className="max-w-md">
          <p className="text-xs uppercase tracking-widest text-muted mb-2">
            {content.newsletter.heading}
          </p>
          <h2 className="text-h2 font-serif mb-6">
            {content.newsletter.subHeading}
          </h2>
          <Newsletter />
        </div>
      </div>

      {/* Tagline */}
      <div className="container py-8 border-t border-[var(--border)]">
        <p className="text-sm text-muted max-w-md">
          {content.footer.tagline}
        </p>
      </div>

      {/* Bottom Bar */}
      <div className="container py-6 border-t border-[var(--border)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Legal Links */}
          <nav className="flex flex-wrap gap-4 text-xs text-muted">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-[var(--foreground)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-xs text-muted">
            © {currentYear} Vento Caffè
          </p>
        </div>
      </div>

      {/* Bottom Tagline */}
      <div className="container pb-8">
        <p className="text-xs text-muted">
          {content.footer.bottomLine}
        </p>
      </div>
    </footer>
  );
}
