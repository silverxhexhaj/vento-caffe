import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getContent } from "@/data/content";

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("navigation.about"),
    description: t("aboutPage.metaDescription"),
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const content = getContent(t);
  const { contact } = content;

  const buildLocaleHref = (href: string) => {
    const normalized = href === "/" ? "" : href;
    return `/${locale}${normalized}`;
  };

  const whatsappUrl = `https://wa.me/${contact.whatsappNumber.replace(/\+/g, "")}?text=${encodeURIComponent(contact.whatsappMessage)}`;

  return (
    <div className="md:py-16 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-h1 font-serif mb-4">{t("aboutPage.title")}</h1>
        </div>

        {/* Manifesto */}
        <div>
          {content.about.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={`text-h2 font-serif leading-relaxed ${
                index < content.about.paragraphs.length - 1 ? "mb-8" : ""
              }`}
            >
              {paragraph}
            </p>
          ))}
        </div>


        {/* Values */}
        <div className="grid mt-24 grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-2">
            <h3 className="text-base uppercase tracking-widest text-muted">
              {t("aboutPage.values.quality.title")}
            </h3>
            <p className="text-base leading-relaxed">
              {t("aboutPage.values.quality.description")}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base uppercase tracking-widest text-muted">
              {t("aboutPage.values.convenience.title")}
            </h3>
            <p className="text-base leading-relaxed">
              {t("aboutPage.values.convenience.description")}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base uppercase tracking-widest text-muted">
              {t("aboutPage.values.value.title")}
            </h3>
            <p className="text-base leading-relaxed">
              {t("aboutPage.values.value.description")}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
