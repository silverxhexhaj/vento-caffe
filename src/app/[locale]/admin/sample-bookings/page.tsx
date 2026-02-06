import Link from "next/link";
import { getAdminSampleBookings } from "@/lib/actions/admin";
import SampleBookingsTable from "@/components/admin/SampleBookingsTable";

interface SampleBookingsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default async function AdminSampleBookingsPage({
  params,
  searchParams,
}: SampleBookingsPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const status = sp.status || "all";

  const { bookings, error } = await getAdminSampleBookings(
    status !== "all" ? status : undefined
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Sample Bookings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage free sample booking requests
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map((opt) => (
          <Link
            key={opt.value}
            href={`/${locale}/admin/sample-bookings?status=${opt.value}`}
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
            Failed to load bookings: {error}
          </div>
        ) : (
          <SampleBookingsTable bookings={bookings} />
        )}
      </div>
    </div>
  );
}
