import Link from "next/link";
import { getAdminBusinesses, getAdminBusinessStats } from "@/lib/actions/admin";
import BusinessesTable from "@/components/admin/BusinessesTable";
import SearchInput from "@/components/admin/SearchInput";
import Pagination from "@/components/admin/Pagination";
import BusinessFilters from "@/components/admin/BusinessFilters";
import ImportSignupsButton from "@/components/admin/ImportSignupsButton";

interface BusinessesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function AdminBusinessesPage({
  params,
  searchParams,
}: BusinessesPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const stage = sp.stage || "all";
  const source = sp.source || "all";
  const type = sp.type || "all";
  const tag = sp.tag || "";
  const search = sp.search || "";
  const page = Number(sp.page || 1);

  const [{ businesses, total, error }, statsResult] = await Promise.all([
    getAdminBusinesses({
      stage,
      source,
      businessType: type,
      tag: tag || undefined,
      search: search || undefined,
      page,
      perPage: 20,
    }),
    getAdminBusinessStats(),
  ]);

  const businessTypes = Array.from(
    new Set(businesses.map((business) => business.business_type).filter(Boolean))
  ) as string[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Businesses</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Track B2B leads, pipeline stages, and client health
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ImportSignupsButton />
          <Link
            href={`/${locale}/admin/businesses/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Add Business
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Total Businesses</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">
            {statsResult.error ? "-" : statsResult.total}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Leads This Month</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">
            {statsResult.error ? "-" : statsResult.leadsThisMonth}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Active Clients</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">
            {statsResult.error ? "-" : statsResult.activeClients}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Conversion Rate</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">
            {statsResult.error
              ? "-"
              : `${statsResult.conversionRate.toFixed(1)}%`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,_1fr)_auto] lg:items-center">
        <div className="max-w-sm">
          <SearchInput placeholder="Search by business, contact, or email..." />
        </div>
        <BusinessFilters businessTypes={businessTypes} />
      </div>

      <div className="bg-white rounded-xl border border-neutral-200">
        {error ? (
          <div className="p-8 text-center text-red-500 text-sm">
            Failed to load businesses: {error}
          </div>
        ) : (
          <>
            <BusinessesTable businesses={businesses} />
            <div className="px-4 pb-4">
              <Pagination total={total} perPage={20} currentPage={page} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
