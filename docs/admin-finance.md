# Admin finance dashboard

Metrics on **Finance** (`/admin/finance`) combine Supabase **orders**, **catalog cost prices**, and **reviewed supplier receipts** (`supplier_receipts`).

## What is shown

| Metric | Definition |
|--------|------------|
| Revenue | Sum of non-cancelled orders using `total_override` when present, otherwise `orders.total`. Matches the main admin dashboard revenue logic. |
| Estimated COGS / product spend | For each non-cancelled order line: `quantity × products.cost_price` (current cost on the product). |
| Gross profit | Revenue − estimated COGS. |
| Supplier receipt expenses | Sum of `supplier_receipts.total` for rows with `status = reviewed` and a non-null `total`. Draft and archived receipts are excluded. Monthly buckets use **UTC** month from `receipt_date` when set, otherwise `created_at`. |
| Net profit (after supplier receipts) | Gross profit − supplier receipt expenses (all-time or per month on the chart). |
| Monthly order series | Orders bucketed by **UTC calendar month** of `orders.created_at`. |
| Monthly receipt series | Same UTC calendar months; receipt amounts use `receipt_date` (noon UTC) or `created_at`. |

Promotional lines marked `is_free` contribute **zero line revenue** but still count toward COGS via quantity × cost.

## Limitations / future improvements

1. **Historical cost** — Costs use today’s `cost_price`, not what you paid suppliers when the shipment arrived. Changing a product’s cost in admin will reshape past COGS retroactively unless you persist cost-at-sale (e.g. `order_items.cost_at_purchase`).
2. **COGS vs invoices** — Estimated COGS from catalog prices and **reviewed receipt totals** can describe overlapping economic reality (stock purchases vs sell-through). Treat **net profit after receipts** as a management view, not statutory accounts, unless you reconcile one against the other.
3. **Receipt data quality** — Reviewed receipts with **no `total`** are excluded from expense sums until a total is entered on the Receipts admin page.
4. **Operating expenses** — Rent, marketing, salaries, shipping margins, VAT, fees, etc. are not modeled; figures here are still not full P&amp;L.

These align with the phased approach: ship fast analytics now, tighten accounting when you capture purchase and overhead data.
