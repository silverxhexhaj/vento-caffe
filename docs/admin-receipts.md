# Admin supplier receipts (AI extraction)

## Routes

- **`/{locale}/admin/receipts`** — upload, list, review, and save supplier purchase documentation.

## Prerequisites

1. Apply migration **`021_supplier_receipts.sql`** (tables, RLS, private `supplier-receipts` storage bucket).
2. Set **`OPENAI_API_KEY`** in the environment. Optionally set **`OPENAI_RECEIPT_MODEL`** (defaults to `gpt-4o-mini`).

## Behavior (phase 1)

- Receipt images go to the **private** `supplier-receipts` bucket; the admin UI loads them via **short-lived signed URLs** (use “Refresh preview URL” if expired).
- AI returns JSON: supplier, document number, date, monetary totals (integer LEK-style values), line items, suggested `product_id` per line, and overall confidence. Suggestions must be from the visible product catalog snippet (up to ~120 products ordered by `display_order`).
- Saving only updates **`supplier_receipts`** and **`supplier_receipt_lines`**. It **does not** create `stock_movements` or change `products.stock_quantity`.
- Admins should set **Confirmed product** manually before archiving; mismatches can be corrected in the editor.

## Troubleshooting

- **“OPENAI_API_KEY is not configured”** — add the key locally and in deployed env.
- **RLS errors** — ensure the logged-in user’s `profiles.role` is **`admin`** and migration `021` has been applied.
- **Poor extraction** — re-run extraction, crop the photo closer to text, or correct fields manually before “Mark reviewed”.
