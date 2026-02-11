import Link from "next/link";
import {
  getAdminOrderById,
  getAllProducts,
  getBusinessIdByLinkedProfile,
} from "@/lib/actions/admin";
import StatusBadge from "@/components/admin/StatusBadge";
import OrderStatusControl from "@/components/admin/OrderStatusControl";
import OrderItemsEditor from "@/components/admin/OrderItemsEditor";
import OrderTotalOverride from "@/components/admin/OrderTotalOverride";

interface OrderDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const { locale, id } = await params;
  const [{ order, error }, { products = [] }] = await Promise.all([
    getAdminOrderById(id),
    getAllProducts(),
  ]);

  if (error || !order) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">Order not found: {error}</p>
        <Link
          href={`/${locale}/admin/orders`}
          className="text-sm text-neutral-600 hover:text-neutral-900 mt-4 inline-block underline"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  const shippingAddress = order.shipping_address as Record<string, string>;

  let linkedBusinessId: string | null = null;
  if (order.user_id && !order.business_id) {
    const res = await getBusinessIdByLinkedProfile(order.user_id);
    linkedBusinessId = res.businessId;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/${locale}/admin/orders`}
            className="text-sm text-neutral-500 hover:text-neutral-900 mb-2 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to orders
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">
            Order #{order.id.slice(0, 8)}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={order.status} />
            {order.is_subscription && (
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                Subscription
              </span>
            )}
            <span className="text-sm text-neutral-500">
              {new Date(order.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <OrderItemsEditor
            order={order}
            products={products}
            canEdit={!["delivered", "cancelled"].includes(order.status)}
          />

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">Order Notes</h3>
              <p className="text-sm text-neutral-600">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">
              Order Status
            </h3>
            <OrderStatusControl orderId={order.id} currentStatus={order.status} />
          </div>

          {/* Order Total Override */}
          <OrderTotalOverride
            orderId={order.id}
            total={order.total}
            totalOverride={order.total_override ?? null}
            canEdit={!["delivered", "cancelled"].includes(order.status)}
          />

          {/* Client / Business Info */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
              {order.business_id ? "Business" : "Client"}
            </h3>
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-900">
                {order.profiles?.full_name ||
                  order.businesses?.name ||
                  order.businesses?.contact_name ||
                  "Unknown"}
              </p>
              {(order.profiles?.phone || order.businesses?.phone) && (
                <p className="text-sm text-neutral-500">
                  {order.profiles?.phone || order.businesses?.phone}
                </p>
              )}
              {(order.business_id || linkedBusinessId) ? (
                <Link
                  href={`/${locale}/admin/businesses/${order.business_id || linkedBusinessId}`}
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900 underline-offset-2 hover:underline inline-block mt-1"
                >
                  View business
                </Link>
              ) : order.user_id ? (
                <Link
                  href={`/${locale}/admin/businesses`}
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900 underline-offset-2 hover:underline inline-block mt-1"
                >
                  View businesses
                </Link>
              ) : null}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
              Shipping Address
            </h3>
            <div className="text-sm text-neutral-600 space-y-1">
              <p className="font-medium text-neutral-900">
                {shippingAddress?.fullName}
              </p>
              <p>{shippingAddress?.address}</p>
              <p>
                {shippingAddress?.city}
                {shippingAddress?.postalCode
                  ? `, ${shippingAddress.postalCode}`
                  : ""}
              </p>
              <p>{shippingAddress?.country}</p>
              {shippingAddress?.phone && (
                <p className="pt-1">{shippingAddress.phone}</p>
              )}
              {shippingAddress?.email && (
                <p>{shippingAddress.email}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
