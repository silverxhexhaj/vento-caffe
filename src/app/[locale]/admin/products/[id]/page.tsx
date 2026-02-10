import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProductById } from "@/lib/actions/admin";
import ProductForm from "@/components/admin/ProductForm";
import StockManagement from "@/components/admin/StockManagement";

export const metadata = {
  title: "Edit Product - Admin",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const { product, error } = await getAdminProductById(id);

  if (error || !product) {
    notFound();
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/admin/products`}
          className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <svg
            className="w-5 h-5 text-neutral-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Edit Product</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Update product details for <span className="font-medium">{product.slug}</span>
          </p>
        </div>
      </div>

      {/* Form */}
      <ProductForm product={product} />

      {/* Stock Management */}
      <StockManagement product={product} />
    </div>
  );
}
