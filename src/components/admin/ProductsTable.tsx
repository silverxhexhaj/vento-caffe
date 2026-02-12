"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { deleteProduct, type AdminProduct } from "@/lib/actions/admin";
import { useRouter } from "next/navigation";
import { calculateProfitMargin, formatProfitMargin } from "@/lib/utils/pricing";
import { formatPrice } from "@/lib/utils";

interface ProductsTableProps {
  products: AdminProduct[];
}

function getStockBadgeClasses(product: AdminProduct): string {
  const stock = product.stock_quantity ?? 0;
  const threshold = product.low_stock_threshold ?? 5;
  if (stock <= threshold) return "bg-red-100 text-red-800";
  if (stock <= threshold * 2) return "bg-amber-100 text-amber-800";
  return "bg-neutral-100 text-neutral-700";
}

function getMarginBadgeClasses(product: AdminProduct): string {
  const cost = product.cost_price ?? 0;
  if (cost <= 0) return "bg-neutral-100 text-neutral-500";
  const marginInfo = formatProfitMargin(
    calculateProfitMargin(product.price, cost)
  );
  if (marginInfo.color === "green") return "bg-green-100 text-green-800";
  if (marginInfo.color === "yellow") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export default function ProductsTable({ products }: ProductsTableProps) {
  const locale = useLocale();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, slug: string) => {
    if (!confirm(`Are you sure you want to delete "${slug}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    const result = await deleteProduct(id);

    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      router.refresh();
    }

    setDeletingId(null);
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-neutral-200">
        <div className="p-4 rounded-full bg-neutral-100 w-fit mx-auto">
          <svg
            className="h-12 w-12 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-base font-semibold text-neutral-900">No products</h3>
        <p className="mt-1 text-sm text-neutral-500">Get started by creating a new product.</p>
        <div className="mt-6">
          <Link
            href={`/${locale}/admin/products/new`}
            className="inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Product
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {products.map((product) => {
        const marginValue =
          (product.cost_price ?? 0) > 0
            ? formatProfitMargin(
                calculateProfitMargin(product.price, product.cost_price ?? 0)
              ).value
            : "—";

        return (
          <article
            key={product.id}
            className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:border-neutral-300 transition-colors flex flex-col"
          >
            {/* Image + product identity */}
            <div className="p-4">
              <div className="flex gap-4">
                <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.slug}
                      className="h-16 w-16 object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 flex items-center justify-center">
                      <svg
                        className="h-8 w-8 text-neutral-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-neutral-900 truncate">
                    {product.slug}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">
                    {product.name_key}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Order: #{product.display_order}
                  </p>
                  <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 capitalize">
                    {product.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Status badges */}
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                    product.status === "published"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {product.status === "published" ? "Published" : "Draft"}
                </span>
                {product.featured && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-800">
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Featured
                  </span>
                )}
                {product.sold_out && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-800">
                    Sold Out
                  </span>
                )}
                {!product.featured && !product.sold_out && product.status === "published" && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="px-4 pb-4 flex-1">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-neutral-500 block">Price</span>
                  <span className="font-medium text-neutral-900">{formatPrice(product.price)}</span>
                </div>
                <div>
                  <span className="text-xs text-neutral-500 block">Cost</span>
                  <span className="text-neutral-600">{formatPrice(product.cost_price ?? 0)}</span>
                </div>
                <div>
                  <span className="text-xs text-neutral-500 block">Stock</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getStockBadgeClasses(product)}`}
                  >
                    {product.stock_quantity ?? 0}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-neutral-500 block">Margin</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getMarginBadgeClasses(product)}`}
                  >
                    {marginValue}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-4 border-t border-neutral-100 flex items-center gap-2">
              <Link
                href={`/${locale}/admin/products/${product.id}`}
                className="flex-1 inline-flex items-center justify-center px-3 py-2.5 text-sm font-medium rounded-lg text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Edit
              </Link>
              <button
                onClick={() => handleDelete(product.id, product.slug)}
                disabled={deletingId === product.id}
                className="inline-flex items-center justify-center px-3 py-2.5 text-sm font-medium rounded-lg text-red-700 bg-white border border-red-300 hover:bg-red-50 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-w-[100px]"
              >
                {deletingId === product.id ? (
                  <>
                    <svg className="animate-spin w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Delete
                  </>
                )}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
