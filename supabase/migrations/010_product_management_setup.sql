-- Product Management Setup Migration
-- Creates storage bucket for product images and RLS policies for admin product management

-- ============================================
-- STORAGE BUCKET FOR PRODUCT IMAGES
-- ============================================

-- Create storage bucket for product images (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Allow admins to upload product images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can upload product images'
  ) THEN
    CREATE POLICY "Admins can upload product images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'product-images' AND
      (SELECT is_admin())
    );
  END IF;
END $$;

-- Allow admins to update product images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can update product images'
  ) THEN
    CREATE POLICY "Admins can update product images"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'product-images' AND
      (SELECT is_admin())
    )
    WITH CHECK (
      bucket_id = 'product-images' AND
      (SELECT is_admin())
    );
  END IF;
END $$;

-- Allow admins to delete product images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can delete product images'
  ) THEN
    CREATE POLICY "Admins can delete product images"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'product-images' AND
      (SELECT is_admin())
    );
  END IF;
END $$;

-- Allow public read access to product images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view product images'
  ) THEN
    CREATE POLICY "Public can view product images"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'product-images');
  END IF;
END $$;

-- ============================================
-- PRODUCTS TABLE RLS POLICIES
-- ============================================

-- Admins can insert products
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'products' 
    AND policyname = 'Admins can insert products'
  ) THEN
    CREATE POLICY "Admins can insert products"
    ON products FOR INSERT TO authenticated
    WITH CHECK (is_admin());
  END IF;
END $$;

-- Admins can update products
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'products' 
    AND policyname = 'Admins can update products'
  ) THEN
    CREATE POLICY "Admins can update products"
    ON products FOR UPDATE TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

-- Admins can delete products
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'products' 
    AND policyname = 'Admins can delete products'
  ) THEN
    CREATE POLICY "Admins can delete products"
    ON products FOR DELETE TO authenticated
    USING (is_admin());
  END IF;
END $$;
