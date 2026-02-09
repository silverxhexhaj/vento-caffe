-- Businesses CRM tables
-- Run this migration after 005_admin_role.sql

-- ============================================
-- TABLE: businesses
-- ============================================

CREATE TABLE businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  business_type TEXT,
  address TEXT,
  city TEXT,
  website TEXT,
  pipeline_stage TEXT DEFAULT 'lead' NOT NULL,
  source TEXT DEFAULT 'manual' NOT NULL,
  tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  notes TEXT,
  linked_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  linked_booking_id UUID REFERENCES sample_bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- TABLE: business_activities
-- ============================================

CREATE TABLE business_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_businesses_stage ON businesses(pipeline_stage);
CREATE INDEX idx_businesses_type ON businesses(business_type);
CREATE INDEX idx_businesses_source ON businesses(source);
CREATE INDEX idx_businesses_profile ON businesses(linked_profile_id);
CREATE INDEX idx_businesses_booking ON businesses(linked_booking_id);
CREATE INDEX idx_businesses_tags ON businesses USING GIN (tags);
CREATE INDEX idx_business_activities_business ON business_activities(business_id);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_activities ENABLE ROW LEVEL SECURITY;

-- Businesses: Admins can read/write
CREATE POLICY "Admins can view all businesses"
  ON businesses FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert businesses"
  ON businesses FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update businesses"
  ON businesses FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete businesses"
  ON businesses FOR DELETE
  USING (is_admin());

-- Business activities: Admins can read/write
CREATE POLICY "Admins can view all business activities"
  ON business_activities FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert business activities"
  ON business_activities FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update business activities"
  ON business_activities FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete business activities"
  ON business_activities FOR DELETE
  USING (is_admin());
