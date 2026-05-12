import type { ReactNode } from "react";
import Link from "next/link";
import type { FinanceOverview, ProductProfitRow } from "@/lib/actions/admin";
import { getFinanceDashboard } from "@/lib/actions/admin";
import {
  getCashLedgerData,
  getCashLedgerOrderPicker,
  getCashLedgerReceiptCoverage,
} from "@/lib/actions/cash-ledger";
import type { SupplierReceiptSummary } from "@/lib/actions/receipts";
import { getSupplierReceiptSummary } from "@/lib/actions/receipts";
import FinanceCashLedgerClient from "@/components/admin/FinanceCashLedgerClient";
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

function FinanceHowToRead({ locale }: { locale: string }) {
  return (
    <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-5 text-sm text-amber-950">
      <h3 className="font-semibold text-amber-900">How to read this page</h3>
      <ul className="mt-2 list-disc pl-5 space-y-1 text-amber-900/90">
        <li>
          <strong>Sales / revenue</strong>: non-cancelled orders,{" "}
          <code className="text-xs bg-amber-100 px-1 rounded">total_override</code> if set, else order total
          (same as the main dashboard).
        </li>
        <li>
          <strong>Est. product cost</strong>: quantity × current catalog{" "}
          <code className="text-xs bg-amber-100 px-1 rounded">cost_price</code> — approximate if costs changed over
          time.
        </li>
        <li>
          <strong>Reviewed supplier receipts</strong>: sums of receipt{" "}
          <code className="text-xs bg-amber-100 px-1 rounded">total</code> only when status is{" "}
          <strong>reviewed</strong> and total is set; monthly bucket uses{" "}
          <code className="text-xs bg-amber-100 px-1 rounded">receipt_date</code> (UTC) or upload time.
        </li>
        <li>
          <strong>Net after receipts</strong>: gross profit minus those receipt totals — a management view; catalog
          COGS and invoices can overlap conceptually.
        </li>
        <li>
          <strong>Cash balance</strong>: sum of cash movements you record — not calculated from orders.
        </li>
      </ul>
      <p className="mt-3 text-amber-900/85">
        Fix receipt totals on{" "}
        <Link href={`/${locale}/admin/receipts`} className="font-medium underline-offset-2 hover:underline">
          Receipts
        </Link>{" "}
        before marking reviewed.
      </p>
    </div>
  );
}

