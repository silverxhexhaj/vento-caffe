"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import type { Database } from "@/lib/supabase/types";
import type { SupplierReceiptListItem } from "@/lib/actions/receipts";
import {
  analyzeSupplierReceipt,
  deleteSupplierReceipt,
  getSupplierReceiptById,
  refreshSupplierReceiptImageUrl,
  saveSupplierReceiptReview,
  uploadAndAnalyzeSupplierReceipt,
} from "@/lib/actions/receipts";
import type { SaveSupplierReceiptLineInput } from "@/lib/actions/receipts";
import { formatDate, formatPrice } from "@/lib/utils";

type ReceiptRow = Database["public"]["Tables"]["supplier_receipts"]["Row"];
type ReceiptLineRow = Database["public"]["Tables"]["supplier_receipt_lines"]["Row"];

export interface ReceiptProductOption {
  id: string;
  slug: string;
  name_key: string;
}

interface ReceiptsAdminClientProps {
  initialReceipts: SupplierReceiptListItem[];
  products: ReceiptProductOption[];
  locale: string;
}

export default function ReceiptsAdminClient({
  initialReceipts,
  products,
  locale,
}: ReceiptsAdminClientProps) {
  const router = useRouter();
  const [receiptList, setReceiptList] = useState(initialReceipts);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [header, setHeader] = useState({
    supplier_name: "",
    receipt_number: "",
    receipt_date: "",
    currency: "ALL",
    subtotal: "" as string,
    tax: "" as string,
    total: "" as string,
    notes: "",
    status: "draft" as ReceiptRow["status"],
  });

  const [lines, setLines] = useState<SaveSupplierReceiptLineInput[]>([]);
  const [detailMeta, setDetailMeta] = useState<Partial<ReceiptRow>>({});
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, startTransition] = useTransition();

  useEffect(() => {
    setReceiptList(initialReceipts);
  }, [initialReceipts]);

  const resetMessages = () => {
    setMessage(null);
    setError(null);
  };

  const lineToDraft = useCallback((row: ReceiptLineRow): SaveSupplierReceiptLineInput => {
    return {
      description_raw: row.description_raw,
      quantity: row.quantity,
      unit_amount: row.unit_amount,
      line_total: row.line_total,
      suggested_product_id: row.suggested_product_id,
      suggested_match_confidence:
        row.suggested_match_confidence != null ? Number(row.suggested_match_confidence) : null,
      confirmed_product_id: row.confirmed_product_id,
    };
  }, []);

  const reloadList = () => router.refresh();

  const loadDetail = useCallback(
    (id: string) => {
      startTransition(async () => {
        resetMessages();
        const res = await getSupplierReceiptById(id);
        if (res.error || !res.receipt) {
          setError(res.error ?? "Could not load receipt");
          setDetailMeta({});
          setLines([]);
          setImageUrl(null);
          return;
        }
        const r = res.receipt;
        setDetailMeta({
          extraction_confidence: r.extraction_confidence,
          extraction_error: r.extraction_error,
          created_at: r.created_at,
        });
        setImageUrl(res.signedImageUrl ?? null);
        setHeader({
          supplier_name: r.supplier_name ?? "",
          receipt_number: r.receipt_number ?? "",
          receipt_date: r.receipt_date ?? "",
          currency: r.currency || "ALL",
          subtotal: r.subtotal != null ? String(r.subtotal) : "",
          tax: r.tax != null ? String(r.tax) : "",
          total: r.total != null ? String(r.total) : "",
          notes: r.notes ?? "",
          status: r.status,
        });
        setLines(r.lines.map(lineToDraft));
      });
    },
    [lineToDraft]
  );

  useEffect(() => {
    if (!selectedId) {
      setDetailMeta({});
      setLines([]);
      setImageUrl(null);
      setHeader({
        supplier_name: "",
        receipt_number: "",
        receipt_date: "",
        currency: "ALL",
        subtotal: "",
        tax: "",
        total: "",
        notes: "",
        status: "draft",
      });
      return;
    }
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  async function refreshImage() {
    if (!selectedId) return;
    const res = await refreshSupplierReceiptImageUrl(selectedId);
    if (res.signedImageUrl) setImageUrl(res.signedImageUrl);
    else setError(res.error ?? "Could not refresh image URL");
  }

  const parseOptionalIntInput = (s: string): number | null => {
    const v = s.trim();
    if (!v) return null;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? Math.max(0, n) : null;
  };

  async function handleUpload(formData: FormData) {
    resetMessages();
    formData.set("locale", locale);
    startTransition(async () => {
      const res = await uploadAndAnalyzeSupplierReceipt(formData);
      if (res.error) setError(res.error);
      if (res.receiptId) {
        setMessage("Receipt uploaded and analyzed.");
        setSelectedId(res.receiptId);
        reloadList();
      } else if (!res.error) {
        setError("Upload failed.");
      }
    });
  }

  async function handleReanalyze() {
    if (!selectedId) return;
    resetMessages();
    startTransition(async () => {
      const err = await analyzeSupplierReceipt({ receiptId: selectedId, locale });
      if (err.error) setError(err.error);
      else setMessage("AI extraction completed.");
      loadDetail(selectedId);
      reloadList();
    });
  }

  async function handleSave(overrideStatus?: ReceiptRow["status"]) {
    if (!selectedId) return;
    resetMessages();
    const nextStatus = overrideStatus ?? header.status;
    startTransition(async () => {
      const payload = {
        locale,
        receiptId: selectedId,
        supplier_name: header.supplier_name.trim() || null,
        receipt_number: header.receipt_number.trim() || null,
        receipt_date: header.receipt_date.trim() || null,
        currency: header.currency.trim() || "ALL",
        subtotal: parseOptionalIntInput(header.subtotal),
        tax: parseOptionalIntInput(header.tax),
        total: parseOptionalIntInput(header.total),
        notes: header.notes.trim() || null,
        status: nextStatus,
        lines,
      };
      const err = await saveSupplierReceiptReview(payload);
      if (err.error) {
        setError(err.error);
        return;
      }
      setHeader((h) => ({ ...h, status: nextStatus }));
      setMessage("Saved.");
      reloadList();
    });
  }

  async function handleDelete() {
    if (!selectedId) return;
    if (!confirm("Delete this receipt and image permanently?")) return;
    resetMessages();
    startTransition(async () => {
      const err = await deleteSupplierReceipt({ receiptId: selectedId, locale });
      if (err.error) {
        setError(err.error);
        return;
      }
      setSelectedId(null);
      setMessage("Receipt deleted.");
      reloadList();
    });
  }

  function updateLine(index: number, patch: Partial<SaveSupplierReceiptLineInput>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        description_raw: "",
        quantity: 1,
        unit_amount: null,
        line_total: null,
        suggested_product_id: null,
        suggested_match_confidence: null,
        confirmed_product_id: null,
      },
    ]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const pct = (detailMeta.extraction_confidence != null ? detailMeta.extraction_confidence : null) as
    | number
    | string
    | null;
  const confNum = pct != null && pct !== "" ? Number(pct) : null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,340px)_1fr] gap-8">
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">Upload receipt</h2>
          <p className="text-sm text-neutral-500 mb-4">
            JPEG / PNG / WebP, max 8MB. We store the image privately and extract line items with AI.
          </p>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void handleUpload(fd);
            }}
          >
            <input type="hidden" name="locale" value={locale} />
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              required
              disabled={isBusy}
              className="block w-full text-sm text-neutral-600"
            />
            <button
              type="submit"
              disabled={isBusy}
              className="w-full px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              Upload &amp; analyze
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">Receipts</h2>
            <p className="text-xs text-neutral-400 mt-1">Newest first</p>
          </div>
          <ul className="max-h-[480px] overflow-y-auto divide-y divide-neutral-100">
            {receiptList.length === 0 ? (
              <li className="p-6 text-sm text-neutral-500 text-center">No receipts yet.</li>
            ) : (
              receiptList.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left p-4 text-sm hover:bg-neutral-50 transition-colors ${
                      selectedId === r.id ? "bg-neutral-100" : ""
                    }`}
                  >
                    <div className="font-medium text-neutral-900 truncate">
                      {r.supplier_name?.trim() || "Unknown supplier"}
                    </div>
                    <div className="text-neutral-500 text-xs mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span>{r.receipt_date || "No date"}</span>
                      <span>{r.total != null ? formatPrice(Number(r.total)) : "—"}</span>
                      <span className="capitalize">{r.status}</span>
                      <span>{r.line_count ?? 0} lines</span>
                      {r.extraction_confidence != null ? (
                        <span className="text-amber-800">
                          {(Number(r.extraction_confidence) * 100).toFixed(0)}% conf.
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        {(message || error) && (
          <div className={`rounded-xl border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-900" : "border-green-200 bg-green-50 text-green-950"}`}>
            {error || message}
          </div>
        )}

        {!selectedId ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center text-neutral-500 text-sm">
            Select a receipt or upload a new image.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleReanalyze()}
                className="px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
              >
                Re-run AI extraction
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => refreshImage()}
                className="px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
              >
                Refresh preview URL
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleSave()}
                className="px-4 py-2 rounded-lg bg-neutral-700 text-white text-sm font-medium hover:bg-neutral-600 disabled:opacity-50 ml-auto"
              >
                Save changes
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleSave("reviewed")}
                className="px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50"
              >
                Mark reviewed
              </button>
            </div>

            {detailMeta.extraction_error ? (
              <div className="text-sm rounded-lg border border-amber-200 bg-amber-50 text-amber-950 p-4">
                <strong className="font-semibold">Extraction warning:</strong> {detailMeta.extraction_error}
              </div>
            ) : null}

            {detailMeta.created_at ? (
              <p className="text-xs text-neutral-400" suppressHydrationWarning>
                Uploaded {formatDate(detailMeta.created_at)}
              </p>
            ) : null}

            {confNum != null && !Number.isNaN(confNum) ? (
              <p className="text-sm text-neutral-600">
                Extraction confidence: <strong>{(confNum * 100).toFixed(1)}%</strong>
              </p>
            ) : null}

            <div className="grid lg:grid-cols-2 gap-6 items-start">
              <div className="bg-neutral-950 rounded-xl overflow-hidden border border-neutral-900 min-h-[200px]">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="Receipt" className="w-full max-h-[480px] object-contain mx-auto bg-black" />
                ) : (
                  <div className="p-8 text-neutral-400 text-sm text-center">No preview URL. Try Refresh.</div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-neutral-900">Header</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="text-xs font-medium text-neutral-600 uppercase">
                    Supplier
                    <input
                      className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                      value={header.supplier_name}
                      onChange={(e) => setHeader((h) => ({ ...h, supplier_name: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs font-medium text-neutral-600 uppercase">
                    Receipt #
                    <input
                      className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                      value={header.receipt_number}
                      onChange={(e) => setHeader((h) => ({ ...h, receipt_number: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs font-medium text-neutral-600 uppercase">
                    Date
                    <input
                      type="date"
                      className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                      value={header.receipt_date ?? ""}
                      onChange={(e) => setHeader((h) => ({ ...h, receipt_date: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs font-medium text-neutral-600 uppercase">
                    Currency
                    <input
                      className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                      value={header.currency}
                      onChange={(e) =>
                        setHeader((h) => ({ ...h, currency: e.target.value.toUpperCase().slice(0, 8) }))
                      }
                    />
                  </label>
                  <label className="text-xs font-medium text-neutral-600 uppercase">
                    Subtotal (LEK)
                    <input
                      className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm tabular-nums"
                      inputMode="numeric"
                      value={header.subtotal}
                      onChange={(e) => setHeader((h) => ({ ...h, subtotal: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs font-medium text-neutral-600 uppercase">
                    Tax (LEK)
                    <input
                      className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm tabular-nums"
                      inputMode="numeric"
                      value={header.tax}
                      onChange={(e) => setHeader((h) => ({ ...h, tax: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs font-medium text-neutral-600 uppercase">
                    Total (LEK)
                    <input
                      className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm tabular-nums font-semibold"
                      inputMode="numeric"
                      value={header.total}
                      onChange={(e) => setHeader((h) => ({ ...h, total: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs font-medium text-neutral-600 uppercase">
                    Archive status
                    <select
                      className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      value={header.status}
                      onChange={(e) =>
                        setHeader((h) => ({
                          ...h,
                          status: e.target.value as ReceiptRow["status"],
                        }))
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                  <label className="sm:col-span-2 text-xs font-medium text-neutral-600 uppercase">
                    Notes
                    <textarea
                      rows={3}
                      className="mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      value={header.notes}
                      onChange={(e) => setHeader((h) => ({ ...h, notes: e.target.value }))}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">Line items</h3>
                <button
                  type="button"
                  onClick={addLine}
                  disabled={isBusy}
                  className="text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
                >
                  Add line
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-[11px] font-medium text-neutral-500 uppercase">
                      <th className="pb-2 pr-2">Description</th>
                      <th className="pb-2 pr-2 text-right w-24">Qty</th>
                      <th className="pb-2 pr-2 text-right w-28">Unit</th>
                      <th className="pb-2 pr-2 text-right w-28">Line</th>
                      <th className="pb-2 pr-2">Suggested match</th>
                      <th className="pb-2 pr-2">Confirmed product</th>
                      <th className="pb-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-neutral-500">
                          No lines. Run AI extraction or add manually.
                        </td>
                      </tr>
                    ) : (
                      lines.map((line, idx) => (
                        <tr key={`line-${idx}`} className="align-top">
                          <td className="py-2 pr-2">
                            <textarea
                              rows={2}
                              className="w-full rounded border border-neutral-200 px-2 py-1 text-xs"
                              value={line.description_raw}
                              onChange={(e) => updateLine(idx, { description_raw: e.target.value })}
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="number"
                              min={0}
                              className="w-full text-right rounded border border-neutral-200 px-2 py-1 tabular-nums"
                              value={line.quantity}
                              onChange={(e) =>
                                updateLine(idx, { quantity: Number.parseInt(e.target.value || "0", 10) || 0 })
                              }
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              className="w-full text-right rounded border border-neutral-200 px-2 py-1 tabular-nums"
                              inputMode="numeric"
                              placeholder="—"
                              value={line.unit_amount ?? ""}
                              onChange={(e) => {
                                const v = e.target.value.trim();
                                updateLine(idx, {
                                  unit_amount: v === "" ? null : Number.parseInt(v, 10) || 0,
                                });
                              }}
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              className="w-full text-right rounded border border-neutral-200 px-2 py-1 tabular-nums"
                              inputMode="numeric"
                              placeholder="—"
                              value={line.line_total ?? ""}
                              onChange={(e) => {
                                const v = e.target.value.trim();
                                updateLine(idx, {
                                  line_total: v === "" ? null : Number.parseInt(v, 10) || 0,
                                });
                              }}
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <div className="text-xs text-neutral-600 space-y-1">
                              <select
                                className="w-full rounded border border-neutral-200 px-2 py-1 bg-neutral-50"
                                value={line.suggested_product_id ?? ""}
                                onChange={(e) =>
                                  updateLine(idx, {
                                    suggested_product_id: e.target.value || null,
                                  })
                                }
                              >
                                <option value="">None</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name_key} ({p.slug})
                                  </option>
                                ))}
                              </select>
                              {line.suggested_match_confidence != null ? (
                                <span className="text-neutral-400">
                                  AI confidence: {(Number(line.suggested_match_confidence) * 100).toFixed(0)}%
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-2 pr-2">
                            <select
                              className="w-full rounded border border-neutral-200 px-2 py-1"
                              value={line.confirmed_product_id ?? ""}
                              onChange={(e) =>
                                updateLine(idx, { confirmed_product_id: e.target.value || null })
                              }
                            >
                              <option value="">Unconfirmed</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name_key} ({p.slug})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => removeLine(idx)}
                              className="text-red-700 text-xs font-medium underline"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-neutral-400">
                Confirm catalog matches manually before archiving. Saving does not change stock (phase 1).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
