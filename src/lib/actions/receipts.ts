"use server";

import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";
import { verifyAdmin } from "@/lib/actions/admin";

type LooseSupabaseClient = Omit<Awaited<ReturnType<typeof createClient>>, "from"> & {
  // Generated types omit new tables until migrations are synced everywhere; keep receipts actions typed locally.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (relation: string) => any;
};

async function getReceiptsDb(): Promise<LooseSupabaseClient> {
  return (await createClient()) as unknown as LooseSupabaseClient;
}

type ReceiptRow = Database["public"]["Tables"]["supplier_receipts"]["Row"];
type ReceiptLineRow = Database["public"]["Tables"]["supplier_receipt_lines"]["Row"];
type ReceiptStatus = Database["public"]["Enums"]["supplier_receipt_status"];

const SUPPLIER_RECEIPTS_BUCKET = "supplier-receipts";
const VALID_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_RECEIPT_IMAGE_BYTES = 8 * 1024 * 1024;
/** Max products sent to AI for matching (recent first by display_order from getAdminProducts). */
const PRODUCT_CATALOG_SNIPPET_LIMIT = 120;

export interface SupplierReceiptListItem extends ReceiptRow {
  line_count: number;
}

export interface SupplierReceiptWithLines extends ReceiptRow {
  lines: ReceiptLineRow[];
}

export interface SaveSupplierReceiptLineInput {
  description_raw: string;
  quantity: number;
  unit_amount: number | null;
  line_total: number | null;
  suggested_product_id: string | null;
  suggested_match_confidence: number | null;
  confirmed_product_id: string | null;
}

export interface SaveSupplierReceiptReviewInput {
  locale: string;
  receiptId: string;
  supplier_name: string | null;
  receipt_number: string | null;
  receipt_date: string | null;
  currency: string;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  notes: string | null;
  status: ReceiptStatus;
  lines: SaveSupplierReceiptLineInput[];
}

/** AI JSON shape returned from the model — documented for validation. */
interface ReceiptExtractionAI {
  supplier_name: string | null;
  receipt_number: string | null;
  receipt_date: string | null;
  currency: string;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  overall_confidence: number | null;
  line_items: Array<{
    description_raw: string;
    quantity: number | null;
    unit_amount: number | null;
    line_total: number | null;
    suggested_product_id: string | null;
    match_confidence: number | null;
  }>;
  notes?: string | null;
}

function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  return new OpenAI({ apiKey });
}

function receiptModel() {
  return process.env.OPENAI_RECEIPT_MODEL?.trim() || "gpt-4o-mini";
}

function asString(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function parseOptionalInt(n: unknown): number | null {
  if (n == null || n === "") return null;
  if (typeof n === "number") {
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.round(n));
  }
  if (typeof n === "string") {
    const cleaned = n.replace(",", ".").trim();
    const parsed = Number.parseFloat(cleaned);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.round(parsed));
  }
  return null;
}

function clampConfidence(n: unknown): number | null {
  if (n == null) return null;
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return null;
  const c = Math.min(1, Math.max(0, num));
  return Number(c.toFixed(3));
}

