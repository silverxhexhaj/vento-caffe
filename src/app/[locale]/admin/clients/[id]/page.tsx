import Link from "next/link";
import { getAdminClientById } from "@/lib/actions/admin";
import OrdersTable from "@/components/admin/OrdersTable";

interface ClientDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AdminClientDetailPage({ params }: ClientDetailPageProps) {
  const { locale, id } = await params;
  const { client, orders, error } = await getAdminClientById(id);

  if (error || !client) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">Client not found: {error}</p>
        <Link
          href={`/${locale}/admin/clients`}
          className="text-sm text-neutral-600 hover:text-neutral-900 mt-4 inline-block underline"
        >
          Back to clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${locale}/admin/clients`}
          className="text-sm text-neutral-500 hover:text-neutral-900 mb-2 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to clients
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">
          {client.full_name || "Unknown Client"}
        </h1>
      </div>

      {/* Client Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <p className="text-sm text-neutral-500">Total Orders</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">
            {client.orders_count ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <p className="text-sm text-neutral-500">Lifetime Value</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">
            &euro;{(client.total_spent ?? 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <p className="text-sm text-neutral-500">Member Since</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">
            {new Date(client.created_at).toLocaleDateString("en-GB", {
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Client Details */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Contact Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Name</p>
            <p className="text-sm font-medium text-neutral-900 mt-0.5">
              {client.full_name || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Phone</p>
            <p className="text-sm font-medium text-neutral-900 mt-0.5">
              {client.phone || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Email</p>
            <p className="text-sm font-medium text-neutral-900 mt-0.5">
              {client.email || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Role</p>
            <p className="text-sm font-medium text-neutral-900 mt-0.5 capitalize">
              {client.role}
            </p>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Order History</h2>
          <p className="text-sm text-neutral-500">
            All orders placed by this client
          </p>
        </div>
        <OrdersTable orders={orders} />
      </div>
    </div>
  );
}
