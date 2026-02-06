import Link from "next/link";
import { getAdminOrderById } from "@/lib/actions/admin";
import StatusBadge from "@/components/admin/StatusBadge";
import OrderStatusControl from "@/components/admin/OrderStatusControl";

interface OrderDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const { locale, id } = await params;
  const { order, error } = await getAdminOrderById(id);

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
          <div className="bg-white rounded-xl border border-neutral-200">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">Order Items</h2>
            </div>
            <div className="divide-y divide-neutral-100">
              {order.order_items?.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  {item.products?.images?.[0] && (
                    <div className="w-14 h-14 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.products.images[0]}
                        alt={item.products.name_key}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 text-sm">
                      {item.products?.name_key || "Unknown product"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Qty: {item.quantity}
                      {item.is_free && (
                        <span className="ml-2 text-green-600 font-medium">FREE</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {item.is_free
                        ? "Free"
                        : `€${Number(item.price_at_purchase).toFixed(2)}`}
                    </p>
                    {!item.is_free && item.quantity > 1 && (
                      <p className="text-xs text-neutral-400">
                        €{(Number(item.price_at_purchase) * item.quantity).toFixed(2)} total
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-neutral-200 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-neutral-500">Order Total</p>
                <p className="text-xl font-bold text-neutral-900">
                  &euro;{Number(order.total).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

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

          {/* Client Info */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Client</h3>
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-900">
                {order.profiles?.full_name || "Unknown"}
              </p>
              {order.profiles?.phone && (
                <p className="text-sm text-neutral-500">{order.profiles.phone}</p>
              )}
              <Link
                href={`/${locale}/admin/clients/${order.user_id}`}
                className="text-xs font-medium text-neutral-600 hover:text-neutral-900 underline-offset-2 hover:underline inline-block mt-1"
              >
                View client profile
              </Link>
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
