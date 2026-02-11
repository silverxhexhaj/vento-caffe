"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveOrderItems, type AdminOrder, type AdminOrderItem, type AdminProductOption } from "@/lib/actions/admin";
import { formatPrice } from "@/lib/utils";

interface OrderItemsEditorProps {
  order: AdminOrder;
  products: AdminProductOption[];
  canEdit: boolean;
}

interface AddedItem {
  productId: string;
  product: AdminProductOption;
  quantity: number;
}

interface EditableItem {
  item: AdminOrderItem;
  quantity: number;
  removed: boolean;
}

export default function OrderItemsEditor({
  order,
  products,
  canEdit,
}: OrderItemsEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const availableProducts = products.filter((p) => !p.sold_out);

  const [editedItems, setEditedItems] = useState<Map<string, number>>(new Map());
  const [addedItems, setAddedItems] = useState<AddedItem[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const getItemQuantity = (item: AdminOrderItem): number => {
    if (removedIds.has(item.id)) return 0;
    return editedItems.get(item.id) ?? item.quantity;
  };

  const getDisplayItems = (): EditableItem[] => {
    return (order.order_items ?? [])
      .filter((i) => !removedIds.has(i.id))
      .map((item) => ({
        item,
        quantity: editedItems.get(item.id) ?? item.quantity,
        removed: false,
      }));
  };

  const calculateTotal = (): number => {
    let total = 0;
    for (const { item, quantity } of getDisplayItems()) {
      if (!item.is_free) {
        const price = item.products?.price ?? item.price_at_purchase;
        total += quantity * price;
      }
    }
    for (const add of addedItems) {
      total += add.quantity * add.product.price;
    }
    return total;
  };

  const hasChanges = (): boolean => {
    if (addedItems.length > 0 || removedIds.size > 0) return true;
    for (const item of order.order_items ?? []) {
      const qty = editedItems.get(item.id);
      if (qty !== undefined && qty !== item.quantity) return true;
    }
    return false;
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = (order.order_items ?? []).find((i) => i.id === itemId);
    if (!item) return;
    const current = getItemQuantity(item);
    const next = Math.max(1, current + delta);
    setEditedItems((prev) => {
      const nextMap = new Map(prev);
      if (next === item.quantity) {
        nextMap.delete(itemId);
      } else {
        nextMap.set(itemId, next);
      }
      return nextMap;
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setRemovedIds((prev) => new Set([...prev, itemId]));
  };

  const handleAddProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product || product.sold_out) return;
    const existing = addedItems.find((a) => a.productId === productId);
    if (existing) {
      setAddedItems((prev) =>
        prev.map((a) =>
          a.productId === productId ? { ...a, quantity: a.quantity + 1 } : a
        )
      );
    } else {
      setAddedItems((prev) => [...prev, { productId, product, quantity: 1 }]);
    }
  };

  const handleAddedQuantityChange = (productId: string, delta: number) => {
    setAddedItems((prev) =>
      prev
        .map((a) =>
          a.productId === productId
            ? { ...a, quantity: Math.max(1, a.quantity + delta) }
            : a
        )
        .filter((a) => a.quantity > 0)
    );
  };

  const handleRemoveAdded = (productId: string) => {
    setAddedItems((prev) => prev.filter((a) => a.productId !== productId));
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const updates: { itemId: string; quantity: number }[] = [];
      for (const item of order.order_items ?? []) {
        if (removedIds.has(item.id)) continue;
        const qty = editedItems.get(item.id) ?? item.quantity;
        if (qty !== item.quantity) {
          updates.push({ itemId: item.id, quantity: qty });
        }
      }

      const result = await saveOrderItems(order.id, {
        updates,
        adds: addedItems.map((a) => ({ productId: a.productId, quantity: a.quantity })),
        removes: [...removedIds],
      });

      if (result.success) {
        setIsEditing(false);
        setEditedItems(new Map());
        setAddedItems([]);
        setRemovedIds(new Set());
        setError(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedItems(new Map());
    setAddedItems([]);
    setRemovedIds(new Set());
    setError(null);
  };

  const effectiveTotal = (order as { total_override?: number | null }).total_override ?? order.total;
  const displayTotal = isEditing ? calculateTotal() : Number(effectiveTotal);

  return (
    <div className="bg-white rounded-xl border border-neutral-200">
      <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Order Items</h2>
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 underline-offset-2 hover:underline"
          >
            Edit Items
          </button>
        )}
        {canEdit && isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending || !hasChanges()}
              className="px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {!canEdit && (
        <div className="p-4 mx-6 mt-4 rounded-lg bg-amber-50 text-amber-800 text-sm">
          This order cannot be edited (delivered or cancelled).
        </div>
      )}

      <div className="divide-y divide-neutral-100">
        {getDisplayItems().map(({ item, quantity }) => (
          <div
            key={item.id}
            className="p-4 flex items-center gap-4"
          >
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
              {isEditing && canEdit ? (
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.id, -1)}
                    disabled={quantity <= 1}
                    className="w-6 h-6 rounded border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    −
                  </button>
                  <span className="text-sm font-medium w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.id, 1)}
                    className="w-6 h-6 rounded border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 text-sm font-medium"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="ml-2 text-red-600 hover:text-red-700 text-xs font-medium"
                    aria-label="Remove item"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">
                  Qty: {quantity}
                  {item.is_free && (
                    <span className="ml-2 text-green-600 font-medium">FREE</span>
                  )}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-medium text-sm">
                {item.is_free
                  ? "Free"
                  : formatPrice(
                      (item.products?.price ?? item.price_at_purchase) * quantity
                    )}
              </p>
            </div>
          </div>
        ))}

        {isEditing &&
          addedItems.map((add) => (
            <div
              key={add.productId}
              className="p-4 flex items-center gap-4 bg-green-50/50"
            >
              {add.product.images?.[0] && (
                <div className="w-14 h-14 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={add.product.images[0]}
                    alt={add.product.name_key}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 text-sm">
                  {add.product.name_key}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => handleAddedQuantityChange(add.productId, -1)}
                    disabled={add.quantity <= 1}
                    className="w-6 h-6 rounded border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    −
                  </button>
                  <span className="text-sm font-medium w-8 text-center">
                    {add.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddedQuantityChange(add.productId, 1)}
                    className="w-6 h-6 rounded border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 text-sm font-medium"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveAdded(add.productId)}
                    className="ml-2 text-red-600 hover:text-red-700 text-xs font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm text-green-700">
                  {formatPrice(add.product.price * add.quantity)} (new)
                </p>
              </div>
            </div>
          ))}

        {isEditing && canEdit && (
          <div className="p-4 border-t border-neutral-200">
            <label className="block text-xs font-medium text-neutral-500 mb-2">
              Add Product
            </label>
            <select
              onChange={(e) => {
                const v = e.target.value;
                if (v) {
                  handleAddProduct(v);
                  e.target.value = "";
                }
              }}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            >
              <option value="">Select a product to add...</option>
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name_key} – {formatPrice(p.price)} ({p.stock_quantity} in stock)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 mx-6 mt-2 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="p-4 border-t border-neutral-200 flex justify-end">
        <div className="text-right">
          <p className="text-sm text-neutral-500">Order Total</p>
          <p className="text-xl font-bold text-neutral-900">
            {formatPrice(displayTotal)}
          </p>
          {isEditing && hasChanges() && (order as { total_override?: number | null }).total_override == null && (
            <p className="text-xs text-amber-600 mt-1">
              Total will update when saved
            </p>
          )}
          {isEditing && (order as { total_override?: number | null }).total_override != null && (
            <p className="text-xs text-amber-600 mt-1">
              Custom total is set – saved total will not follow items (see sidebar to reset)
            </p>
          )}
          {!isEditing && (order as { total_override?: number | null }).total_override != null && (
            <p className="text-xs text-amber-600 mt-1">
              Custom total is set (see sidebar to reset)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
