"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  type AdminNotification,
  type AdminNotificationEnrichedOrder,
  type AdminNotificationEnrichedSignup,
} from "@/lib/actions/admin";
import { formatPrice } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

interface NotificationsListProps {
  notifications: AdminNotification[];
  locale: string;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function OrderNotificationCard({
  notification,
  isRead,
  onMarkRead,
  isPending,
  locale,
}: {
  notification: AdminNotification;
  isRead: boolean;
  onMarkRead: () => void;
  isPending: boolean;
  locale: string;
}) {
  const enriched = notification.enriched as AdminNotificationEnrichedOrder | undefined;
  const orderId = (notification.payload?.order_id as string) || "";

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        isRead ? "border-neutral-200 bg-white" : "border-neutral-300 bg-neutral-50"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
              Order
            </span>
            {!isRead && (
              <span className="inline-flex items-center rounded-full bg-emerald-500 w-2 h-2" />
            )}
          </div>
          <p className="text-base font-semibold text-neutral-900 mt-2">
            {enriched?.customerName ?? "Unknown customer"}
          </p>
          {enriched ? (
            <div className="mt-3 space-y-2">
              <div className="rounded-lg bg-neutral-50 border border-neutral-100 p-3 text-sm">
                {enriched.items.length > 0 ? (
                  <ul className="space-y-1.5">
                    {enriched.items.map((item, i) => (
                      <li
                        key={i}
                        className="flex justify-between gap-2 text-neutral-700"
                      >
                        <span>
                          {item.name_key} × {item.quantity}
                        </span>
                        <span className="font-medium text-neutral-900">
                          {item.is_free ? (
                            <span className="text-green-600 text-xs uppercase">
                              Free
                            </span>
                          ) : (
                            formatPrice(item.price_at_purchase * item.quantity)
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-neutral-500">No items</p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-neutral-900">
                  Total: {formatPrice(enriched.total)}
                </span>
                <StatusBadge status={enriched.status} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-600 mt-1">{notification.body}</p>
          )}
          <p
            className="text-xs text-neutral-500 mt-3"
            title={new Date(notification.created_at).toLocaleString()}
          >
            {formatRelativeTime(notification.created_at)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {orderId && (
            <Link
              href={`/${locale}/admin/orders/${orderId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300"
            >
              View order
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          )}
          {!isRead ? (
            <button
              type="button"
              onClick={onMarkRead}
              disabled={isPending}
              className="inline-flex items-center rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-white disabled:opacity-50"
            >
              Mark read
            </button>
          ) : (
            <span className="inline-flex items-center rounded-lg bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
              Read
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SignupNotificationCard({
  notification,
  isRead,
  onMarkRead,
  isPending,
  locale,
}: {
  notification: AdminNotification;
  isRead: boolean;
  onMarkRead: () => void;
  isPending: boolean;
  locale: string;
}) {
  const enriched = notification.enriched as AdminNotificationEnrichedSignup | undefined;
  const businessId = (notification.payload?.business_id as string) || "";

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        isRead ? "border-neutral-200 bg-white" : "border-neutral-300 bg-neutral-50"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
              Signup
            </span>
            {!isRead && (
              <span className="inline-flex items-center rounded-full bg-blue-500 w-2 h-2" />
            )}
          </div>
          <p className="text-base font-semibold text-neutral-900 mt-2">
            {enriched?.businessName ?? "New business"}
          </p>
          {enriched?.contactName && (
            <p className="text-sm text-neutral-600 mt-0.5">
              Contact: {enriched.contactName}
            </p>
          )}
          {!enriched && <p className="text-sm text-neutral-600 mt-1">{notification.body}</p>}
          <p
            className="text-xs text-neutral-500 mt-3"
            title={new Date(notification.created_at).toLocaleString()}
          >
            {formatRelativeTime(notification.created_at)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {businessId && (
            <Link
              href={`/${locale}/admin/businesses/${businessId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300"
            >
              View business
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          )}
          {!isRead ? (
            <button
              type="button"
              onClick={onMarkRead}
              disabled={isPending}
              className="inline-flex items-center rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-white disabled:opacity-50"
            >
              Mark read
            </button>
          ) : (
            <span className="inline-flex items-center rounded-lg bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
              Read
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FallbackNotificationCard({
  notification,
  isRead,
  onMarkRead,
  isPending,
}: {
  notification: AdminNotification;
  isRead: boolean;
  onMarkRead: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        isRead ? "border-neutral-200 bg-white" : "border-neutral-300 bg-neutral-50"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">{notification.title}</p>
          <p className="text-sm text-neutral-600 mt-1">{notification.body}</p>
          <p
            className="text-xs text-neutral-500 mt-2"
            title={new Date(notification.created_at).toLocaleString()}
          >
            {formatRelativeTime(notification.created_at)}
          </p>
        </div>
        {!isRead ? (
          <button
            type="button"
            onClick={onMarkRead}
            disabled={isPending}
            className="inline-flex items-center rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-white disabled:opacity-50"
          >
            Mark read
          </button>
        ) : (
          <span className="inline-flex items-center rounded-lg bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
            Read
          </span>
        )}
      </div>
    </div>
  );
}

export default function NotificationsList({ notifications, locale }: NotificationsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);

  const computedNotifications = useMemo(
    () =>
      notifications.map((item) => ({
        ...item,
        is_read: item.is_read || readIds.has(item.id),
      })),
    [notifications, readIds]
  );

  const handleMarkRead = (id: string) => {
    setMessage(null);
    startTransition(async () => {
      const result = await markAdminNotificationRead(id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setReadIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      router.refresh();
    });
  };

  const handleMarkAllRead = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await markAllAdminNotificationsRead();
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setReadIds(new Set(notifications.map((item) => item.id)));
      setMessage("All notifications marked as read.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          Newest events from signups and orders appear here.
        </p>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={isPending || notifications.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          Mark all as read
        </button>
      </div>

      {message ? <p className="text-xs text-neutral-500">{message}</p> : null}

      <div className="space-y-3">
        {computedNotifications.map((notification) => {
          if (notification.type === "new_order") {
            return (
              <OrderNotificationCard
                key={notification.id}
                notification={notification}
                isRead={notification.is_read}
                onMarkRead={() => handleMarkRead(notification.id)}
                isPending={isPending}
                locale={locale}
              />
            );
          }
          if (notification.type === "new_business_signup") {
            return (
              <SignupNotificationCard
                key={notification.id}
                notification={notification}
                isRead={notification.is_read}
                onMarkRead={() => handleMarkRead(notification.id)}
                isPending={isPending}
                locale={locale}
              />
            );
          }
          return (
            <FallbackNotificationCard
              key={notification.id}
              notification={notification}
              isRead={notification.is_read}
              onMarkRead={() => handleMarkRead(notification.id)}
              isPending={isPending}
            />
          );
        })}
      </div>
    </div>
  );
}
