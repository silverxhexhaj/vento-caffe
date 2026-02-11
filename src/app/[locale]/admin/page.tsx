import Link from "next/link";
import { getAdminDashboardStats, getOrdersChartData } from "@/lib/actions/admin";
import { formatPrice } from "@/lib/utils";
import StatsCard from "@/components/admin/StatsCard";
import OrdersTable from "@/components/admin/OrdersTable";
import DashboardChart from "@/components/admin/DashboardChart";
import QuickActions from "@/components/admin/QuickActions";

interface AdminDashboardProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminDashboard({ params }: AdminDashboardProps) {
  const { locale } = await params;
  const [{ stats, error }, { data: chartData }] = await Promise.all([
    getAdminDashboardStats(),
    getOrdersChartData(7),
  ]);

  if (error || !stats) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">Failed to load dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Overview of your business performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          }
        />
        <StatsCard
          title="Pending Orders"
          value={stats.pendingOrders}
          subtitle="Awaiting confirmation"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <StatsCard
          title="Revenue"
          value={formatPrice(stats.totalRevenue)}
          subtitle="Excluding cancelled"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
            </svg>
          }
        />
        <StatsCard
          title="Active Clients"
          value={stats.activeClients}
          subtitle="With at least 1 order"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
        <QuickActions />
      </div>

      {/* Orders & Revenue Chart + Recent Orders - side by side on lg, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="min-w-0">
          <DashboardChart initialData={chartData} />
        </div>
        <div className="min-w-0 bg-white rounded-xl border border-neutral-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Recent Orders</h2>
              <p className="text-sm text-neutral-500">Latest 10 orders</p>
            </div>
            <Link
              href={`/${locale}/admin/orders`}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 underline-offset-2 hover:underline shrink-0"
            >
              View all
            </Link>
          </div>
          <OrdersTable orders={stats.recentOrders} compact />
        </div>
      </div>
    </div>
  );
}
