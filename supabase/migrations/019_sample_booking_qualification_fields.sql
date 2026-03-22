-- Add qualification fields to sample_bookings for richer lead capture

ALTER TABLE sample_bookings
  ADD COLUMN business_size TEXT,
  ADD COLUMN estimated_monthly_usage TEXT,
  ADD COLUMN preferred_contact_method TEXT DEFAULT 'phone';
