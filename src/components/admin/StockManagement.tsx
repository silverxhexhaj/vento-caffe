"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  getStockMovements,
  addStockMovement,
  type AdminProduct,
  type StockMovement,
} from "@/lib/actions/admin";

interface StockManagementProps {
  product: AdminProduct;
}

const movementTypeColors: Record<
  StockMovement["type"],
  { bg: string; text: string }
> = {
  purchase: { bg: "bg-green-100", text: "text-green-800" },
  sale: { bg: "bg-blue-100", text: "text-blue-800" },
  adjustment: { bg: "bg-amber-100", text: "text-amber-800" },
  return: { bg: "bg-purple-100", text: "text-purple-800" },
};

export default function StockManagement({ product }: StockManagementProps) {
  const router = useRouter();
  const t = useTranslations("admin.products");
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    type: "purchase" as StockMovement["type"],
    quantity: 10,
    reference: "",
    notes: "",
  });

  const loadMovements = () => {
    getStockMovements(product.id).then(({ movements: data, error: err }) => {
      if (err) setError(err);
      else setMovements(data);
    });
  };

  useEffect(() => {
    loadMovements();
  }, [product.id]);

  const stockQuantity = product.stock_quantity ?? 0;
  const lowStockThreshold = product.low_stock_threshold ?? 5;
  const isLowStock = stockQuantity <= lowStockThreshold;
  const isVeryLowStock = stockQuantity <= lowStockThreshold * 0.5;

  const handleQuickAdd = (amount: number) => {
    startTransition(async () => {
      setError(null);
      const result = await addStockMovement({
        product_id: product.id,
        type: "purchase",
        quantity: amount,
        notes: `Quick add +${amount}`,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      loadMovements();
      router.refresh();
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formState.quantity === 0) {
      setError("Quantity cannot be zero");
      return;
    }

    if (
      formState.type === "sale" &&
      formState.quantity > stockQuantity
    ) {
      setError(`Insufficient stock. Current: ${stockQuantity}`);
      return;
    }

    if (
      formState.type !== "adjustment" &&
      formState.quantity < 0
    ) {
      setError("Quantity must be positive for purchase, sale, and return");
      return;
    }

    startTransition(async () => {
      const result = await addStockMovement({
        product_id: product.id,
        type: formState.type,
        quantity: formState.quantity,
        reference: formState.reference.trim() || undefined,
        notes: formState.notes.trim() || undefined,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setFormState({ ...formState, quantity: 10, reference: "", notes: "" });
      loadMovements();
      router.refresh();
    });
  };

  const exportToCsv = () => {
    const headers = ["Date", "Type", "Quantity", "Reference", "Notes"];
    const rows = movements.map((m) => [
      new Date(m.created_at).toLocaleString(),
      m.type,
      m.type === "sale" || (m.type === "adjustment" && m.quantity < 0)
        ? -m.quantity
        : m.quantity,
      m.reference || "",
      m.notes || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-movements-${product.slug}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatQuantity = (m: StockMovement) => {
    const q = m.quantity;
    if (m.type === "sale" || (m.type === "adjustment" && q < 0)) {
      return `-${Math.abs(q)}`;
    }
    return `+${q}`;
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6">
      <h3 className="text-lg font-semibold text-neutral-900">{t("stockMovements")}</h3>

      {/* Current Stock */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-neutral-500">{t("stockQuantity")}: </span>
          <span className="text-lg font-semibold">{stockQuantity}</span>
          {stockQuantity === 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              {t("outOfStock")}
            </span>
          )}
          {isLowStock && stockQuantity > 0 && (
            <span
              className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                isVeryLowStock ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {t("lowStock")}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleQuickAdd(10)}
            disabled={isPending}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 disabled:opacity-50"
          >
            +10
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd(50)}
            disabled={isPending}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 disabled:opacity-50"
          >
            +50
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd(100)}
            disabled={isPending}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 disabled:opacity-50"
          >
            +100
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Stock Movement Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Type
            </label>
            <select
              value={formState.type}
              onChange={(e) =>
                setFormState({ ...formState, type: e.target.value as StockMovement["type"] })
              }
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="purchase">{t("movementType.purchase")}</option>
              <option value="sale">{t("movementType.sale")}</option>
              <option value="adjustment">{t("movementType.adjustment")}</option>
              <option value="return">{t("movementType.return")}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={formState.quantity}
              onChange={(e) =>
                setFormState({ ...formState, quantity: parseInt(e.target.value) || 0 })
              }
              min={formState.type === "adjustment" ? undefined : 1}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            {formState.type === "adjustment" && (
              <p className="mt-1 text-xs text-neutral-400">
                Use negative for removal (e.g. -5)
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              {t("reference")}
            </label>
            <input
              type="text"
              value={formState.reference}
              onChange={(e) => setFormState({ ...formState, reference: e.target.value })}
              placeholder="Order ID, invoice #..."
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              {t("notes")}
            </label>
            <input
              type="text"
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              placeholder="Optional notes"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed"
        >
          {isPending ? "Processing..." : t("addStock")}
        </button>
      </form>

      {/* History Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-neutral-700">History</h4>
          <button
            type="button"
            onClick={exportToCsv}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">
                  Date
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">
                  Type
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500">
                  Qty
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">
                  Reference
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-500">
                    No stock movements yet
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2 text-sm text-neutral-600">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          movementTypeColors[m.type].bg
                        } ${movementTypeColors[m.type].text}`}
                      >
                        {t(`movementType.${m.type}`)}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-2 text-sm text-right font-medium ${
                        m.type === "sale" || (m.type === "adjustment" && m.quantity < 0)
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {formatQuantity(m)}
                    </td>
                    <td className="px-4 py-2 text-sm text-neutral-600">
                      {m.reference || "—"}
                    </td>
                    <td className="px-4 py-2 text-sm text-neutral-600">
                      {m.notes || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
