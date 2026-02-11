import Link from "next/link";
import { getAdminOrders } from "@/lib/actions/admin";
import OrdersTable from "@/components/admin/OrdersTable";
import Pagination from "@/components/admin/Pagination";

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default async function AdminOrdersPage({ params, searchParams }: OrdersPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const status = sp.status || "all";
  const page = parseInt(sp.page || "1", 10);
  const perPage = 20;

  const { orders, total, error } = await getAdminOrders({
    status,
    page,
    perPage,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Orders</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage all customer orders and delivery status
          </p>
        </div>
        <Link
          href={`/${locale}/admin/businesses`}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-900"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create order for business
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map((opt) => (
          <Link
            key={opt.value}
            href={`/${locale}/admin/orders?status=${opt.value}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              status === opt.value
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200">
        {error ? (
          <div className="p-8 text-center text-red-500 text-sm">
            Failed to load orders: {error}
          </div>
        ) : (
          <>
            <OrdersTable orders={orders} />
            <div className="px-4 pb-4">
              <Pagination total={total} perPage={perPage} currentPage={page} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
