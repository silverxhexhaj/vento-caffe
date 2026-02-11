"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  type AdminNotification,
} from "@/lib/actions/admin";

interface NotificationsListProps {
  notifications: AdminNotification[];
}

export default function NotificationsList({ notifications }: NotificationsListProps) {
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
        {computedNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`rounded-xl border p-4 ${
              notification.is_read
                ? "border-neutral-200 bg-white"
                : "border-neutral-300 bg-neutral-50"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {notification.title}
                </p>
                <p className="text-sm text-neutral-600 mt-1">{notification.body}</p>
                <p className="text-xs text-neutral-500 mt-2">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
              {!notification.is_read ? (
                <button
                  type="button"
                  onClick={() => handleMarkRead(notification.id)}
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
        ))}
      </div>
    </div>
  );
}
