"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  createProduct,
  updateProduct,
  type AdminProduct,
} from "@/lib/actions/admin";
import { calculateProfitMargin, formatProfitMargin } from "@/lib/utils/pricing";
import ImageUploader from "./ImageUploader";

interface ProductFormProps {
  product?: AdminProduct | null;
}

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    slug: product?.slug || "",
    name_key: product?.name_key || "",
    description_key: product?.description_key || "",
    contents_key: product?.contents_key || "",
    highlights_key: product?.highlights_key || "",
    price: product?.price || 0,
    cost_price: product?.cost_price ?? 0,
    stock_quantity: product?.stock_quantity ?? 0,
    low_stock_threshold: product?.low_stock_threshold ?? 5,
    sold_out: product?.sold_out || false,
    featured: product?.featured || false,
    type: product?.type || ("cialde" as "cialde" | "machine"),
    images: product?.images || [],
  });

  const updateField = (field: string, value: string | number | boolean | string[]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    // Validation
    if (!formState.slug.trim()) {
      setError("Slug is required.");
      return;
    }

    if (!formState.name_key.trim()) {
      setError("Name key is required.");
      return;
    }

    if (!formState.description_key.trim()) {
      setError("Description key is required.");
      return;
    }

    if (formState.price <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

    if (formState.images.length === 0) {
      setError("At least one image is required.");
      return;
    }

    const payload = {
      slug: formState.slug.trim(),
      name_key: formState.name_key.trim(),
      description_key: formState.description_key.trim(),
      contents_key: formState.contents_key.trim() || null,
      highlights_key: formState.highlights_key.trim() || null,
      price: formState.price,
      cost_price: formState.cost_price,
      stock_quantity: formState.stock_quantity,
      low_stock_threshold: formState.low_stock_threshold,
      sold_out: formState.sold_out,
      featured: formState.featured,
      type: formState.type,
      images: formState.images,
    };

    startTransition(async () => {
      if (product?.id) {
        const result = await updateProduct(product.id, payload);
        if (result.error) {
          setError(result.error);
          return;
        }
        router.refresh();
        router.push(`/${locale}/admin/products`);
        return;
      }

      const result = await createProduct(payload);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/products`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Basic Info Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formState.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              placeholder="e.g., premium-cialde"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              required
            />
            <p className="mt-1 text-xs text-neutral-400">
              URL-friendly identifier (lowercase, hyphens only)
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formState.type}
              onChange={(e) => updateField("type", e.target.value as "cialde" | "machine")}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              required
            >
              <option value="cialde">Cialde</option>
              <option value="machine">Machine</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Price (Leke) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formState.price}
              onChange={(e) => updateField("price", parseInt(e.target.value) || 0)}
              placeholder="e.g., 6000"
              min="0"
              step="1"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              required
            />
            <p className="mt-1 text-xs text-neutral-400">
              Selling price in Leke (e.g., 6000 = 60.00 Leke)
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Cost Price (Leke)
            </label>
            <input
              type="number"
              value={formState.cost_price}
              onChange={(e) => updateField("cost_price", parseInt(e.target.value) || 0)}
              placeholder="e.g., 3000"
              min="0"
              step="1"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Purchase/wholesale price in Leke
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Stock Quantity
            </label>
            <input
              type="number"
              value={formState.stock_quantity}
              onChange={(e) => updateField("stock_quantity", parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
              step="1"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Current available stock
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Low Stock Threshold
            </label>
            <input
              type="number"
              value={formState.low_stock_threshold}
              onChange={(e) => updateField("low_stock_threshold", parseInt(e.target.value) || 0)}
              placeholder="5"
              min="0"
              step="1"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Alert when stock falls below this number
            </p>
          </div>

          {formState.price > 0 && (
            <div className="sm:col-span-2">
              <span className="text-xs font-medium text-neutral-500">Profit Margin: </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  formatProfitMargin(
                    calculateProfitMargin(formState.price, formState.cost_price)
                  ).color === "green"
                    ? "bg-green-100 text-green-800"
                    : formatProfitMargin(
                        calculateProfitMargin(formState.price, formState.cost_price)
                      ).color === "yellow"
                    ? "bg-amber-100 text-amber-800"
                    : formState.cost_price > 0
                    ? "bg-red-100 text-red-800"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {formState.cost_price > 0
                  ? formatProfitMargin(
                      calculateProfitMargin(formState.price, formState.cost_price)
                    ).value
                  : "—"}
              </span>
            </div>
          )}

          <div className="flex items-center gap-6 pt-6 sm:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formState.featured}
                onChange={(e) => updateField("featured", e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-neutral-900"
              />
              <span className="text-sm font-medium text-neutral-700">Featured</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formState.sold_out}
                onChange={(e) => updateField("sold_out", e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-neutral-900"
              />
              <span className="text-sm font-medium text-neutral-700">Sold Out</span>
            </label>
          </div>
        </div>
      </div>

      {/* Translation Keys Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Translation Keys</h3>
        <p className="text-xs text-neutral-500 mb-4">
          These keys reference translations in the message files (en.json, sq.json, it.json)
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Name Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formState.name_key}
              onChange={(e) => updateField("name_key", e.target.value)}
              placeholder="e.g., products.premiumCialde.name"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Description Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formState.description_key}
              onChange={(e) => updateField("description_key", e.target.value)}
              placeholder="e.g., products.premiumCialde.description"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Contents Key <span className="text-neutral-400">(optional)</span>
            </label>
            <input
              type="text"
              value={formState.contents_key}
              onChange={(e) => updateField("contents_key", e.target.value)}
              placeholder="e.g., products.premiumCialde.contents"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Highlights Key <span className="text-neutral-400">(optional)</span>
            </label>
            <input
              type="text"
              value={formState.highlights_key}
              onChange={(e) => updateField("highlights_key", e.target.value)}
              placeholder="e.g., products.premiumCialde.highlights"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <p className="mt-1 text-xs text-neutral-400">
              For highlights, create an array in the message files
            </p>
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Product Images</h3>
        <p className="text-xs text-neutral-500 mb-4">
          Upload images or paste URLs. First image will be the main product image.
        </p>
        
        <ImageUploader
          images={formState.images}
          onChange={(images) => updateField("images", images)}
          maxImages={10}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
        <button
          type="button"
          onClick={() => router.push(`/${locale}/admin/products`)}
          className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {product ? "Updating..." : "Creating..."}
            </span>
          ) : (
            <>{product ? "Update Product" : "Create Product"}</>
          )}
        </button>
      </div>
    </form>
  );
}
