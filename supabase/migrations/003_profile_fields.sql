-- Add phone and default shipping address to profiles
ALTER TABLE profiles
  ADD COLUMN phone TEXT,
  ADD COLUMN default_shipping_address JSONB DEFAULT NULL;
