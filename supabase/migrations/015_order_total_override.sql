-- Order total override: allow admins to set a custom order total (e.g. free express machine)
-- When set, this value is used instead of the sum of order items and persists across item edits.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS total_override INTEGER NULL
  CHECK (total_override IS NULL OR total_override >= 0);
