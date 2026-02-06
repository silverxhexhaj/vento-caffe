import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface TermsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("legal.terms.title"),
    description: t("legal.terms.description"),
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="section">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <div className="max-w-2xl">
          <h1 className="text-h1 font-serif mb-8">
            {t("legal.terms.title")}
          </h1>

          <div className="prose prose-sm">
            <p className="text-muted mb-6">{t("legal.terms.lastUpdated")}</p>

            <h2 className="text-lg font-medium mt-8 mb-4">
              {t("legal.terms.sections.acceptance.title")}
            </h2>
            <p className="text-sm text-muted mb-4">
              {t("legal.terms.sections.acceptance.body")}
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">
              {t("legal.terms.sections.pricing.title")}
            </h2>
            <p className="text-sm text-muted mb-4">
              {t("legal.terms.sections.pricing.body")}
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">
              {t("legal.terms.sections.contact.title")}
            </h2>
            <p className="text-sm text-muted">
              {t("legal.terms.sections.contact.body")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
