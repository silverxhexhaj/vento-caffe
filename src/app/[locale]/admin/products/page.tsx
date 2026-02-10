import Link from "next/link";
import { getAdminProducts } from "@/lib/actions/admin";
import ProductsTable from "@/components/admin/ProductsTable";
import LowStockAlert from "@/components/admin/LowStockAlert";

export const metadata = {
  title: "Products - Admin",
};

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { products, error } = await getAdminProducts();

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Products</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage your coffee products and espresso machines
          </p>
        </div>
        <Link
          href={`/${locale}/admin/products/new`}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Low Stock Alert */}
      <LowStockAlert products={products} />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="text-xs font-medium text-neutral-500 uppercase">
            Total Products
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">
            {products.length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="text-xs font-medium text-neutral-500 uppercase">
            Featured
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">
            {products.filter((p) => p.featured).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="text-xs font-medium text-neutral-500 uppercase">
            Cialde
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">
            {products.filter((p) => p.type === "cialde").length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="text-xs font-medium text-neutral-500 uppercase">
            Machines
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">
            {products.filter((p) => p.type === "machine").length}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <ProductsTable products={products} />
    </div>
  );
}
