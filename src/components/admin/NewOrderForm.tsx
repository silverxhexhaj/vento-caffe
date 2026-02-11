"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createAdminOrder,
  getAllProducts,
  type AdminBusiness,
  type AdminProductOption,
} from "@/lib/actions/admin";
import { formatPrice } from "@/lib/utils";

interface NewOrderFormProps {
  business: AdminBusiness;
  locale: string;
}

interface CartItem {
  productId: string;
  product: AdminProductOption;
  quantity: number;
}

export default function NewOrderForm({ business, locale }: NewOrderFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<AdminProductOption[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: business.contact_name || business.name || "",
    email: business.email || "",
    phone: business.phone || "",
    address: business.address || "",
    city: business.city || "",
    postalCode: "",
    country: "Albania",
  });
  const [notes, setNotes] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const openForm = () => {
    setIsOpen(true);
    setCart([]);
    setNotes("");
    setError(null);
    setCreatedOrderId(null);
    setShippingAddress({
      fullName: business.contact_name || business.name || "",
      email: business.email || "",
      phone: business.phone || "",
      address: business.address || "",
      city: business.city || "",
      postalCode: "",
      country: "Albania",
    });
    setIsLoadingProducts(true);
    getAllProducts().then(({ products: p, error: e }) => {
      setIsLoadingProducts(false);
      if (!e) setProducts(p);
    });
  };

  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product || product.sold_out) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId);
      if (existing) {
        return prev.map((c) =>
          c.productId === productId
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { productId, product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.productId === productId
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const total = cart.reduce(
    (sum, c) => sum + c.product.price * c.quantity,
    0
  );

  const handleSubmit = () => {
    if (cart.length === 0) {
      setError("Add at least one product");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createAdminOrder({
        business_id: business.id,
        items: cart.map((c) => ({ product_id: c.productId, quantity: c.quantity })),
        shipping_address: shippingAddress,
        notes: notes || undefined,
      });

      if (result.orderId) {
        setCreatedOrderId(result.orderId);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to create order");
      }
    });
  };

  const availableProducts = products.filter((p) => !p.sold_out);

  return (
    <>
      <button
        onClick={openForm}
        className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Create order
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                Create order for {business.name}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-neutral-900 p-1"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {createdOrderId ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <p className="font-medium text-neutral-900">Order created successfully</p>
                  <Link
                    href={`/${locale}/admin/orders/${createdOrderId}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900 underline"
                  >
                    View order
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => {
                      setCreatedOrderId(null);
                      openForm();
                    }}
                    className="mt-4 block w-full text-sm text-neutral-500 hover:text-neutral-700"
                  >
                    Create another order
                  </button>
                </div>
              ) : (
                <>
                  {/* Products */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Products
                    </label>
                    {isLoadingProducts ? (
                      <p className="text-sm text-neutral-500">Loading products...</p>
                    ) : (
                      <select
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v) {
                            addToCart(v);
                            e.target.value = "";
                          }
                        }}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                      >
                        <option value="">Select product to add...</option>
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name_key} – {formatPrice(p.price)} ({p.stock_quantity} in stock)
                          </option>
                        ))}
                      </select>
                    )}

                    {cart.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {cart.map((item) => (
                          <li
                            key={item.productId}
                            className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2"
                          >
                            <span className="text-sm font-medium">{item.product.name_key}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.productId, -1)}
                                className="w-6 h-6 rounded border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 text-sm"
                              >
                                −
                              </button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.productId, 1)}
                                className="w-6 h-6 rounded border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 text-sm"
                              >
                                +
                              </button>
                              <span className="text-sm font-medium w-20 text-right">
                                {formatPrice(item.product.price * item.quantity)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.productId)}
                                className="text-red-600 hover:text-red-700 text-xs ml-1"
                              >
                                Remove
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Shipping address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Full name</label>
                      <input
                        type="text"
                        value={shippingAddress.fullName}
                        onChange={(e) =>
                          setShippingAddress((s) => ({ ...s, fullName: e.target.value }))
                        }
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Phone</label>
                      <input
                        type="text"
                        value={shippingAddress.phone}
                        onChange={(e) =>
                          setShippingAddress((s) => ({ ...s, phone: e.target.value }))
                        }
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Address</label>
                      <input
                        type="text"
                        value={shippingAddress.address}
                        onChange={(e) =>
                          setShippingAddress((s) => ({ ...s, address: e.target.value }))
                        }
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">City</label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress((s) => ({ ...s, city: e.target.value }))
                        }
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Email</label>
                      <input
                        type="email"
                        value={shippingAddress.email}
                        onChange={(e) =>
                          setShippingAddress((s) => ({ ...s, email: e.target.value }))
                        }
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      placeholder="Optional order notes..."
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                    <p className="text-sm">
                      <span className="text-neutral-500">Total: </span>
                      <span className="font-semibold">{formatPrice(total)}</span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isPending || cart.length === 0}
                        className="px-4 py-2 text-sm font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPending ? "Creating..." : "Create order"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
