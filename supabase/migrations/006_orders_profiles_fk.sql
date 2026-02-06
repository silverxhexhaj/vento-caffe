-- Add direct foreign key from orders.user_id to profiles.id
-- This enables Supabase PostgREST to resolve the embedded join
-- `profiles (full_name, phone)` used in admin order queries.

ALTER TABLE orders
  ADD CONSTRAINT orders_user_id_profiles_fk
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;
