-- Stock Movements Table
-- Tracks all inventory changes with full audit trail

CREATE TYPE stock_movement_type AS ENUM (
  'purchase',      -- Stock incoming from supplier
  'sale',          -- Stock sold to customer
  'adjustment',    -- Manual correction (damage, loss, found)
  'return'         -- Customer/supplier return
);

CREATE TABLE stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type stock_movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Stock Movements

CREATE POLICY "Admins can view stock movements"
  ON stock_movements FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert stock movements"
  ON stock_movements FOR INSERT TO authenticated
  WITH CHECK (is_admin());
