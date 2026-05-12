# Admin finance dashboard

Metrics on **Finance** (`/admin/finance`) are derived from Supabase orders and catalog data only.

## What is shown

| Metric | Definition |
|--------|------------|
| Revenue | Sum of non-cancelled orders using `total_override` when present, otherwise `orders.total`. Matches the main admin dashboard revenue logic. |
| Estimated COGS / product spend | For each non-cancelled order line: `quantity × products.cost_price` (current cost on the product). |
| Gross profit | Revenue − estimated COGS. |
| Monthly series | Orders bucketed by **UTC calendar month** of `orders.created_at`. |

Promotional lines marked `is_free` contribute **zero line revenue** but still count toward COGS via quantity × cost.

## Limitations / future improvements

1. **Historical cost** — Costs use today’s `cost_price`, not what you paid suppliers when the shipment arrived. Changing a product’s cost in admin will reshape past COGS retroactively unless you persist cost-at-sale (e.g. `order_items.cost_at_purchase`).
2. **Purchase invoices** — `stock_movements` records quantity movements only; monetary supplier spend requires new fields (e.g. `unit_cost`, `total_cost`) or a purchases ledger plus UI in inventory workflow.
3. **Operating expenses** — Rent, marketing, salaries, shipping margins, VAT, fees, etc. are not modeled; gross profit ≠ net profit unless you integrate or enter those separately.

These align with the phased approach: ship fast analytics now, tighten accounting when you capture purchase and overhead data.
