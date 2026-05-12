-- Supplier receipt archive (images + AI extraction + admin review)
-- Private storage bucket; admins only. Does not modify inventory in phase 1.

-- ============================================
-- ENUM
-- ============================================

CREATE TYPE supplier_receipt_status AS ENUM ('draft', 'reviewed', 'archived');

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE supplier_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status supplier_receipt_status NOT NULL DEFAULT 'draft',
  supplier_name TEXT,
  receipt_number TEXT,
  receipt_date DATE,
  currency TEXT NOT NULL DEFAULT 'ALL',
  subtotal INTEGER CHECK (subtotal IS NULL OR subtotal >= 0),
  tax INTEGER CHECK (tax IS NULL OR tax >= 0),
  total INTEGER CHECK (total IS NULL OR total >= 0),
  extraction_confidence NUMERIC(4, 3) CHECK (extraction_confidence IS NULL OR (extraction_confidence >= 0 AND extraction_confidence <= 1)),
  image_storage_path TEXT NOT NULL,
  image_content_type TEXT NOT NULL,
  image_size INTEGER NOT NULL CHECK (image_size > 0),
  extracted_json JSONB,
  extraction_error TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_supplier_receipts_created_at ON supplier_receipts (created_at DESC);
CREATE INDEX idx_supplier_receipts_status ON supplier_receipts (status);

CREATE TABLE supplier_receipt_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id UUID NOT NULL REFERENCES supplier_receipts(id) ON DELETE CASCADE,
  line_order INTEGER NOT NULL DEFAULT 0,
  description_raw TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit_amount INTEGER CHECK (unit_amount IS NULL OR unit_amount >= 0),
  line_total INTEGER CHECK (line_total IS NULL OR line_total >= 0),
  suggested_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  suggested_match_confidence NUMERIC(4, 3) CHECK (suggested_match_confidence IS NULL OR (suggested_match_confidence >= 0 AND suggested_match_confidence <= 1)),
  confirmed_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_supplier_receipt_lines_receipt ON supplier_receipt_lines (receipt_id);

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_supplier_receipts_updated_at ON supplier_receipts;
CREATE TRIGGER update_supplier_receipts_updated_at
  BEFORE UPDATE ON supplier_receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS
-- ============================================

ALTER TABLE supplier_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_receipt_lines ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'supplier_receipts'
    AND policyname = 'Admins can select supplier receipts'
  ) THEN
    CREATE POLICY "Admins can select supplier receipts"
    ON supplier_receipts FOR SELECT TO authenticated
    USING (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'supplier_receipts'
    AND policyname = 'Admins can insert supplier receipts'
  ) THEN
    CREATE POLICY "Admins can insert supplier receipts"
    ON supplier_receipts FOR INSERT TO authenticated
    WITH CHECK (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'supplier_receipts'
    AND policyname = 'Admins can update supplier receipts'
  ) THEN
    CREATE POLICY "Admins can update supplier receipts"
    ON supplier_receipts FOR UPDATE TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'supplier_receipts'
    AND policyname = 'Admins can delete supplier receipts'
  ) THEN
    CREATE POLICY "Admins can delete supplier receipts"
    ON supplier_receipts FOR DELETE TO authenticated
    USING (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'supplier_receipt_lines'
    AND policyname = 'Admins can select supplier receipt lines'
  ) THEN
    CREATE POLICY "Admins can select supplier receipt lines"
    ON supplier_receipt_lines FOR SELECT TO authenticated
    USING (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'supplier_receipt_lines'
    AND policyname = 'Admins can insert supplier receipt lines'
  ) THEN
    CREATE POLICY "Admins can insert supplier receipt lines"
    ON supplier_receipt_lines FOR INSERT TO authenticated
    WITH CHECK (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'supplier_receipt_lines'
    AND policyname = 'Admins can update supplier receipt lines'
  ) THEN
    CREATE POLICY "Admins can update supplier receipt lines"
    ON supplier_receipt_lines FOR UPDATE TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'supplier_receipt_lines'
    AND policyname = 'Admins can delete supplier receipt lines'
  ) THEN
    CREATE POLICY "Admins can delete supplier receipt lines"
    ON supplier_receipt_lines FOR DELETE TO authenticated
    USING (is_admin());
  END IF;
END $$;

-- ============================================
-- STORAGE: private bucket for receipt images
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-receipts', 'supplier-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Admins read receipt files (needed for signing / download)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Admins can read supplier receipts'
  ) THEN
    CREATE POLICY "Admins can read supplier receipts"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'supplier-receipts' AND (SELECT is_admin()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Admins can upload supplier receipts'
  ) THEN
    CREATE POLICY "Admins can upload supplier receipts"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'supplier-receipts' AND (SELECT is_admin()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Admins can update supplier receipts'
  ) THEN
    CREATE POLICY "Admins can update supplier receipts"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'supplier-receipts' AND (SELECT is_admin()))
    WITH CHECK (bucket_id = 'supplier-receipts' AND (SELECT is_admin()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Admins can delete supplier receipts'
  ) THEN
    CREATE POLICY "Admins can delete supplier receipts"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'supplier-receipts' AND (SELECT is_admin()));
  END IF;
END $$;
