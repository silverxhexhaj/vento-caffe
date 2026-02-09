import Link from "next/link";
import BusinessForm from "@/components/admin/BusinessForm";
import { getUnlinkedProfiles, getUnlinkedSampleBookings } from "@/lib/actions/admin";

interface NewBusinessPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminNewBusinessPage({ params }: NewBusinessPageProps) {
  const { locale } = await params;
  const [{ profiles }, { bookings }] = await Promise.all([
    getUnlinkedProfiles(),
    getUnlinkedSampleBookings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/admin/businesses`}
          className="text-sm text-neutral-500 hover:text-neutral-900 mb-2 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to businesses
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Create Business</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Add a new B2B client and link it to existing signups or sample bookings.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <BusinessForm profiles={profiles} bookings={bookings} />
      </div>
    </div>
  );
}
