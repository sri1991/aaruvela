-- =====================================================
-- GALLERY MIGRATION
-- Admin-managed images for the home page carousel,
-- replacing the old build-time src/assets/carousel folder.
--
-- Run this in the Supabase SQL Editor. Safe to re-run.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TABLE IF NOT EXISTS gallery_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url   TEXT NOT NULL,
  image_path  TEXT NOT NULL,
  caption     TEXT,
  sort_order  INT DEFAULT 0,
  active      BOOLEAN DEFAULT TRUE,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_live ON gallery_images(active, sort_order);

DROP TRIGGER IF EXISTS update_gallery_images_updated_at ON gallery_images;
CREATE TRIGGER update_gallery_images_updated_at BEFORE UPDATE ON gallery_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE gallery_images IS 'Admin-managed images shown in the home page gallery carousel';

-- RLS: the backend uses the service-role key and bypasses this. Enabled with
-- no permissive policies so the anon key cannot read or write the table directly.
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
