-- Vento Caffe Admin Role System
-- Run this migration after 004_sample_bookings.sql

-- ============================================
-- ADD ROLE COLUMN TO PROFILES
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer' NOT NULL
  CHECK (role IN ('customer', 'admin'));

-- ============================================
-- UPDATE AUTO-CREATE PROFILE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Check if current user is admin
-- ============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- ADMIN RLS POLICIES
-- ============================================

-- Profiles: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Orders: Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (is_admin());

-- Orders: Admins can update any order (status changes)
CREATE POLICY "Admins can update any order"
  ON orders FOR UPDATE
  USING (is_admin());

-- Order items: Admins can view all order items
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (is_admin());

-- Sample bookings: Admins can view all sample bookings
CREATE POLICY "Admins can view all sample bookings"
  ON sample_bookings FOR SELECT
  USING (is_admin());

-- Sample bookings: Admins can update sample bookings
CREATE POLICY "Admins can update sample bookings"
  ON sample_bookings FOR UPDATE
  USING (is_admin());

-- ============================================
-- CREATE ADMIN USER
-- ============================================
-- IMPORTANT: Do NOT create users via direct SQL insertion into auth.users.
-- Supabase's GoTrue auth server expects a specific internal format.
--
-- Steps to create the admin user:
--   1. Go to Supabase Dashboard > Authentication > Users
--   2. Click "Add User" > "Create new user"
--   3. Enter email: ventocaffealbania@gmail.com
--      Password: @Ventomoskat2026
--      Check "Auto Confirm User"
--   4. Then run the SQL below to promote to admin:

-- UPDATE profiles SET role = 'admin', full_name = 'Vento Admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'ventocaffealbania@gmail.com');
