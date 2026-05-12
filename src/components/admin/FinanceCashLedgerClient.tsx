"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createCashLedgerEntry,
  deleteCashLedgerEntry,
  type CashLedgerDirection,
  type CashLedgerListItem,
  type CashLedgerSource,
  type CashLedgerSummary,
} from "@/lib/actions/cash-ledger";
import { formatPrice } from "@/lib/utils";

const SOURCE_OPTIONS: { value: CashLedgerSource; label: string }[] = [
  { value: "order_payment", label: "Order payment (cash in)" },
  { value: "supplier_payment", label: "Supplier payment (cash out)" },
  { value: "manual_adjustment", label: "Manual adjustment" },
  { value: "opening_balance", label: "Opening balance" },
];

function sourceHint(source: CashLedgerSource): { direction: CashLedgerDirection; note: string } {
  switch (source) {
    case "order_payment":
      return { direction: "in", note: "Records cash received for a sale." };
    case "supplier_payment":
      return { direction: "out", note: "Records cash paid to a supplier (link the receipt when possible)." };
    case "opening_balance":
      return { direction: "in", note: "Starting cash — use once or when correcting the running balance." };
    default:
      return { direction: "in", note: "Pick direction for this adjustment." };
  }
}

function formatShortId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…`;
}

interface FinanceCashLedgerClientProps {
  locale: string;
  initialSummary: CashLedgerSummary;
  initialRecent: CashLedgerListItem[];
  orderOptions: Array<{ id: string; effectiveTotal: number; created_at: string }>;
  loadError: string | null;
}

export default function FinanceCashLedgerClient({
  locale,
  initialSummary,
  initialRecent,
  orderOptions,
  loadError,
}: FinanceCashLedgerClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [source, setSource] = useState<CashLedgerSource>("supplier_payment");
  const hint = sourceHint(source);
  const [direction, setDirection] = useState<CashLedgerDirection>(hint.direction);

  const [amount, setAmount] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const [note, setNote] = useState("");
  const [orderId, setOrderId] = useState("");
  const [receiptId, setReceiptId] = useState("");

  function onSourceChange(next: CashLedgerSource) {
    setSource(next);
    const h = sourceHint(next);
    if (next === "manual_adjustment") {
      /* keep current direction */
    } else {
      setDirection(h.direction);
    }
  }

  function applyOrderPick(id: string) {
    setOrderId(id);
    const o = orderOptions.find((x) => x.id === id);
    if (o && source === "order_payment") {
      setAmount(String(o.effectiveTotal));
    }
  }

  function resetForm() {
    setAmount("");
    setNote("");
    setOrderId("");
    setReceiptId("");
    setMessage(null);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await createCashLedgerEntry({
        locale,
        direction,
        source,
        amount,
        occurred_at: occurredAt,
        note: note || null,
        order_id: orderId.trim() || null,
        supplier_receipt_id: receiptId.trim() || null,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setMessage("Cash entry saved.");
      resetForm();
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this cash ledger row?")) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await deleteCashLedgerEntry({ locale, id });
      if (res.error) {
        setError(res.error);
        return;
      }
      setMessage("Entry removed.");
      router.refresh();
    });
  }

  const balanceTone =
    initialSummary.balance >= 0 ? "text-emerald-800" : "text-red-800";

  return (
    <div className="space-y-6">
      {loadError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Cash ledger could not load (table missing or DB error): {loadError}. Run migration{" "}
          <code className="text-xs bg-amber-100 px-1 rounded">022_cash_ledger.sql</code> on Supabase.
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 rounded-xl border border-emerald-200 bg-emerald-50/80 p-6">
          <p className="text-sm font-medium text-emerald-900">Cash balance (ledger)</p>
          <p className={`text-3xl font-bold tabular-nums mt-1 ${balanceTone}`}>
            {formatPrice(initialSummary.balance)}
          </p>
          <p className="text-xs text-emerald-900/80 mt-2">
            All cash in minus all cash out · actual movements you record, not inferred from orders.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-emerald-900/90">
            <div>
              <dt className="text-emerald-800/80">Total in</dt>
              <dd className="font-semibold tabular-nums">{formatPrice(initialSummary.totalIn)}</dd>
            </div>
            <div>
              <dt className="text-emerald-800/80">Total out</dt>
              <dd className="font-semibold tabular-nums">{formatPrice(initialSummary.totalOut)}</dd>
            </div>
            <div>
              <dt className="text-emerald-800/80">This month in</dt>
              <dd className="font-semibold tabular-nums">{formatPrice(initialSummary.thisMonthIn)}</dd>
            </div>
            <div>
              <dt className="text-emerald-800/80">This month out</dt>
              <dd className="font-semibold tabular-nums">{formatPrice(initialSummary.thisMonthOut)}</dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900">Add cash movement</h3>
          <p className="text-sm text-neutral-500 mt-1">{hint.note}</p>
          <form className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <label className="text-xs font-medium text-neutral-600 uppercase sm:col-span-2">
              Source
              <select
                className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                value={source}
                disabled={isPending || Boolean(loadError)}
                onChange={(e) => onSourceChange(e.target.value as CashLedgerSource)}
              >
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            {source === "manual_adjustment" ? (
              <label className="text-xs font-medium text-neutral-600 uppercase">
                Direction
                <select
                  className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  value={direction}
                  disabled={isPending || Boolean(loadError)}
                  onChange={(e) => setDirection(e.target.value as CashLedgerDirection)}
                >
                  <option value="in">Cash in</option>
                  <option value="out">Cash out</option>
                </select>
              </label>
            ) : (
              <div className="text-xs text-neutral-500 sm:self-end pb-2">
                Direction:{" "}
                <strong className="text-neutral-800 capitalize">{direction}</strong>
              </div>
            )}

            <label className="text-xs font-medium text-neutral-600 uppercase">
              Amount (LEK)
              <input
                className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm tabular-nums"
                inputMode="numeric"
                required
                disabled={isPending || Boolean(loadError)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>

            <label className="text-xs font-medium text-neutral-600 uppercase">
              Date (UTC day)
              <input
                type="date"
                className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                required
                disabled={isPending || Boolean(loadError)}
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </label>

            {source === "order_payment" ? (
              <label className="text-xs font-medium text-neutral-600 uppercase sm:col-span-2">
                Link order (optional)
                <select
                  className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  disabled={isPending || Boolean(loadError)}
                  value={orderId}
                  onChange={(e) => applyOrderPick(e.target.value)}
                >
                  <option value="">— None —</option>
                  {orderOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {formatShortId(o.id)} · {formatPrice(o.effectiveTotal)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="text-xs font-medium text-neutral-600 uppercase sm:col-span-2">
                Order ID (optional)
                <input
                  className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs font-mono"
                  placeholder="UUID"
                  disabled={isPending || Boolean(loadError)}
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
              </label>
            )}

            <label className="text-xs font-medium text-neutral-600 uppercase sm:col-span-2">
              Supplier receipt ID (optional)
              <input
                className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs font-mono"
                placeholder="Link receipt when paying a supplier invoice"
                disabled={isPending || Boolean(loadError)}
                value={receiptId}
                onChange={(e) => setReceiptId(e.target.value)}
              />
            </label>

            <label className="text-xs font-medium text-neutral-600 uppercase sm:col-span-2">
              Note
              <input
                className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                disabled={isPending || Boolean(loadError)}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>

            <div className="sm:col-span-2 flex flex-wrap gap-3 items-center">
              <button
                type="submit"
                disabled={isPending || Boolean(loadError)}
                className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Save entry"}
              </button>
              {(message || error) && (
                <p className={`text-sm ${error ? "text-red-600" : "text-emerald-800"}`}>
                  {error || message}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">Recent cash entries</h3>
          <p className="text-xs text-neutral-500 mt-1">Newest first · UTC dates</p>
        </div>
        <div className="overflow-x-auto">
          {initialRecent.length === 0 ? (
            <p className="p-6 text-sm text-neutral-500 text-center">No cash movements recorded yet.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs font-medium text-neutral-500 uppercase">
                  <th className="py-3 px-4">When</th>
                  <th className="py-3 px-4">Dir</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Links</th>
                  <th className="py-3 px-4">Note</th>
                  <th className="py-3 px-4 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {initialRecent.map((row) => (
                  <tr key={row.id} className="text-neutral-800">
                    <td className="py-2 px-4 text-xs text-neutral-600 whitespace-nowrap">
                      {new Date(row.occurred_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2 px-4 capitalize">{row.direction}</td>
                    <td className="py-2 px-4 text-xs">{row.source.replace(/_/g, " ")}</td>
                    <td className="py-2 px-4 text-right tabular-nums font-medium">
                      {formatPrice(row.amount)}
                    </td>
                    <td className="py-2 px-4 text-xs font-mono">
                      {row.order_id ? `Ord ${formatShortId(row.order_id)}` : ""}
                      {row.order_id && row.supplier_receipt_id ? " · " : ""}
                      {row.supplier_receipt_id ? `Rcp ${formatShortId(row.supplier_receipt_id)}` : ""}
                      {!row.order_id && !row.supplier_receipt_id ? "—" : ""}
                    </td>
                    <td className="py-2 px-4 text-xs text-neutral-600 max-w-[200px] truncate">
                      {row.note ?? "—"}
                    </td>
                    <td className="py-2 px-4">
                      <button
                        type="button"
                        disabled={isPending || Boolean(loadError)}
                        onClick={() => handleDelete(row.id)}
                        className="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
