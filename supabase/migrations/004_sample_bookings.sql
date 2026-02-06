-- Sample Bookings for "Try It Free" Campaign
-- Allows potential business clients to book a free coffee machine + cialde sample delivery

-- ============================================
-- ENUM
-- ============================================

CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'delivered',
  'cancelled'
);

-- ============================================
-- TABLE
-- ============================================

CREATE TABLE sample_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  business_type TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  booking_date DATE NOT NULL CHECK (booking_date > CURRENT_DATE),
  status booking_status DEFAULT 'pending' NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_sample_bookings_date ON sample_bookings(booking_date);
CREATE INDEX idx_sample_bookings_status ON sample_bookings(status);
CREATE INDEX idx_sample_bookings_phone ON sample_bookings(phone);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE sample_bookings ENABLE ROW LEVEL SECURITY;

-- Anyone (anonymous or authenticated) can insert a booking (public campaign form)
CREATE POLICY "Anyone can create a sample booking"
  ON sample_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- Only service role can read bookings (admin dashboard)
-- No SELECT policy for anon/authenticated means they cannot read
