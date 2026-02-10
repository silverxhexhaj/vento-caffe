-- Convert price columns from DECIMAL to INTEGER (Leke format)
-- Run this migration after 008_agents.sql
--
-- This migration converts all price-related columns from DECIMAL(10,2) to INTEGER
-- to store prices in Leke without decimal points (e.g., 5500 instead of 55.00)

-- ============================================
-- ALTER COLUMN TYPES
-- ============================================

-- Update products table: price column
ALTER TABLE products 
  ALTER COLUMN price TYPE INTEGER USING (price * 100)::INTEGER;

-- Update CHECK constraint to work with INTEGER
ALTER TABLE products 
  DROP CONSTRAINT IF EXISTS products_price_check,
  ADD CONSTRAINT products_price_check CHECK (price >= 0);

-- Update order_items table: price_at_purchase column
ALTER TABLE order_items
  ALTER COLUMN price_at_purchase TYPE INTEGER USING (price_at_purchase * 100)::INTEGER;

-- Update CHECK constraint to work with INTEGER
ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_price_at_purchase_check,
  ADD CONSTRAINT order_items_price_at_purchase_check CHECK (price_at_purchase >= 0);

-- Update orders table: total column
ALTER TABLE orders
  ALTER COLUMN total TYPE INTEGER USING (total * 100)::INTEGER;

-- Update CHECK constraint to work with INTEGER
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_total_check,
  ADD CONSTRAINT orders_total_check CHECK (total >= 0);

-- ============================================
-- UPDATE SEED DATA TO CORRECT LEKE PRICES
-- ============================================

-- Update product prices to actual Leke values
UPDATE products SET price = 6000 WHERE slug = 'classic-cialde';
UPDATE products SET price = 6500 WHERE slug = 'decaffeinato-cialde';
UPDATE products SET price = 15500 WHERE slug = 'espresso-machine';
