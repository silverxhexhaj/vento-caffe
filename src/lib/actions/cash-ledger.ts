"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { verifyAdmin } from "@/lib/actions/admin";

type LooseSupabaseClient = Omit<Awaited<ReturnType<typeof createClient>>, "from"> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (relation: string) => any;
};

async function getCashDb(): Promise<LooseSupabaseClient> {
  return (await createClient()) as unknown as LooseSupabaseClient;
}

export type CashLedgerSource = Database["public"]["Enums"]["cash_ledger_source"];
export type CashLedgerDirection = Database["public"]["Enums"]["cash_ledger_direction"];

type CashLedgerRow = Database["public"]["Tables"]["cash_ledger_entries"]["Row"];

export interface CashLedgerSummary {
  balance: number;
  totalIn: number;
  totalOut: number;
  thisMonthIn: number;
  thisMonthOut: number;
  thisMonthNet: number;
}

export type CashLedgerListItem = CashLedgerRow;

export interface CashLedgerReceiptCoverage {
  /** Reviewed supplier receipts that have a non-null total (same basis as finance expense sum). */
  reviewedWithTotalCount: number;
  /** Distinct reviewed receipts with total that have at least one ledger row linked via supplier_receipt_id. */
  withLinkedCashEntryCount: number;
}

function utcYearMonthFromIso(isoDate: string): { year: number; month: number } {
  const d = new Date(isoDate);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

function parseOccurredAt(val: string | undefined | null): string {
  if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return `${val}T12:00:00.000Z`;
  }
  if (val) {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function parsePositiveIntAmount(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", ".").trim());
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded <= 0) return null;
  return rounded;
}

export async function getCashLedgerData(input?: {
  recentLimit?: number;
}): Promise<{
  summary: CashLedgerSummary;
  recent: CashLedgerListItem[];
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  const emptySummary: CashLedgerSummary = {
    balance: 0,
    totalIn: 0,
    totalOut: 0,
    thisMonthIn: 0,
    thisMonthOut: 0,
    thisMonthNet: 0,
  };
  if (!isAdmin) {
    return { summary: emptySummary, recent: [], error: authError };
  }

  const recentLimit = Math.min(100, Math.max(1, Math.floor(input?.recentLimit ?? 25)));

  try {
    const supabase = await getCashDb();
    const { data: rows, error } = await supabase
      .from("cash_ledger_entries")
      .select("*")
      .order("occurred_at", { ascending: false });

    if (error) {
      return { summary: emptySummary, recent: [], error: error.message };
    }

    const list = (rows ?? []) as CashLedgerRow[];
    const now = new Date();
    const ty = now.getUTCFullYear();
    const tm = now.getUTCMonth();

    let totalIn = 0;
    let totalOut = 0;
    let thisMonthIn = 0;
    let thisMonthOut = 0;

    for (const r of list) {
      const amt = Number(r.amount);
      if (!Number.isFinite(amt)) continue;
      if (r.direction === "in") {
        totalIn += amt;
      } else {
        totalOut += amt;
      }
      const { year, month } = utcYearMonthFromIso(r.occurred_at);
      if (year === ty && month === tm) {
        if (r.direction === "in") thisMonthIn += amt;
        else thisMonthOut += amt;
      }
    }

    const summary: CashLedgerSummary = {
      balance: totalIn - totalOut,
      totalIn,
      totalOut,
      thisMonthIn,
      thisMonthOut,
      thisMonthNet: thisMonthIn - thisMonthOut,
    };

    const recent = list.slice(0, recentLimit) as CashLedgerListItem[];

    return { summary, recent, error: null };
  } catch (e) {
    return {
      summary: emptySummary,
      recent: [],
      error: e instanceof Error ? e.message : "Failed to load cash ledger",
    };
  }
}

export async function getCashLedgerReceiptCoverage(): Promise<{
  coverage: CashLedgerReceiptCoverage;
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  const empty: CashLedgerReceiptCoverage = {
    reviewedWithTotalCount: 0,
    withLinkedCashEntryCount: 0,
  };
  if (!isAdmin) return { coverage: empty, error: authError };

  try {
    const supabase = await getCashDb();
    const { data: receipts, error: rErr } = await supabase
      .from("supplier_receipts")
      .select("id")
      .eq("status", "reviewed")
      .not("total", "is", null);

    if (rErr) return { coverage: empty, error: rErr.message };

    const reviewedIds = new Set(
      ((receipts ?? []) as { id: string }[]).map((r) => r.id)
    );

    const { data: links, error: lErr } = await supabase
      .from("cash_ledger_entries")
      .select("supplier_receipt_id")
      .not("supplier_receipt_id", "is", null);

    if (lErr) return { coverage: empty, error: lErr.message };

    const linked = new Set(
      ((links ?? []) as { supplier_receipt_id: string | null }[])
        .map((x) => x.supplier_receipt_id)
        .filter((id): id is string => Boolean(id))
    );

    let withLinked = 0;
    for (const id of reviewedIds) {
      if (linked.has(id)) withLinked += 1;
    }

    return {
      coverage: {
        reviewedWithTotalCount: reviewedIds.size,
        withLinkedCashEntryCount: withLinked,
      },
      error: null,
    };
  } catch (e) {
    return {
      coverage: empty,
      error: e instanceof Error ? e.message : "Failed receipt coverage",
    };
  }
}

export async function createCashLedgerEntry(input: {
  locale: string;
  direction: CashLedgerDirection;
  source: CashLedgerSource;
  amount: number | unknown;
  occurred_at?: string | null;
  note?: string | null;
  order_id?: string | null;
  supplier_receipt_id?: string | null;
}): Promise<{ error: string | null }> {
  const { isAdmin, userId, error: authError } = await verifyAdmin();
  if (!isAdmin || !userId) return { error: authError ?? "Not authorized" };

  const amount = parsePositiveIntAmount(input.amount);
  if (amount == null) return { error: "Amount must be a positive whole number (LEK)." };

  const { direction: dirInput, source } = input;
  const orderId = input.order_id?.trim() || null;
  const receiptId = input.supplier_receipt_id?.trim() || null;
  const note = input.note?.trim() || null;
  const occurredAt = parseOccurredAt(input.occurred_at ?? undefined);

  let direction = dirInput;
  if (source === "order_payment" || source === "opening_balance") direction = "in";
  if (source === "supplier_payment") direction = "out";

  try {
    const supabase = await getCashDb();

    if (orderId) {
      const { data: o, error: oErr } = await supabase.from("orders").select("id").eq("id", orderId).single();
      if (oErr || !o) return { error: oErr?.message ?? "Order not found" };
    }

    if (receiptId) {
      const { data: rec, error: recErr } = await supabase
        .from("supplier_receipts")
        .select("id")
        .eq("id", receiptId)
        .single();
      if (recErr || !rec) return { error: recErr?.message ?? "Receipt not found" };
    }

    const { error: insErr } = await supabase.from("cash_ledger_entries").insert({
      direction,
      source,
      amount,
      occurred_at: occurredAt,
      note,
      order_id: orderId,
      supplier_receipt_id: receiptId,
      created_by: userId,
    });

    if (insErr) return { error: insErr.message };

    const locale = input.locale || "en";
    revalidatePath(`/${locale}/admin/finance`);
    if (receiptId) revalidatePath(`/${locale}/admin/receipts`);

    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create entry" };
  }
}

/** Recent non-cancelled orders for linking cash-in entries (optional picker on finance). */
export async function getCashLedgerOrderPicker(): Promise<{
  orders: Array<{ id: string; effectiveTotal: number; created_at: string }>;
  error: string | null;
}> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { orders: [], error: authError };

  try {
    const supabase = await getCashDb();
    const { data, error } = await supabase
      .from("orders")
      .select("id, created_at, total, total_override")
      .not("status", "eq", "cancelled")
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) return { orders: [], error: error.message };

    const orders = ((data ?? []) as Array<{
      id: string;
      created_at: string;
      total: number;
      total_override?: number | null;
    }>).map((o) => ({
      id: o.id,
      created_at: o.created_at,
      effectiveTotal: Number(o.total_override != null ? o.total_override : o.total ?? 0),
    }));

    return { orders, error: null };
  } catch (e) {
    return {
      orders: [],
      error: e instanceof Error ? e.message : "Failed to load orders",
    };
  }
}

export async function deleteCashLedgerEntry(input: {
  locale: string;
  id: string;
}): Promise<{ error: string | null }> {
  const { isAdmin, error: authError } = await verifyAdmin();
  if (!isAdmin) return { error: authError ?? "Not authorized" };

  const id = input.id?.trim();
  if (!id) return { error: "Missing id" };

  try {
    const supabase = await getCashDb();
    const { data: row, error: fErr } = await supabase
      .from("cash_ledger_entries")
      .select("supplier_receipt_id")
      .eq("id", id)
      .single();

    if (fErr || !row) return { error: fErr?.message ?? "Entry not found" };

    const { error: dErr } = await supabase.from("cash_ledger_entries").delete().eq("id", id);
    if (dErr) return { error: dErr.message };

    const locale = input.locale || "en";
    revalidatePath(`/${locale}/admin/finance`);
    if (row.supplier_receipt_id) revalidatePath(`/${locale}/admin/receipts`);

    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete entry" };
  }
}
