-- Auto-create businesses from signups + admin notifications
-- Run this migration after 015_order_total_override.sql

-- ============================================
-- TABLE: admin_notifications
-- ============================================

CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::JSONB NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read
  ON admin_notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at
  ON admin_notifications(created_at DESC);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin notifications" ON admin_notifications;
CREATE POLICY "Admins can view admin notifications"
  ON admin_notifications FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update admin notifications" ON admin_notifications;
CREATE POLICY "Admins can update admin notifications"
  ON admin_notifications FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- BUSINESS LINK SAFETY (ONE PROFILE -> ONE BUSINESS)
-- ============================================

WITH duplicate_businesses AS (
  SELECT
    id,
    linked_profile_id,
    ROW_NUMBER() OVER (
      PARTITION BY linked_profile_id
      ORDER BY created_at ASC, id ASC
    ) AS row_num
  FROM businesses
  WHERE linked_profile_id IS NOT NULL
)
DELETE FROM businesses b
USING duplicate_businesses d
WHERE b.id = d.id
  AND d.row_num > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_unique_linked_profile
  ON businesses(linked_profile_id)
  WHERE linked_profile_id IS NOT NULL;

-- ============================================
-- UPDATE SIGNUP TRIGGER TO AUTO-CREATE BUSINESS
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_name TEXT;
BEGIN
  profile_name := NULLIF(NEW.raw_user_meta_data->>'full_name', '');

  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    profile_name,
    NEW.raw_user_meta_data->>'avatar_url',
    'customer'
  );

  INSERT INTO public.businesses (
    name,
    contact_name,
    pipeline_stage,
    source,
    linked_profile_id,
    tags
  )
  VALUES (
    COALESCE(profile_name, 'New signup'),
    profile_name,
    'lead',
    'signup',
    NEW.id,
    '{}'::TEXT[]
  )
  ON CONFLICT (linked_profile_id) WHERE linked_profile_id IS NOT NULL
  DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTIFICATIONS: NEW BUSINESS SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION notify_admin_on_business_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source = 'signup' THEN
    INSERT INTO public.admin_notifications (type, title, body, payload)
    VALUES (
      'new_business_signup',
      'New business signup',
      format('%s signed up and was added to Businesses.', COALESCE(NEW.name, 'A new business')),
      jsonb_build_object(
        'business_id', NEW.id,
        'linked_profile_id', NEW.linked_profile_id,
        'source', NEW.source
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_business_created_notify_admin ON businesses;

CREATE TRIGGER on_business_created_notify_admin
AFTER INSERT ON businesses
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_business_signup();

-- ============================================
-- NOTIFICATIONS: NEW ORDER
-- ============================================

CREATE OR REPLACE FUNCTION notify_admin_on_new_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, body, payload)
  VALUES (
    'new_order',
    'New order received',
    format('Order %s was created with total %s.', NEW.id, COALESCE(NEW.total, 0)),
    jsonb_build_object(
      'order_id', NEW.id,
      'user_id', NEW.user_id,
      'business_id', NEW.business_id,
      'total', NEW.total,
      'status', NEW.status
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_created_notify_admin ON orders;

CREATE TRIGGER on_order_created_notify_admin
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_new_order();
