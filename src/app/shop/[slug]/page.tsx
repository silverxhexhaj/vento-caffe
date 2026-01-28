import { Metadata } from "next";
import { notFound } from "next/navigation";
import { products, getProductBySlug } from "@/data/products";
import ProductDetail from "./ProductDetail";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const typeLabel = product.type === "cialde" ? "Coffee Cialde" : "Espresso Machine";
  const priceLabel = product.type === "machine" 
    ? `€${product.price} or FREE with subscription` 
    : `€${product.price}`;

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
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
