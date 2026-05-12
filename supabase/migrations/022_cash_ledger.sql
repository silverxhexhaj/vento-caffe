-- Cash ledger: real cash in/out for admin finance (not inferred from order revenue).

CREATE TYPE cash_ledger_direction AS ENUM ('in', 'out');

CREATE TYPE cash_ledger_source AS ENUM (
  'order_payment',
  'supplier_payment',
  'manual_adjustment',
  'opening_balance'
);

CREATE TABLE cash_ledger_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  direction cash_ledger_direction NOT NULL,
  source cash_ledger_source NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  supplier_receipt_id UUID REFERENCES supplier_receipts(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_cash_ledger_occurred_at ON cash_ledger_entries (occurred_at DESC);
CREATE INDEX idx_cash_ledger_order_id ON cash_ledger_entries (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_cash_ledger_receipt_id ON cash_ledger_entries (supplier_receipt_id) WHERE supplier_receipt_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_cash_ledger_entries_updated_at ON cash_ledger_entries;
CREATE TRIGGER update_cash_ledger_entries_updated_at
  BEFORE UPDATE ON cash_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE cash_ledger_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'cash_ledger_entries'
    AND policyname = 'Admins can select cash ledger entries'
  ) THEN
    CREATE POLICY "Admins can select cash ledger entries"
    ON cash_ledger_entries FOR SELECT TO authenticated
    USING (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'cash_ledger_entries'
    AND policyname = 'Admins can insert cash ledger entries'
  ) THEN
    CREATE POLICY "Admins can insert cash ledger entries"
    ON cash_ledger_entries FOR INSERT TO authenticated
    WITH CHECK (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'cash_ledger_entries'
    AND policyname = 'Admins can update cash ledger entries'
  ) THEN
    CREATE POLICY "Admins can update cash ledger entries"
    ON cash_ledger_entries FOR UPDATE TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'cash_ledger_entries'
    AND policyname = 'Admins can delete cash ledger entries'
  ) THEN
    CREATE POLICY "Admins can delete cash ledger entries"
    ON cash_ledger_entries FOR DELETE TO authenticated
    USING (is_admin());
  END IF;
END $$;
