import Link from "next/link";
import type { ProductProfitRow } from "@/lib/actions/admin";
import { getFinanceDashboard } from "@/lib/actions/admin";
import FinanceChart from "@/components/admin/FinanceChart";
import StatsCard from "@/components/admin/StatsCard";
import { formatPrice } from "@/lib/utils";

export const metadata = {
  title: "Finance - Admin",
};

function formatPct(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function FinanceAccuracyNote() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-950 space-y-2">
      <h3 className="font-semibold text-amber-900">How these numbers work</h3>
      <ul className="list-disc pl-5 space-y-1 text-amber-900/90">
        <li>
          <strong>Revenue</strong> sums non-cancelled orders using{" "}
          <code className="text-xs bg-amber-100 px-1 rounded">total_override</code>{" "}
          when set, otherwise the order total — same logic as the main dashboard.
        </li>
        <li>
          <strong>Estimated product spend (COGS)</strong> multiplies sold quantity by
          each product&apos;s current <strong>cost price</strong>. If supplier costs changed
          over time or some items lack a cost, figures are approximate.
        </li>
        <li>
          <strong>Monthly buckets</strong> use the UTC month of each order&apos;s{" "}
          <code className="text-xs bg-amber-100 px-1 rounded">created_at</code>.
        </li>
      </ul>
      <p className="text-amber-900/85 pt-1">
        <strong>For financial accuracy:</strong> track purchase totals (e.g. add{" "}
        <code className="text-xs bg-amber-100 px-1 rounded">unit_cost</code> / invoices on inventory
        purchases) and optionally store cost at checkout on each order line.
      </p>
    </div>
  );
}

function ProductProfitabilityTable({
  rows,
  locale,
}: {
  rows: ProductProfitRow[];
  locale: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-8 text-center border border-neutral-100 rounded-lg">
        No sold line items in non-cancelled orders yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">
            <th className="pb-3 pr-4">Product</th>
            <th className="pb-3 pr-4">Slug</th>
            <th className="pb-3 pr-4 text-right">Units sold</th>
            <th className="pb-3 pr-4 text-right">Revenue</th>
            <th className="pb-3 pr-4 text-right">Est. spend</th>
            <th className="pb-3 pr-4 text-right">Gross profit</th>
            <th className="pb-3 text-right">Margin</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((p) => (
            <tr key={p.product_id} className="text-neutral-800">
              <td className="py-3 pr-4">
                <Link
                  href={`/${locale}/admin/products/${p.product_id}`}
                  className="font-medium text-neutral-900 hover:underline underline-offset-2"
                >
                  {p.name_key}
                </Link>
              </td>
              <td className="py-3 pr-4 text-neutral-500 font-mono text-xs">{p.slug}</td>
              <td className="py-3 pr-4 text-right tabular-nums">{p.unitsSold}</td>
              <td className="py-3 pr-4 text-right tabular-nums">
                {formatPrice(p.revenue)}
              </td>
              <td className="py-3 pr-4 text-right tabular-nums text-amber-800">
                {formatPrice(p.estimatedCogs)}
              </td>
              <td className="py-3 pr-4 text-right tabular-nums font-medium text-green-800">
                {formatPrice(p.grossProfit)}
              </td>
              <td className="py-3 text-right tabular-nums">
                {formatPct(p.marginPercent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminFinancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { overview, monthly, products, error } = await getFinanceDashboard({
    months: 12,
    topProductsLimit: 20,
  });

  if (error || !overview) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">
          Failed to load finance dashboard: {error ?? "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Finance</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Revenue versus estimated cost of goods (from current product cost prices).
          </p>
          <p className="text-xs text-neutral-400 mt-2">
            Daily order and revenue trends are on the{" "}
            <Link
              href={`/${locale}/admin`}
              className="font-medium text-neutral-700 underline-offset-2 hover:underline"
            >
              Dashboard
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total earned"
          value={formatPrice(overview.totalRevenue)}
          subtitle="All-time, non-cancelled orders"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Earned this month"
          value={formatPrice(overview.thisMonthRevenue)}
          subtitle="Current UTC calendar month"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatsCard
          title="Est. product spend"
          value={formatPrice(overview.estimatedCogs)}
          subtitle="Quantity × current cost price across all fulfilled lines"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-8.25-13.875a47.932 47.932 0 012.163 12.065M12 21.008a48.146 48.146 0 01-9.084-16.917M12 6.381a48 48 0 014.086 9.917" />
            </svg>
          }
        />
        <StatsCard
          title="Est. product spend (month)"
          value={formatPrice(overview.thisMonthEstimatedCogs)}
          subtitle="Same COGS formula, current UTC month only"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.948zM12 18a3.75 3.75 0 001.943-7.065" />
            </svg>
          }
        />
        <StatsCard
          title="Gross profit"
          value={formatPrice(overview.grossProfit)}
          subtitle="Revenue minus estimated COGS"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 10.5 6.75l4.5 4.5 6.75-6.75m-11.025 15H2.631c-.621 0-1.125-.504-1.125-1.125V9.75m17.625 17.625V9.75a1.875 1.875 0 00-1.875-1.875h-3.879" />
            </svg>
          }
        />
        <StatsCard
          title="This month gross profit"
          value={formatPrice(overview.thisMonthGrossProfit)}
          subtitle="Monthly revenue − monthly est. COGS"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307 6.75 6.75M19.5 3.975a1.087 1.087 0 00-2.062-.318L10.61 21.087a4.875 4.875 0 01-8.086-5.086L17.962 9.956a4.884 4.884 0 011.318-.956v0zM9 13.875l-.225.225a19.068 19.068 0 01-11.962 11.962L9 13.875zM15.975 22.087a48.088 48.088 0 01-13.962-21.962" />
            </svg>
          }
        />
        <StatsCard
          title="Overall gross margin"
          value={formatPct(overview.grossMarginPercent)}
          subtitle="Based on totals above"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21h-9.5A2.25 2.25 0 015 18.75V8.625c0-.621.504-1.125 1.125-1.125H9" />
            </svg>
          }
        />
        <StatsCard
          title="This month gross margin"
          value={formatPct(overview.thisMonthGrossMarginPercent)}
          subtitle="Can swing when there are few orders"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6 6m-6 0l6-6m3 15.75v-4.5a2.25 2.25 0 00-2.25-2.25h-13.5A2.25 2.25 0 002.25 17.75v4.5m21.375-17.625a2.25 2.25 0 00-2.25-2.25H5.875a2.25 2.25 0 00-2.25 2.25V8.875c0 .621.504 1.125 1.125 1.125h16.875c.621 0 1.125-.504 1.125-1.125z" />
            </svg>
          }
        />
      </div>

      <FinanceChart data={monthly} />

      <div className="w-full bg-white rounded-xl border border-neutral-200 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            Top products by gross profit
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Line revenue excludes free promo lines; COGS counts all quantities sold.
          </p>
        </div>
        <div className="p-6">
          <ProductProfitabilityTable rows={products} locale={locale} />
        </div>
      </div>

      <FinanceAccuracyNote />
    </div>
  );
}
