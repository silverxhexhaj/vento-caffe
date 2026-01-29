import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { getProductBySlug, productSlugs } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import ProductDetail from "./ProductDetail";

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  return locales.flatMap((locale) =>
    productSlugs.map((slug) => ({
      locale,
      slug,
    }))
  );
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale });
  const product = getProductBySlug(slug, t);

  if (!product) {
    return {
      title: t("productPage.notFoundTitle"),
    };
  }

  const typeLabel =
    product.type === "cialde"
      ? t("common.coffeeCialde")
      : t("common.espressoMachine");
  const priceLabel =
    product.type === "machine"
      ? t("productPage.priceWithSubscription", { price: formatPrice(product.price) })
      : t("productPage.price", { price: formatPrice(product.price) });

  return {
    title: product.name,
    description: `${product.name} - ${typeLabel}. ${product.description}`,
    openGraph: {
      title: `${product.name} | Vento Caffè`,
      description: `${typeLabel}. ${priceLabel}`,
      images: product.images[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale });
  const product = getProductBySlug(slug, t);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