function parseReceiptDate(v: unknown): string | null {
  if (v == null) return null;
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

async function ensureAdmin(): Promise<{ userId: string; error?: string }> {
  const { isAdmin, userId, error } = await verifyAdmin();
  if (!isAdmin || !userId) return { userId: "", error: error ?? "Not authorized" };
  return { userId };
}

async function validateProductIds(
  supabase: LooseSupabaseClient,
  ids: Iterable<string | null | undefined>
): Promise<Set<string>> {
  const unique = [...new Set([...ids].filter(Boolean) as string[])];
  if (unique.length === 0) return new Set();

  const { data, error } = await supabase.from("products").select("id").in("id", unique);
  if (error || !data) return new Set();
  return new Set((data as { id: string }[]).map((r) => r.id));
}

function buildCatalogSnippet(
  rows: Array<{ id: string; slug: string; name_key: string }>
): { id: string; slug: string; name_key: string }[] {
  return rows.slice(0, PRODUCT_CATALOG_SNIPPET_LIMIT);
}

function parseAiExtraction(parsed: unknown): ReceiptExtractionAI | null {
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const lineRaw = Array.isArray(obj.line_items) ? obj.line_items : [];

  const line_items = lineRaw.map((raw) => {
    if (!raw || typeof raw !== "object") {
      return {
        description_raw: "",
        quantity: null,
        unit_amount: null,
        line_total: null,
        suggested_product_id: null,
        match_confidence: null,
      };
    }
    const r = raw as Record<string, unknown>;
    const desc =
      typeof r.description_raw === "string"
        ? r.description_raw.trim()
        : typeof r.description === "string"
          ? r.description.trim()
          : "";
    return {
      description_raw: desc,
      quantity: typeof r.quantity === "number" ? r.quantity : r.quantity != null ? Number(r.quantity) : null,
      unit_amount: parseOptionalInt(r.unit_amount ?? r.unit_price),
      line_total: parseOptionalInt(r.line_total),
      suggested_product_id:
        typeof r.suggested_product_id === "string" && r.suggested_product_id.trim()
          ? r.suggested_product_id.trim()
          : null,
      match_confidence:
        typeof r.match_confidence === "number"
          ? r.match_confidence
          : typeof r.match_confidence === "string"
            ? Number(r.match_confidence)
            : null,
    };
  });

  return {
    supplier_name:
      typeof obj.supplier_name === "string"
        ? obj.supplier_name.trim() || null
        : obj.supplier_name == null
          ? null
          : String(obj.supplier_name),
    receipt_number:
      typeof obj.receipt_number === "string"
        ? obj.receipt_number.trim() || null
        : typeof obj.invoice_number === "string"
          ? obj.invoice_number.trim() || null
          : null,
    receipt_date: parseReceiptDate(obj.receipt_date),
    currency:
      typeof obj.currency === "string" && obj.currency.trim() ? obj.currency.trim().slice(0, 8).toUpperCase() : "ALL",
    subtotal: parseOptionalInt(obj.subtotal),
    tax: parseOptionalInt(obj.tax),
    total: parseOptionalInt(obj.total),
    overall_confidence: clampConfidence(obj.overall_confidence),
    line_items,
    notes: typeof obj.notes === "string" ? obj.notes.trim() || null : null,
  };
}

const RECEIPT_AI_SYSTEM = `You extract structured supplier purchase data from receipt/invoice photographs for a coffee ecommerce catalog (Albanian Leke integers, no decimals in JSON numbers — whole currency units matching the slip if shown).

Return STRICT JSON ONLY with keys:
{
  "supplier_name": string | null,
  "receipt_number": string | null,
  "receipt_date": "YYYY-MM-DD" | null,
  "currency": string (ISO-like, default "ALL"),
  "subtotal": integer | null,
  "tax": integer | null,
  "total": integer | null,
  "overall_confidence": number between 0 and 1,
  "line_items": [
    {
      "description_raw": string,
      "quantity": integer (>= 0),
      "unit_amount": integer | null,
      "line_total": integer | null,
      "suggested_product_id": string UUID | null,
      "match_confidence": number between 0 and 1 | null
    }
  ],
  "notes": string | null
}

Rules:
- Match line items to catalog products ONLY by id from the provided catalog JSON. If unsure, set suggested_product_id null and low match_confidence.
- Never invent UUIDs: suggested_product_id must be one of the catalog ids or null.
- Use integers for all money fields (whole LEK). If the slip shows decimals, round to nearest integer.
- If text is unreadable, use nulls and lower overall_confidence.
- line_items should include every purchasable line on the receipt (exclude headers/footers).`;

export async function getSupplierReceipts(): Promise<{
  receipts: SupplierReceiptListItem[];
  error: string | null;
}> {
  const auth = await ensureAdmin();
  if (auth.error) return { receipts: [], error: auth.error };

  try {
    const supabase = await getReceiptsDb();
    const { data: receipts, error: rErr } = await supabase
      .from("supplier_receipts")
      .select("*")
      .order("created_at", { ascending: false });

    if (rErr) return { receipts: [], error: rErr.message };

    const rows = (receipts ?? []) as ReceiptRow[];
    const counts = await Promise.all(
      rows.map(async (r) => {
        const { count } = await supabase
          .from("supplier_receipt_lines")
          .select("id", { count: "exact", head: true })
          .eq("receipt_id", r.id);
        return count ?? 0;
      })
    );

    const out: SupplierReceiptListItem[] = rows.map((r, i) => ({ ...r, line_count: counts[i] ?? 0 }));

    return { receipts: out, error: null };
  } catch (e) {
    return {
      receipts: [],
      error: e instanceof Error ? e.message : "Failed to load receipts",
    };
  }
}

export async function getSupplierReceiptById(id: string): Promise<{
  receipt: SupplierReceiptWithLines | null;
  signedImageUrl: string | null;
  error: string | null;
}> {
  const auth = await ensureAdmin();
  if (auth.error) return { receipt: null, signedImageUrl: null, error: auth.error };

  try {
    const supabase = await getReceiptsDb();
    const { data: rec, error: rErr } = await supabase.from("supplier_receipts").select("*").eq("id", id).single();

    if (rErr || !rec) return { receipt: null, signedImageUrl: null, error: rErr?.message ?? "Not found" };

    const { data: lines, error: lErr } = await supabase
      .from("supplier_receipt_lines")
      .select("*")
      .eq("receipt_id", id)
      .order("line_order", { ascending: true });

    if (lErr) return { receipt: null, signedImageUrl: null, error: lErr.message };

    const path = (rec as ReceiptRow).image_storage_path;
    const { data: signed, error: sErr } = await supabase.storage
      .from(SUPPLIER_RECEIPTS_BUCKET)
      .createSignedUrl(path, 3600);

    return {
      receipt: { ...(rec as ReceiptRow), lines: (lines ?? []) as ReceiptLineRow[] },
      signedImageUrl: sErr ? null : signed?.signedUrl ?? null,
      error: sErr?.message ?? null,
    };
  } catch (e) {
    return {
      receipt: null,
      signedImageUrl: null,
      error: e instanceof Error ? e.message : "Failed to load receipt",
    };
  }
}

export async function refreshSupplierReceiptImageUrl(receiptId: string): Promise<{
  signedImageUrl: string | null;
  error: string | null;
}> {
  const auth = await ensureAdmin();
  if (auth.error) return { signedImageUrl: null, error: auth.error };

  try {
    const supabase = await getReceiptsDb();
    const { data: rec, error: rErr } = await supabase
      .from("supplier_receipts")
      .select("image_storage_path")
      .eq("id", receiptId)
      .single();

    if (rErr || !rec) return { signedImageUrl: null, error: rErr?.message ?? "Not found" };

    const path = rec.image_storage_path as string;
    const { data: signed, error: sErr } = await supabase.storage
      .from(SUPPLIER_RECEIPTS_BUCKET)
      .createSignedUrl(path, 3600);

    return { signedImageUrl: sErr ? null : signed?.signedUrl ?? null, error: sErr?.message ?? null };
  } catch (e) {
    return {
      signedImageUrl: null,
      error: e instanceof Error ? e.message : "Failed to sign URL",
    };
  }
}

export async function uploadSupplierReceiptImage(formData: FormData): Promise<{
  receiptId: string | null;
  error: string | null;
}> {
  const auth = await ensureAdmin();
  if (auth.error) return { receiptId: null, error: auth.error };

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof Blob)) return { receiptId: null, error: "No file uploaded" };

  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    return { receiptId: null, error: "Invalid file type. Use JPEG, PNG, or WebP." };
  }
  if (file.size > MAX_RECEIPT_IMAGE_BYTES) {
    return { receiptId: null, error: "File exceeds 8MB limit." };
  }

  try {
    const supabase = await getReceiptsDb();
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `receipts/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { data: uploaded, error: upErr } = await supabase.storage
      .from(SUPPLIER_RECEIPTS_BUCKET)
      .upload(filename, file, {
        cacheControl: "3600",
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (upErr || !uploaded?.path) return { receiptId: null, error: upErr?.message ?? "Upload failed" };

    const { data: row, error: insErr } = await supabase
      .from("supplier_receipts")
      .insert({
        image_storage_path: uploaded.path,
        image_content_type: file.type || "application/octet-stream",
        image_size: file.size,
        status: "draft",
        created_by: auth.userId,
        extraction_error: null,
      })
      .select("id")
      .single();

    if (insErr || !row?.id) {
      await supabase.storage.from(SUPPLIER_RECEIPTS_BUCKET).remove([uploaded.path]);
      return { receiptId: null, error: insErr?.message ?? "Failed to create receipt record" };
    }

    return { receiptId: row.id as string, error: null };
  } catch (e) {
    return {
      receiptId: null,
      error: e instanceof Error ? e.message : "Upload failed",
    };
  }
}

export async function analyzeSupplierReceipt(input: {
  receiptId: string;
  locale: string;
}): Promise<{ error: string | null }> {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };

  const { receiptId, locale } = input;

  try {
    const supabase = await getReceiptsDb();

    const { data: rec, error: rErr } = await supabase
      .from("supplier_receipts")
      .select("*")
      .eq("id", receiptId)
      .single();

    if (rErr || !rec) return { error: rErr?.message ?? "Receipt not found" };

    const { data: fileBlob, error: dlErr } = await supabase.storage
      .from(SUPPLIER_RECEIPTS_BUCKET)
      .download((rec as ReceiptRow).image_storage_path);

    if (dlErr || !fileBlob) return { error: dlErr?.message ?? "Could not download receipt image" };

    const arrayBuffer = await fileBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mime = (rec as ReceiptRow).image_content_type || "image/jpeg";
    const dataUrl = `data:${mime};base64,${base64}`;

    const catalogResult = await supabase
      .from("products")
      .select("id, slug, name_key")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(PRODUCT_CATALOG_SNIPPET_LIMIT);

    if (catalogResult.error) {
      await supabase
        .from("supplier_receipts")
        .update({ extraction_error: catalogResult.error.message })
        .eq("id", receiptId);
      revalidatePath(`/${locale}/admin/receipts`);
      return { error: catalogResult.error.message };
    }

    const catalogRows = (catalogResult.data ?? []) as Array<{ id: string; slug: string; name_key: string }>;
    const catalog = buildCatalogSnippet(catalogRows);
    const validIds = new Set(catalog.map((p) => p.id));

    const client = createOpenAIClient();
    const completion = await client.chat.completions.create({
      model: receiptModel(),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: RECEIPT_AI_SYSTEM },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Catalog (match line items ONLY to these UUIDs):\n${JSON.stringify(catalog)}`,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsedUnknown: unknown;
    try {
      parsedUnknown = JSON.parse(raw || "{}") as unknown;
    } catch {
      await supabase
        .from("supplier_receipts")
        .update({
          extraction_error: "AI returned invalid JSON",
          extracted_json: { raw_text: raw } as unknown as Json,
        })
        .eq("id", receiptId);
      revalidatePath(`/${locale}/admin/receipts`);
      return { error: null };
    }

    const extracted = parseAiExtraction(parsedUnknown);
    if (!extracted) {
      await supabase
        .from("supplier_receipts")
        .update({
          extraction_error: "Could not parse AI extraction",
          extracted_json: parsedUnknown as Json,
        })
        .eq("id", receiptId);
      revalidatePath(`/${locale}/admin/receipts`);
      return { error: null };
    }

    const sanitizedLines: Array<{
      receipt_id: string;
      line_order: number;
      description_raw: string;
      quantity: number;
      unit_amount: number | null;
      line_total: number | null;
      suggested_product_id: string | null;
      suggested_match_confidence: number | null;
      confirmed_product_id: string | null;
    }> = [];
    extracted.line_items.forEach((item, idx) => {
      const qty = item.quantity != null && Number.isFinite(item.quantity) ? Math.max(0, Math.round(item.quantity)) : 1;
      const sid =
        item.suggested_product_id && validIds.has(item.suggested_product_id) ? item.suggested_product_id : null;

      sanitizedLines.push({
        receipt_id: receiptId,
        line_order: idx,
        description_raw: item.description_raw || "Unknown line",
        quantity: qty,
        unit_amount: item.unit_amount,
        line_total: item.line_total,
        suggested_product_id: sid,
        suggested_match_confidence: clampConfidence(item.match_confidence),
        confirmed_product_id: null,
      });
    });

    await supabase.from("supplier_receipt_lines").delete().eq("receipt_id", receiptId);

    const insertPayload = sanitizedLines.map(
      ({
        receipt_id,
        line_order,
        description_raw,
        quantity,
        unit_amount,
        line_total,
        suggested_product_id,
        suggested_match_confidence,
        confirmed_product_id,
      }) => ({
        receipt_id,
        line_order,
        description_raw,
        quantity,
        unit_amount,
        line_total,
        suggested_product_id,
        suggested_match_confidence,
        confirmed_product_id,
      })
    );

    if (insertPayload.length > 0) {
      const { error: liErr } = await supabase.from("supplier_receipt_lines").insert(insertPayload);
      if (liErr) {
        await supabase
          .from("supplier_receipts")
          .update({
            extraction_error: liErr.message,
            extracted_json: { ...extracted, parsing_note: "line insert failed" } as Json,
          })
          .eq("id", receiptId);
        revalidatePath(`/${locale}/admin/receipts`);
        return { error: null };
      }
    }

    await supabase
      .from("supplier_receipts")
      .update({
        supplier_name: extracted.supplier_name,
        receipt_number: extracted.receipt_number,
        receipt_date: extracted.receipt_date,
        currency: extracted.currency || "ALL",
        subtotal: extracted.subtotal,
        tax: extracted.tax,
        total: extracted.total,
        extraction_confidence: extracted.overall_confidence,
        extracted_json: { ...extracted, notes: extracted.notes } as Json,
        extraction_error: null,
      })
      .eq("id", receiptId);

    revalidatePath(`/${locale}/admin/receipts`);
    return { error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Analysis failed";
    try {
      const supabase = await getReceiptsDb();
      await supabase.from("supplier_receipts").update({ extraction_error: msg }).eq("id", receiptId);
    } catch {
      /* ignore */
    }
    return { error: msg };
  }
}

