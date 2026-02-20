import Link from "next/link";
import { getAdminNotifications } from "@/lib/actions/admin";
import NotificationsList from "@/components/admin/NotificationsList";
import Pagination from "@/components/admin/Pagination";

interface AdminNotificationsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

function buildNotificationsUrl(
  locale: string,
  opts: { unread?: boolean; type?: string; page?: number }
): string {
  const params = new URLSearchParams();
  if (opts.unread) params.set("unread", "1");
  if (opts.type && opts.type !== "all") params.set("type", opts.type);
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  const qs = params.toString();
  return `/${locale}/admin/notifications${qs ? `?${qs}` : ""}`;
}

export default async function AdminNotificationsPage({
  params,
  searchParams,
}: AdminNotificationsPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const unreadOnly = sp.unread === "1";
  const typeFilter = (sp.type as "all" | "orders" | "signups") || "all";

  const { notifications, total, error } = await getAdminNotifications({
    page,
    perPage: 20,
    unreadOnly,
    type: typeFilter,
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
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-neutral-200 p-0.5">
            <Link
              href={buildNotificationsUrl(locale, {
                unread: unreadOnly,
                type: "all",
              })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === "all"
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              All
            </Link>
            <Link
              href={buildNotificationsUrl(locale, {
                unread: unreadOnly,
                type: "orders",
              })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === "orders"
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Orders
            </Link>
            <Link
              href={buildNotificationsUrl(locale, {
                unread: unreadOnly,
                type: "signups",
              })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === "signups"
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Signups
            </Link>
          </div>
          <Link
            href={buildNotificationsUrl(locale, {
              unread: !unreadOnly,
              type: typeFilter,
            })}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {unreadOnly ? "Show all" : "Unread only"}
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 md:p-6">
        {error ? (
          <p className="text-sm text-red-500">Failed to load notifications: {error}</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-neutral-500">No notifications yet.</p>
        ) : (
          <>
            <NotificationsList notifications={notifications} locale={locale} />
            <Pagination total={total} perPage={20} currentPage={page} />
          </>
        )}
      </div>
    </div>
  );
}
