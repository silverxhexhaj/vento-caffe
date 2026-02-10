/**
 * @deprecated This file is deprecated. Use `@/lib/data/products` instead.
 * 
 * Product data is now fetched from the Supabase database to ensure consistency
 * and allow for dynamic updates. The database is the single source of truth
 * for product information including prices, names, descriptions, and images.
 * 
 * Migration:
 * - Replace imports from `@/data/products` with `@/lib/data/products`
 * - Update function signatures: pass `locale: string` instead of `t: Translator`
 * - Await all product fetch functions as they are now async
 * 
 * @see /src/lib/data/products.ts for the new implementation
 */

// Legacy exports maintained for backwards compatibility during migration
// These are no longer used in the codebase

/**
 * @deprecated Use MACHINE_SLUG from @/lib/data/products instead
 */
export const MACHINE_SLUG = "espresso-machine";

/**
 * @deprecated Product data is now fetched from the database
 */
export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  soldOut: boolean;
  featured: boolean;
  images: string[];
  type: "cialde" | "machine";
  contents?: string;
  highlights?: string[];
}
