import { Metadata } from "next";
import Link from "next/link";
import { content } from "@/data/content";

export const metadata: Metadata = {
  title: "About",
  description: "We are Vento Caffè, bringing authentic Italian espresso directly to your home or office through our cialde subscription service.",
};

export default function AboutPage() {
  const { freeMachineOffer, contact } = content;
  
  const whatsappUrl = `https://wa.me/${contact.whatsappNumber.replace(/\+/g, "")}?text=${encodeURIComponent(contact.whatsappMessage)}`;

  return (
    <div className="section">
      <div className="container">
        {/* Manifesto */}
        <div className="max-w-3xl mb-24">
          {content.about.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={`text-h3 font-serif leading-relaxed ${
                index < content.about.paragraphs.length - 1 ? "mb-8" : ""
              }`}
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Founders */}
        <div className="border-t border-[var(--border)] pt-16">
          <p className="text-xs uppercase tracking-widest text-muted mb-4">
            {content.about.founders.heading}
          </p>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {content.about.founders.names.map((name) => (
              <p key={name} className="text-lg font-serif">
                {name}
              </p>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted mb-4">
              Quality
            </h3>
            <p className="text-sm leading-relaxed">
              We source only premium Italian coffee, carefully selected and 
              processed into ESE pods that deliver consistent, barista-quality 
              espresso every time.
            </p>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted mb-4">
              Convenience
            </h3>
            <p className="text-sm leading-relaxed">
              Monthly delivery means you never run out of coffee. Our simple 
              subscription model includes everything you need—cialde, cups, 
              sugar, and stirrers.
            </p>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted mb-4">
              Value
            </h3>
            <p className="text-sm leading-relaxed">
              Get a professional espresso machine completely free when you 
              subscribe. No upfront cost, no hidden fees—just great coffee 
              delivered to your door.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 pt-16 border-t border-[var(--border)] text-center">
          <h2 className="text-h2 font-serif mb-4">Ready to get started?</h2>
          <p className="text-muted mb-8 max-w-lg mx-auto">
            Contact us today to set up your monthly cialde subscription and 
            receive your free espresso machine.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contact via WhatsApp
            </a>
            <Link href="/shop" className="btn">
              View Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