export async function uploadAndAnalyzeSupplierReceipt(formData: FormData): Promise<{
  receiptId: string | null;
  error: string | null;
}> {
  const locale = asString(formData.get("locale")) || "en";
  const up = await uploadSupplierReceiptImage(formData);
  if (up.error || !up.receiptId) return { receiptId: up.receiptId, error: up.error };

  const ana = await analyzeSupplierReceipt({ receiptId: up.receiptId, locale });
  return { receiptId: up.receiptId, error: ana.error };
}

export async function saveSupplierReceiptReview(
  input: SaveSupplierReceiptReviewInput
): Promise<{ error: string | null }> {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };

  const {
    locale,
    receiptId,
    supplier_name,
    receipt_number,
    receipt_date,
    currency,
    subtotal,
    tax,
    total,
    notes,
    status,
    lines,
  } = input;

  if (!receiptId) return { error: "Missing receipt id" };

  const allowed: ReceiptStatus[] = ["draft", "reviewed", "archived"];
  if (!allowed.includes(status)) return { error: "Invalid status" };

  try {
    const supabase = await getReceiptsDb();

    const { data: exists, error: exErr } = await supabase
      .from("supplier_receipts")
      .select("id")
      .eq("id", receiptId)
      .single();
    if (exErr || !exists) return { error: exErr?.message ?? "Receipt not found" };

    const suggestedIds = lines.map((l) => l.suggested_product_id);
    const confirmedIds = lines.map((l) => l.confirmed_product_id);
    const ok = await validateProductIds(supabase, [...suggestedIds, ...confirmedIds]);

    for (const line of lines) {
      if (line.suggested_product_id && !ok.has(line.suggested_product_id)) return { error: "Invalid suggested product id" };
      if (line.confirmed_product_id && !ok.has(line.confirmed_product_id)) return { error: "Invalid confirmed product id" };
    }

    await supabase
      .from("supplier_receipts")
      .update({
        supplier_name: supplier_name?.trim() || null,
        receipt_number: receipt_number?.trim() || null,
        receipt_date: receipt_date && /^\d{4}-\d{2}-\d{2}$/.test(receipt_date) ? receipt_date : null,
        currency: currency?.trim().slice(0, 8).toUpperCase() || "ALL",
        subtotal,
        tax,
        total,
        notes: notes?.trim() || null,
        status,
        extraction_error: null,
      })
      .eq("id", receiptId);

    await supabase.from("supplier_receipt_lines").delete().eq("receipt_id", receiptId);

    const payloads = lines.map((line, idx) => ({
      receipt_id: receiptId,
      line_order: idx,
      description_raw: line.description_raw.trim() || "",
      quantity: Math.max(0, Math.round(line.quantity || 0)),
      unit_amount: line.unit_amount != null ? Math.max(0, Math.round(line.unit_amount)) : null,
      line_total: line.line_total != null ? Math.max(0, Math.round(line.line_total)) : null,
      suggested_product_id: line.suggested_product_id || null,
      suggested_match_confidence: clampConfidence(line.suggested_match_confidence),
      confirmed_product_id: line.confirmed_product_id || null,
    }));

    if (payloads.length > 0) {
      const { error: liErr } = await supabase.from("supplier_receipt_lines").insert(payloads);
      if (liErr) return { error: liErr.message };
    }

    revalidatePath(`/${locale}/admin/receipts`);
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Save failed" };
  }
}

export async function deleteSupplierReceipt(input: {
  receiptId: string;
  locale: string;
}): Promise<{ error: string | null }> {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };

  try {
    const supabase = await getReceiptsDb();
    const { data: rec, error: rErr } = await supabase
      .from("supplier_receipts")
      .select("image_storage_path")
      .eq("id", input.receiptId)
      .single();

    if (rErr || !rec) return { error: rErr?.message ?? "Not found" };

    const path = rec.image_storage_path as string;

    await supabase.from("supplier_receipts").delete().eq("id", input.receiptId);
    await supabase.storage.from(SUPPLIER_RECEIPTS_BUCKET).remove([path]).catch(() => undefined);

    revalidatePath(`/${input.locale}/admin/receipts`);
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Delete failed" };
  }
}
