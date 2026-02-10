-- Add inventory management fields to products table

ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price INTEGER DEFAULT 0 NOT NULL CHECK (cost_price >= 0);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0 NOT NULL CHECK (stock_quantity >= 0);
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5 NOT NULL CHECK (low_stock_threshold >= 0);