function FinanceDataAlerts({
  locale,
  receiptSummary,
  receiptSummaryError,
  coverage,
  coverageError,
}: {
  locale: string;
  receiptSummary: SupplierReceiptSummary | null;
  receiptSummaryError: string | null;
  coverage: { reviewedWithTotalCount: number; withLinkedCashEntryCount: number };
  coverageError: string | null;
}) {
  const alerts: { tone: "amber" | "red"; body: ReactNode }[] = [];

  if (receiptSummaryError) {
    alerts.push({
      tone: "red",
      body: <>Receipt summary could not load: {receiptSummaryError}</>,
    });
  }

  if (receiptSummary && receiptSummary.draftReceiptCount > 0) {
    alerts.push({
      tone: "amber",
      body: (
        <>
          <strong>{receiptSummary.draftReceiptCount}</strong> supplier receipt
          {receiptSummary.draftReceiptCount === 1 ? "" : "s"} still in <strong>draft</strong>.{" "}
          <Link href={`/${locale}/admin/receipts`} className="font-medium underline-offset-2 hover:underline">
            Review on Receipts
          </Link>
        </>
      ),
    });
  }

  if (receiptSummary && receiptSummary.reviewedMissingTotalCount > 0) {
    alerts.push({
      tone: "amber",
      body: (
        <>
          <strong>{receiptSummary.reviewedMissingTotalCount}</strong> reviewed receipt
          {receiptSummary.reviewedMissingTotalCount === 1 ? " has" : "s have"} no <strong>total</strong> — excluded
          from finance expense sums until fixed.
        </>
      ),
    });
  }

  if (!coverageError && coverage.reviewedWithTotalCount > 0) {
    const unlinked = coverage.reviewedWithTotalCount - coverage.withLinkedCashEntryCount;
    if (unlinked > 0) {
      alerts.push({
        tone: "amber",
        body: (
          <>
            <strong>{unlinked}</strong> reviewed receipt{unlinked === 1 ? "" : "s"} with a total have{" "}
            <strong>no linked cash entry</strong> yet (optional — for when cash actually left).
          </>
        ),
      });
    }
  }

  if (coverageError) {
    alerts.push({
      tone: "amber",
      body: <>Cash vs receipt coverage could not load: {coverageError}</>,
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={
            a.tone === "red"
              ? "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
              : "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          }
        >
          {a.body}
        </div>
      ))}
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
            <th className="pb-3 pr-4 text-right">Est. cost</th>
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
              <td className="py-3 pr-4 text-right tabular-nums">{formatPrice(p.revenue)}</td>
              <td className="py-3 pr-4 text-right tabular-nums text-amber-800">
                {formatPrice(p.estimatedCogs)}
              </td>
              <td className="py-3 pr-4 text-right tabular-nums font-medium text-green-800">
                {formatPrice(p.grossProfit)}
              </td>
              <td className="py-3 text-right tabular-nums">{formatPct(p.marginPercent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricGroups({ overview }: { overview: FinanceOverview }) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-neutral-900 mb-3">Sales (orders)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatsCard
            title="All-time revenue"
            value={formatPrice(overview.totalRevenue)}
            subtitle="Non-cancelled orders · effective total"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
          />
          <StatsCard
            title="Revenue (this month)"
            value={formatPrice(overview.thisMonthRevenue)}
            subtitle="Current UTC month"
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
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-neutral-900 mb-3">Costs and supplier receipts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            title="Est. product cost (all time)"
            value={formatPrice(overview.estimatedCogs)}
            subtitle="Qty × current cost price on all lines"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
            }
          />
          <StatsCard
            title="Est. product cost (month)"
            value={formatPrice(overview.thisMonthEstimatedCogs)}
            subtitle="Same formula · this UTC month"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.948zM12 18a3.75 3.75 0 001.943-7.065"
                />
              </svg>
            }
          />
          <StatsCard
            title="Reviewed receipt totals"
            value={formatPrice(overview.receiptExpenses)}
            subtitle="Expenses from reviewed receipts with a total"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            }
          />
          <StatsCard
            title="Reviewed receipts (month)"
            value={formatPrice(overview.thisMonthReceiptExpenses)}
            subtitle="Bucketed by receipt date (UTC) or uploaded at"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
            }
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-neutral-900 mb-3">Profit (management view)</h2>
        <p className="text-sm text-neutral-500 mb-3 max-w-3xl">
          <strong>Gross profit</strong> uses catalog costs. <strong>Net after receipts</strong> also subtracts
          reviewed supplier invoice totals — different from your <strong>cash balance</strong>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            title="Gross profit"
            value={formatPrice(overview.grossProfit)}
            subtitle={`Margin ${formatPct(overview.grossMarginPercent)} vs revenue`}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5 10.5 6.75l4.5 4.5 6.75-6.75m-11.025 15H2.631c-.621 0-1.125-.504-1.125-1.125V9.75m17.625 17.625V9.75a1.875 1.875 0 00-1.875-1.875h-3.879"
                />
              </svg>
            }
          />
          <StatsCard
            title="Gross profit (month)"
            value={formatPrice(overview.thisMonthGrossProfit)}
            subtitle={`Margin ${formatPct(overview.thisMonthGrossMarginPercent)} · this month`}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18L9 11.25l4.306 4.307 6.75 6.75M19.5 3.975a1.087 1.087 0 00-2.062-.318L10.61 21.087a4.875 4.875 0 01-8.086-5.086L17.962 9.956a4.884 4.884 0 011.318-.956v0z"
                />
              </svg>
            }
          />
          <StatsCard
            title="Net after receipts"
            value={formatPrice(overview.netProfit)}
            subtitle={`Margin ${formatPct(overview.netMarginPercent)} · gross − invoice totals`}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 15h19.5m-16.5-5.25v6.75m4.5-6.75v6.75m4.5-6.75v6.75m4.5-6.75v6.75"
                />
              </svg>
            }
          />
          <StatsCard
            title="Net after receipts (month)"
            value={formatPrice(overview.thisMonthNetProfit)}
            subtitle={`Margin ${formatPct(overview.thisMonthNetMarginPercent)} vs monthly revenue`}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625Z"
                />
              </svg>
            }
          />
        </div>
      </section>
    </div>
  );
}

export default async function AdminFinancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [{ overview, monthly, products, error }, cashRes, coverageRes, receiptRes, ordersPick] =
    await Promise.all([
      getFinanceDashboard({ months: 12, topProductsLimit: 20 }),
      getCashLedgerData({ recentLimit: 30 }),
      getCashLedgerReceiptCoverage(),
      getSupplierReceiptSummary(),
      getCashLedgerOrderPicker(),
    ]);

  if (error || !overview) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">Failed to load finance dashboard: {error ?? "Unknown error"}</p>
      </div>
    );
  }

  const receiptSummary = receiptRes.error ? null : receiptRes.summary;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Finance</h1>
          <p className="text-sm text-neutral-500 mt-1 max-w-xl">
            Order revenue, estimated catalog costs, reviewed supplier invoices, and your real{" "}
            <strong className="text-neutral-700">cash ledger</strong>.
          </p>
          <p className="text-xs text-neutral-400 mt-2">
            Daily sales chart:{" "}
            <Link
              href={`/${locale}/admin`}
              className="font-medium text-neutral-700 underline-offset-2 hover:underline"
            >
              Dashboard
            </Link>
            .
          </p>
        </div>
        <Link
          href={`/${locale}/admin/receipts`}
          className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
        >
          Supplier receipts
        </Link>
      </div>

      <FinanceDataAlerts
        locale={locale}
        receiptSummary={receiptSummary}
        receiptSummaryError={receiptRes.error}
        coverage={coverageRes.coverage}
        coverageError={coverageRes.error}
      />

      <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Cash register</h2>
        <FinanceCashLedgerClient
          locale={locale}
          initialSummary={cashRes.summary}
          initialRecent={cashRes.recent}
          orderOptions={ordersPick.error ? [] : ordersPick.orders}
          loadError={cashRes.error}
        />
      </div>

      <MetricGroups overview={overview} />

      <FinanceChart data={monthly} />

      <div className="w-full bg-white rounded-xl border border-neutral-200 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Top products by gross profit</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Line revenue excludes free promo lines; estimated cost counts all quantities sold.
          </p>
        </div>
        <div className="p-6">
          <ProductProfitabilityTable rows={products} locale={locale} />
        </div>
      </div>

      <FinanceHowToRead locale={locale} />
    </div>
  );
}
