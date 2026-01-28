import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface ShippingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ShippingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("legal.shipping.title"),
    description: t("legal.shipping.description"),
  };
}

export default async function ShippingPage({ params }: ShippingPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="section">
      <div className="container">
        <div className="max-w-2xl">
          <h1 className="text-h1 font-serif mb-8">
            {t("legal.shipping.title")}
          </h1>

          <div className="prose prose-sm">
            <p className="text-muted mb-6">{t("legal.shipping.lastUpdated")}</p>

            <h2 className="text-lg font-medium mt-8 mb-4">
              {t("legal.shipping.sections.shipping.title")}
            </h2>
            <p className="text-sm text-muted mb-4">
              {t("legal.shipping.sections.shipping.body")}
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">
              {t("legal.shipping.sections.freeShipping.title")}
            </h2>
            <p className="text-sm text-muted mb-4">
              {t("legal.shipping.sections.freeShipping.body")}
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">
              {t("legal.shipping.sections.returns.title")}
            </h2>
            <p className="text-sm text-muted mb-4">
              {t("legal.shipping.sections.returns.body")}
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">
              {t("legal.shipping.sections.contact.title")}
            </h2>
            <p className="text-sm text-muted">
              {t("legal.shipping.sections.contact.body")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
