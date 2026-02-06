import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("legal.privacy.title"),
    description: t("legal.privacy.description"),
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="section">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <div className="max-w-2xl">
          <h1 className="text-h1 font-serif mb-8">
            {t("legal.privacy.title")}
          </h1>

          <div className="prose prose-sm">
            <p className="text-muted mb-6">{t("legal.privacy.lastUpdated")}</p>

            <h2 className="text-lg font-medium mt-8 mb-4">
              {t("legal.privacy.sections.informationCollect.title")}
            </h2>
            <p className="text-sm text-muted mb-4">
              {t("legal.privacy.sections.informationCollect.body")}
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">
              {t("legal.privacy.sections.useInformation.title")}
            </h2>
            <p className="text-sm text-muted mb-4">
              {t("legal.privacy.sections.useInformation.body")}
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">
              {t("legal.privacy.sections.contact.title")}
            </h2>
            <p className="text-sm text-muted">
              {t("legal.privacy.sections.contact.body")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
