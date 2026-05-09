-- Create the articles table used by app/articles/routes.py
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    summary TEXT,
    category TEXT NOT NULL CHECK (category IN ('NEWS', 'ARTICLE')),
    pdf_url TEXT,
    pdf_path TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PUBLISHED', 'REJECTED')),
    admin_notes TEXT,
    submitted_by UUID
        CONSTRAINT articles_submitted_by_fkey
        REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_by UUID
        CONSTRAINT articles_reviewed_by_fkey
        REFERENCES public.users(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_status_expires
    ON public.articles(status, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_submitted_by
    ON public.articles(submitted_by);
CREATE INDEX IF NOT EXISTS idx_articles_status_created
    ON public.articles(status, created_at DESC);

-- Reuse the shared updated_at trigger function defined in schema.sql
DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
-- The backend uses the service_role key and bypasses RLS, but we still enable
-- it so that direct access via anon/authenticated keys is constrained.
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read published articles" ON public.articles;
CREATE POLICY "Members can read published articles"
    ON public.articles FOR SELECT
    USING (
        status = 'PUBLISHED'
        AND (expires_at IS NULL OR expires_at > NOW())
    );

DROP POLICY IF EXISTS "Authors can read their own submissions" ON public.articles;
CREATE POLICY "Authors can read their own submissions"
    ON public.articles FOR SELECT
    USING (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "Admins can read all articles" ON public.articles;
CREATE POLICY "Admins can read all articles"
    ON public.articles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'HEAD'
        )
    );

COMMENT ON TABLE public.articles IS
    'Member-submitted news/articles with admin review and 30-day publication TTL';

-- Force PostgREST to reload its schema cache so the new table is visible.
NOTIFY pgrst, 'reload schema';
