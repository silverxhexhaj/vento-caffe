-- Marketing Studio: persisted AI campaigns, post drafts, and assets

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE marketing_asset_kind AS ENUM ('reference', 'generated');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE marketing_asset_source AS ENUM ('upload', 'gpt_image');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE marketing_platform AS ENUM ('instagram', 'facebook', 'tiktok');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE marketing_post_status AS ENUM ('draft', 'ready', 'scheduled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE marketing_campaign_status AS ENUM ('draft', 'generating', 'ready', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-assets', 'marketing-assets', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  goal TEXT NOT NULL,
  product_focus TEXT NOT NULL,
  tone TEXT[] DEFAULT '{}' NOT NULL,
  platforms marketing_platform[] DEFAULT '{}' NOT NULL,
  outputs TEXT[] DEFAULT '{}' NOT NULL,
  status marketing_campaign_status DEFAULT 'draft' NOT NULL,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS marketing_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  kind marketing_asset_kind NOT NULL,
  source marketing_asset_source NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  content_type TEXT,
  prompt TEXT,
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS marketing_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE NOT NULL,
  linked_asset_id UUID REFERENCES marketing_assets(id) ON DELETE SET NULL,
  platform marketing_platform NOT NULL,
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}' NOT NULL,
  status marketing_post_status DEFAULT 'draft' NOT NULL,
  scheduled_at TIMESTAMPTZ,
  image_prompt TEXT,
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_at
  ON marketing_campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status
  ON marketing_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_marketing_assets_campaign_id
  ON marketing_assets(campaign_id);

CREATE INDEX IF NOT EXISTS idx_marketing_assets_kind
  ON marketing_assets(kind);

CREATE INDEX IF NOT EXISTS idx_marketing_posts_campaign_id
  ON marketing_posts(campaign_id);

CREATE INDEX IF NOT EXISTS idx_marketing_posts_platform
  ON marketing_posts(platform);

CREATE INDEX IF NOT EXISTS idx_marketing_posts_status
  ON marketing_posts(status);

CREATE INDEX IF NOT EXISTS idx_marketing_posts_scheduled_at
  ON marketing_posts(scheduled_at)
  WHERE scheduled_at IS NOT NULL;

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_marketing_campaigns_updated_at ON marketing_campaigns;
CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_assets_updated_at ON marketing_assets;
CREATE TRIGGER update_marketing_assets_updated_at
  BEFORE UPDATE ON marketing_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_posts_updated_at ON marketing_posts;
CREATE TRIGGER update_marketing_posts_updated_at
  BEFORE UPDATE ON marketing_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS
-- ============================================

ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'marketing_campaigns'
      AND policyname = 'Admins can manage marketing campaigns'
  ) THEN
    CREATE POLICY "Admins can manage marketing campaigns"
    ON marketing_campaigns FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'marketing_assets'
      AND policyname = 'Admins can manage marketing assets'
  ) THEN
    CREATE POLICY "Admins can manage marketing assets"
    ON marketing_assets FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'marketing_posts'
      AND policyname = 'Admins can manage marketing posts'
  ) THEN
    CREATE POLICY "Admins can manage marketing posts"
    ON marketing_posts FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

-- ============================================
-- STORAGE POLICIES
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can upload marketing assets'
  ) THEN
    CREATE POLICY "Admins can upload marketing assets"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'marketing-assets' AND
      (SELECT is_admin())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can update marketing assets'
  ) THEN
    CREATE POLICY "Admins can update marketing assets"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'marketing-assets' AND
      (SELECT is_admin())
    )
    WITH CHECK (
      bucket_id = 'marketing-assets' AND
      (SELECT is_admin())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can delete marketing assets'
  ) THEN
    CREATE POLICY "Admins can delete marketing assets"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'marketing-assets' AND
      (SELECT is_admin())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can view marketing assets'
  ) THEN
    CREATE POLICY "Public can view marketing assets"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'marketing-assets');
  END IF;
END $$;
