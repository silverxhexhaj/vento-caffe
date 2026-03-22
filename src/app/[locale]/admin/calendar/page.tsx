import { Suspense } from "react";
import { getAdminFollowUpRows } from "@/lib/actions/admin";
import OrdersFollowUpCalendar from "@/components/admin/OrdersFollowUpCalendar";

interface CalendarPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

function CalendarFallback() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-8 text-sm text-neutral-500">
      Loading calendar…
    </div>
  );
}

export default async function AdminCalendarPage({
  params,
  searchParams,
}: CalendarPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const includeCancelled = sp.statusScope === "all";

  const { rows, error } = await getAdminFollowUpRows({ includeCancelled });

  return (
    <Suspense fallback={<CalendarFallback />}>
      <OrdersFollowUpCalendar locale={locale} rows={rows} error={error} />
    </Suspense>
  );
}
