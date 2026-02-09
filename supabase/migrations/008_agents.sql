-- Agents and business assignments
-- Run this migration after 007_businesses.sql
--
-- ============================================
-- TABLE: agents
-- ============================================
CREATE TABLE agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role_title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- TABLE: business_agents (many-to-many)
-- ============================================
CREATE TABLE business_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (business_id, agent_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_agents_full_name ON agents(full_name);
CREATE INDEX idx_agents_email ON agents(email);
CREATE INDEX idx_business_agents_business ON business_agents(business_id);
CREATE INDEX idx_business_agents_agent ON business_agents(agent_id);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_agents ENABLE ROW LEVEL SECURITY;

-- Agents: Admins can read/write
CREATE POLICY "Admins can view all agents"
  ON agents FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert agents"
  ON agents FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update agents"
  ON agents FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete agents"
  ON agents FOR DELETE
  USING (is_admin());

-- Business agents: Admins can read/write
CREATE POLICY "Admins can view all business agents"
  ON business_agents FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert business agents"
  ON business_agents FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update business agents"
  ON business_agents FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete business agents"
  ON business_agents FOR DELETE
  USING (is_admin());
