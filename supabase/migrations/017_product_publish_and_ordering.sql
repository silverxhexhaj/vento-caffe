-- Add publish/draft state and global display ordering for products

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
    CREATE TYPE product_status AS ENUM ('draft', 'published');
  END IF;
END $$;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS status product_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Keep existing storefront behavior for already-created products.
UPDATE products
SET status = 'published'
WHERE status IS NULL OR status = 'draft';

WITH ranked_products AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS position
  FROM products
)
UPDATE products p
SET display_order = rp.position
FROM ranked_products rp
WHERE p.id = rp.id
  AND p.display_order IS NULL;

ALTER TABLE products
  ALTER COLUMN display_order SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_status_display_order_created_at
  ON products(status, display_order, created_at DESC);
