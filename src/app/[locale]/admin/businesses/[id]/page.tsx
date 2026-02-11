import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import {
  getAdminBusinessById,
  getAdminClientById,
  getAgents,
  getBusinessAgents,
  getOrdersForBusiness,
} from "@/lib/actions/admin";
import BusinessPipelineBadge from "@/components/admin/BusinessPipelineBadge";
import BusinessStageStepper from "@/components/admin/BusinessStageStepper";
import BusinessActivityTimeline from "@/components/admin/BusinessActivityTimeline";
import AddActivityForm from "@/components/admin/AddActivityForm";
import DeleteBusinessButton from "@/components/admin/DeleteBusinessButton";
import OrdersTable from "@/components/admin/OrdersTable";
import BusinessAgentAssigner from "@/components/admin/BusinessAgentAssigner";
import NewOrderForm from "@/components/admin/NewOrderForm";

interface BusinessDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AdminBusinessDetailPage({
  params,
}: BusinessDetailPageProps) {
  const { locale, id } = await params;
  const { business, activities, error } = await getAdminBusinessById(id);

  if (error || !business) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">Business not found: {error}</p>
        <Link
          href={`/${locale}/admin/businesses`}
          className="text-sm text-neutral-600 hover:text-neutral-900 mt-4 inline-block underline"
        >
          Back to businesses
        </Link>
      </div>
    );
  }

  const [linkedClient, agentsResult, assignedAgentsResult, businessOrdersResult] =
    await Promise.all([
      business.linked_profile_id
        ? getAdminClientById(business.linked_profile_id)
        : Promise.resolve(null),
      getAgents(),
      getBusinessAgents(business.id),
      getOrdersForBusiness(business.id),
    ]);

  const businessOrders = businessOrdersResult.orders ?? [];

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900">
              {business.name}
            </h1>
            <BusinessPipelineBadge stage={business.pipeline_stage} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/${locale}/admin/businesses/${business.id}/edit`}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-900"
            >
              Edit
            </Link>
            <DeleteBusinessButton
              businessId={business.id}
              businessName={business.name}
              variant="button"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Pipeline Stage
          </h2>
          <p className="text-sm text-neutral-500">
            Update the business lifecycle stage.
          </p>
        </div>
        <BusinessStageStepper
          businessId={business.id}
          stage={business.pipeline_stage}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Business Details
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                Contact name
              </p>
              <p className="text-sm font-medium text-neutral-900 mt-0.5">
                {business.contact_name || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                Email
              </p>
              <p className="text-sm font-medium text-neutral-900 mt-0.5">
                {business.email || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                Phone
              </p>
              <p className="text-sm font-medium text-neutral-900 mt-0.5">
                {business.phone || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                Business type
              </p>
              <p className="text-sm font-medium text-neutral-900 mt-0.5 capitalize">
                {business.business_type || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                Address
              </p>
              <p className="text-sm font-medium text-neutral-900 mt-0.5">
                {business.address || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                City
              </p>
              <p className="text-sm font-medium text-neutral-900 mt-0.5">
                {business.city || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                Website
              </p>
              <p className="text-sm font-medium text-neutral-900 mt-0.5">
                {business.website || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                Source
              </p>
              <p className="text-sm font-medium text-neutral-900 mt-0.5 capitalize">
                {business.source.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          {business.tags.length ? (
            <div className="mt-4">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {business.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {business.notes ? (
            <div className="mt-4">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                Notes
              </p>
              <p className="text-sm text-neutral-600">{business.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                Linked Records
              </h2>
              <p className="text-sm text-neutral-500">
                Connections to signups and sample bookings.
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 p-4">
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                Signup profile
              </p>
              {linkedClient?.client ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium text-neutral-900">
                    {linkedClient.client.full_name || "Unnamed client"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Orders: {linkedClient.client.orders_count ?? 0}
                  </p>
                  <p className="text-xs text-neutral-500">
                    LTV: {formatPrice(linkedClient.client.total_spent ?? 0)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-neutral-400 mt-2">Not linked</p>
              )}
            </div>
            <div className="rounded-lg border border-neutral-200 p-4">
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                Sample booking
              </p>
              {business.sample_bookings ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium text-neutral-900">
                    {business.sample_bookings.full_name}
                  </p>
                  <p className="text-xs text-neutral-500 capitalize">
                    {business.sample_bookings.business_type} •{" "}
                    {business.sample_bookings.city}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Status: {business.sample_bookings.status}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-neutral-400 mt-2">Not linked</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                Assigned Agents
              </h2>
              <p className="text-sm text-neutral-500">
                Manage who owns this business.
              </p>
            </div>
            <BusinessAgentAssigner
              businessId={business.id}
              agents={agentsResult.agents}
              assignedAgents={assignedAgentsResult.agents}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Activity Timeline
            </h2>
            <p className="text-sm text-neutral-500">
              Log calls, notes, and updates.
            </p>
          </div>
          <AddActivityForm businessId={business.id} />
          <BusinessActivityTimeline activities={activities} />
        </div>

        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                Order History
              </h2>
              <p className="text-sm text-neutral-500">
                Orders for this business (via admin or linked profile).
              </p>
            </div>
            <NewOrderForm business={business} locale={locale} />
          </div>
          {businessOrders.length ? (
            <OrdersTable orders={businessOrders} />
          ) : (
            <div className="p-6 text-sm text-neutral-400">
              No orders yet. Create one with the button above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
