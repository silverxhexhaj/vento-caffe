import Link from "next/link";
import { content } from "@/data/content";

export default function BrandStatement() {
  return (
    <section className="section">
      <div className="container">
        <div className="max-w-2xl">
          <p className="text-h3 leading-relaxed mb-2">
            {content.brandStatement.heading}
          </p>
          <p className="text-h3 leading-relaxed text-muted mb-8">
            {content.brandStatement.subheading}
          </p>
          <Link href="/about" className="btn">
            {content.brandStatement.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
