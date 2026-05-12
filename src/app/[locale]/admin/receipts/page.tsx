import ReceiptsAdminClient from "@/components/admin/receipts/ReceiptsAdminClient";
import { getAdminProducts } from "@/lib/actions/admin";
import { getSupplierReceipts } from "@/lib/actions/receipts";

export const metadata = {
  title: "Receipts - Admin",
};

export default async function AdminReceiptsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [receiptsResult, productsResult] = await Promise.all([
    getSupplierReceipts(),
    getAdminProducts(),
  ]);

  if (receiptsResult.error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">Failed to load receipts: {receiptsResult.error}</p>
      </div>
    );
  }

  const products = (productsResult.products ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name_key: p.name_key,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Supplier receipts</h1>
        <p className="text-sm text-neutral-500 mt-1 max-w-xl">
          Upload invoice or fiscal receipt photos. Images stay private on Supabase Storage. AI extracts totals
          and line items—you confirm catalog matches before saving. Inventory is unchanged in phase 1.
        </p>
        {productsResult.error ? (
          <p className="text-xs text-amber-800 mt-2">
            Catalog warning (product matching dropdowns): {productsResult.error}
          </p>
        ) : null}
      </div>

      <ReceiptsAdminClient initialReceipts={receiptsResult.receipts} products={products} locale={locale} />
    </div>
  );
}
