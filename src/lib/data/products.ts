import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  costPrice?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  soldOut: boolean;
  featured: boolean;
  images: string[];
  type: "cialde" | "machine";
  contents?: string;
  highlights?: string[];
}

/**
 * Resolves translation keys from a product database row into actual translated strings
 */
async function resolveProduct(row: ProductRow, locale: string): Promise<Product> {
  const t = await getTranslations({ locale });
  
  // Get the raw messages to access the highlights array
  const messages = (await import(`@/messages/${locale}.json`)).default;
  
  // Navigate to the highlights using the key path
  // e.g., "products.classicCialde.highlights" -> messages.products.classicCialde.highlights
  const getNestedValue = (obj: unknown, path: string): unknown => {
    return path.split(".").reduce<unknown>((current, key) => {
      if (current && typeof current === "object" && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  };
  
  const highlights = row.highlights_key 
    ? getNestedValue(messages, row.highlights_key) as string[] | undefined
    : undefined;
  
  return {
    id: row.id,
    slug: row.slug,
    name: t(row.name_key),
    description: t(row.description_key),
    price: row.price,
    costPrice: row.cost_price,
    stockQuantity: row.stock_quantity,
    lowStockThreshold: row.low_stock_threshold,
    soldOut: row.sold_out,
    featured: row.featured,
    images: row.images,
    type: row.type,
    contents: row.contents_key ? t(row.contents_key) : undefined,
    highlights,
  };
}

/**
 * Fetches all products from database
 * Uses React cache for deduplication within a single render
 * Supabase client handles its own caching via Next.js fetch cache
 */
const fetchProductsFromDB = cache(async (): Promise<ProductRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return (data || []) as ProductRow[];
});

/**
 * Gets all products with translations for the given locale
 */
export async function getProducts(locale: string): Promise<Product[]> {
  const rows = await fetchProductsFromDB();
  return Promise.all(rows.map(row => resolveProduct(row, locale)));
}

/**
 * Gets a single product by slug with translations for the given locale
 */
export async function getProductBySlug(
  slug: string,
  locale: string
): Promise<Product | undefined> {
  const rows = await fetchProductsFromDB();
  const row = rows.find(r => r.slug === slug);
  return row ? resolveProduct(row, locale) : undefined;
}

/**
 * Gets all featured products with translations for the given locale
 */
export async function getFeaturedProducts(locale: string): Promise<Product[]> {
  const products = await getProducts(locale);
  return products.filter(p => p.featured);
}

/**
 * Gets all cialde products with translations for the given locale
 */
export async function getCialdeProducts(locale: string): Promise<Product[]> {
  const products = await getProducts(locale);
  return products.filter(p => p.type === "cialde");
}

/**
 * Gets the machine product with translations for the given locale
 */
export async function getMachineProduct(locale: string): Promise<Product | undefined> {
  const products = await getProducts(locale);
  return products.find(p => p.type === "machine");
}

/**
 * Machine slug constant
 */
export const MACHINE_SLUG = "espresso-machine";

/**
 * Product slugs for static generation (build time)
 * These are hardcoded to avoid database access during static generation
 */
export const PRODUCT_SLUGS = [
  "classic-cialde",
  "decaffeinato-cialde",
  "espresso-machine",
] as const;

/**
 * Gets basic machine data for cart operations (minimal fetch, no full translation)
 */
export async function getMachineData(): Promise<{ slug: string; price: number; images: string[] } | undefined> {
  const rows = await fetchProductsFromDB();
  const machine = rows.find(r => r.type === "machine");
  return machine ? {
    slug: machine.slug,
    price: machine.price,
    images: machine.images,
  } : undefined;
}
