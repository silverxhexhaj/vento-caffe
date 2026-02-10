import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";

export const metadata = {
  title: "New Product - Admin",
};

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

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
          <h1 className="text-2xl font-bold text-neutral-900">Create Product</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Add a new coffee product or espresso machine to your catalog
          </p>
        </div>
      </div>

      {/* Form */}
      <ProductForm />
    </div>
  );
}
