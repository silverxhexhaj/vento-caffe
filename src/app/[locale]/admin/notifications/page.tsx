import Link from "next/link";
import { getAdminNotifications } from "@/lib/actions/admin";
import NotificationsList from "@/components/admin/NotificationsList";
import Pagination from "@/components/admin/Pagination";

interface AdminNotificationsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function AdminNotificationsPage({
  params,
  searchParams,
}: AdminNotificationsPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const unreadOnly = sp.unread === "1";

  const { notifications, total, error } = await getAdminNotifications({
    page,
    perPage: 20,
    unreadOnly,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Alerts for new business signups and new orders
          </p>
        </div>
        <Link
          href={`/${locale}/admin/notifications${unreadOnly ? "" : "?unread=1"}`}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          {unreadOnly ? "Show all" : "Unread only"}
        </Link>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 md:p-6">
        {error ? (
          <p className="text-sm text-red-500">Failed to load notifications: {error}</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-neutral-500">No notifications yet.</p>
        ) : (
          <>
            <NotificationsList notifications={notifications} />
            <Pagination total={total} perPage={20} currentPage={page} />
          </>
        )}
      </div>
    </div>
  );
}
