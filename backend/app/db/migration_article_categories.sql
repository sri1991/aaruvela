-- =====================================================
-- ARTICLE CATEGORY RENAME
--
-- "News" now means Announcements (public, text, admin-authored) and nothing
-- else on the site. Articles are documents, so their categories become
-- ARTICLE / CIRCULAR / MAGAZINE.
--
-- Run in the Supabase SQL Editor. Safe to re-run.
-- =====================================================

-- Drop whatever CHECK constraint currently guards articles.category. Doing it
-- by lookup rather than by name because the constraint may have been created
-- inline (articles_category_check) or named by hand.
DO $$
DECLARE con_name text;
BEGIN
    FOR con_name IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
          AND t.relname = 'articles'
          AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) ILIKE '%category%'
    LOOP
        EXECUTE format('ALTER TABLE public.articles DROP CONSTRAINT %I', con_name);
    END LOOP;
END $$;

-- Any existing NEWS rows become ARTICLE. (At the time of writing there were
-- none — all three rows were already ARTICLE — but this keeps the migration
-- correct if news items are published before it runs.)
UPDATE public.articles SET category = 'ARTICLE' WHERE category = 'NEWS';

ALTER TABLE public.articles
    ADD CONSTRAINT articles_category_check
    CHECK (category IN ('ARTICLE', 'CIRCULAR', 'MAGAZINE'));

-- Rollback, if ever needed:
--   ALTER TABLE public.articles DROP CONSTRAINT articles_category_check;
--   ALTER TABLE public.articles ADD CONSTRAINT articles_category_check
--       CHECK (category IN ('NEWS', 'ARTICLE'));
