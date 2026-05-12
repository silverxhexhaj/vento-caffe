import ReceiptsAdminClient from "@/components/admin/receipts/ReceiptsAdminClient";
import StatsCard from "@/components/admin/StatsCard";
import { getAdminProducts } from "@/lib/actions/admin";
import { getSupplierReceiptSummary, getSupplierReceipts } from "@/lib/actions/receipts";
import { formatPrice } from "@/lib/utils";

export const metadata = {
  title: "Receipts - Admin",
};

export default async function AdminReceiptsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [receiptsResult, summaryResult, productsResult] = await Promise.all([
    getSupplierReceipts(),
    getSupplierReceiptSummary(),
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

  const s = summaryResult.summary;
  const needsAttentionSubtitle = `${s.draftReceiptCount} draft${s.draftReceiptCount === 1 ? "" : "s"} · ${s.reviewedMissingTotalCount} reviewed without total`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Supplier receipts</h1>
        <p className="text-sm text-neutral-500 mt-1 max-w-xl">
          Upload invoice or fiscal receipt photos. Images stay private on Supabase Storage. AI extracts totals
          and line items—you confirm catalog matches before saving. Inventory is unchanged in phase 1.
        </p>
        {summaryResult.error ? (
          <p className="text-xs text-amber-800 mt-2">Summary could not be loaded: {summaryResult.error}</p>
        ) : null}
        {productsResult.error ? (
          <p className="text-xs text-amber-800 mt-2">
            Catalog warning (product matching dropdowns): {productsResult.error}
          </p>
        ) : null}
      </div>

      {!summaryResult.error ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            title="Total reviewed expenses"
            value={formatPrice(s.totalReviewedExpenses)}
            subtitle="Sum of totals on reviewed receipts only"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75"
                />
              </svg>
            }
          />
          <StatsCard
            title="Reviewed expenses (this month)"
            value={formatPrice(s.thisMonthReviewedExpenses)}
            subtitle="UTC month · by receipt date (else upload time)"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
          />
          <StatsCard
            title="Reviewed receipts"
            value={s.reviewedReceiptCount}
            subtitle="Marked reviewed in archive"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatsCard
            title="Needs attention"
            value={s.draftReceiptCount + s.reviewedMissingTotalCount}
            subtitle={needsAttentionSubtitle}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            }
          />
        </div>
      ) : null}

      <ReceiptsAdminClient initialReceipts={receiptsResult.receipts} products={products} locale={locale} />
    </div>
  );
}
