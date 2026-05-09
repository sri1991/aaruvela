-- Create the donations table for public donation submissions
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    place TEXT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    payment_reference TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    admin_notes TEXT,
    verified_by UUID
        CONSTRAINT donations_verified_by_fkey
        REFERENCES public.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    transaction_id UUID
        CONSTRAINT donations_transaction_id_fkey
        REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_status_created
    ON public.donations(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_payment_reference
    ON public.donations(payment_reference);
CREATE INDEX IF NOT EXISTS idx_donations_phone
    ON public.donations(phone);

-- Reuse the shared updated_at trigger function defined in schema.sql
DROP TRIGGER IF EXISTS update_donations_updated_at ON public.donations;
CREATE TRIGGER update_donations_updated_at
    BEFORE UPDATE ON public.donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
-- All writes go through the backend (service_role bypasses RLS).
-- We deliberately do NOT grant INSERT/UPDATE/DELETE to anon/authenticated
-- so anonymous donors cannot bypass the backend's validation and
-- duplicate-UTR checks.
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all donations" ON public.donations;
CREATE POLICY "Admins can read all donations"
    ON public.donations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'HEAD'
        )
    );

COMMENT ON TABLE public.donations IS
    'Public donations awaiting admin verification of the UPI payment reference (UTR)';

-- Force PostgREST to reload its schema cache so the new table is visible.
NOTIFY pgrst, 'reload schema';
