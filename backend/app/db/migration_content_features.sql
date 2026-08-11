-- =====================================================
-- CONTENT FEATURES MIGRATION
-- Chairman notice (site_settings), member videos,
-- public announcements, advertising slots.
--
-- Run this in the Supabase SQL Editor. Safe to re-run.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shared trigger function (already exists in schema.sql; redefined for standalone runs)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 1. SITE SETTINGS  (key/value store for editable site content)
--    Current keys: 'chairman_notice'
-- =====================================================

CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE site_settings IS 'Admin-editable site content keyed by slug (e.g. chairman_notice)';


-- =====================================================
-- 2. VIDEOS  (member submits -> admin approves -> live for 7 days)
-- =====================================================

CREATE TABLE IF NOT EXISTS videos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          TEXT NOT NULL,
  description    TEXT,
  video_url      TEXT NOT NULL,
  video_path     TEXT NOT NULL,
  thumbnail_url  TEXT,
  thumbnail_path TEXT,
  mime_type      TEXT,
  size_bytes     BIGINT,
  duration_secs  INT,
  status         TEXT CHECK (status IN ('PENDING', 'PUBLISHED', 'REJECTED')) DEFAULT 'PENDING',
  submitted_by   UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewed_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_notes    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  published_at   TIMESTAMPTZ,
  expires_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_videos_status_expiry ON videos(status, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_submitter ON videos(submitted_by, created_at DESC);

COMMENT ON TABLE videos IS 'Member-submitted videos; published videos auto-expire 7 days after approval';


-- =====================================================
-- 3. ANNOUNCEMENTS  (admin authored, publicly readable)
-- =====================================================

CREATE TABLE IF NOT EXISTS announcements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  category    TEXT CHECK (category IN ('GENERAL', 'EVENT', 'URGENT', 'MEETING')) DEFAULT 'GENERAL',
  image_url   TEXT,
  image_path  TEXT,
  link_url    TEXT,
  pinned      BOOLEAN DEFAULT FALSE,
  status      TEXT CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')) DEFAULT 'DRAFT',
  publish_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_live ON announcements(status, pinned DESC, publish_at DESC);

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE announcements IS 'Public announcements authored by admins';


-- =====================================================
-- 4. ADS  (admin-managed advertising slots)
-- =====================================================

CREATE TABLE IF NOT EXISTS ads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  subtitle        TEXT,
  image_url       TEXT,
  image_path      TEXT,
  target_url      TEXT,
  placement       TEXT CHECK (placement IN ('HOME_BANNER', 'NEWS_LIST', 'MATRIMONY', 'FOOTER')) DEFAULT 'HOME_BANNER',
  advertiser_name TEXT,
  contact_info    TEXT,
  payment_ref     TEXT,
  sort_order      INT DEFAULT 0,
  active          BOOLEAN DEFAULT TRUE,
  starts_at       TIMESTAMPTZ DEFAULT NOW(),
  ends_at         TIMESTAMPTZ,
  impressions     INT DEFAULT 0,
  clicks          INT DEFAULT 0,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_live ON ads(placement, active, starts_at, ends_at);

DROP TRIGGER IF EXISTS update_ads_updated_at ON ads;
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE ads IS 'Admin-managed advertising slots with run dates and click counters';


-- Atomic counter bump for ad impressions/clicks (avoids read-modify-write races)
CREATE OR REPLACE FUNCTION increment_ad_counter(ad_id UUID, counter TEXT)
RETURNS VOID AS $$
BEGIN
  IF counter = 'clicks' THEN
    UPDATE ads SET clicks = clicks + 1 WHERE id = ad_id;
  ELSIF counter = 'impressions' THEN
    UPDATE ads SET impressions = impressions + 1 WHERE id = ad_id;
  END IF;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 5. ROW LEVEL SECURITY
--    The backend uses the service-role key and bypasses RLS entirely.
--    RLS is enabled with no permissive policies so that the anon key
--    (used by the browser for storage uploads) cannot read or write
--    these tables directly.
-- =====================================================

ALTER TABLE site_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads            ENABLE ROW LEVEL SECURITY;
