-- =============================================================================
-- TEST DATA TEARDOWN — Aaruvela Community App
-- =============================================================================
-- Removes ALL rows inserted by scripts/seed_test_data.sql.
-- Safe to run: only deletes rows whose IDs start with the test UUID prefix
-- or whose phone numbers fall in the reserved test range (9000000001–9000000010).
-- =============================================================================

BEGIN;

-- Matrimony profiles (FK → users, so delete first)
DELETE FROM public.matrimony_profiles
WHERE id::text LIKE '00000000-0000-0000-0020-%';

-- Membership requests
DELETE FROM public.membership_requests
WHERE id::text LIKE '00000000-0000-0000-0010-%'
   OR user_id::text LIKE '00000000-0000-0000-000%';

-- Payments (if any were created against test users)
DELETE FROM public.payments
WHERE user_id::text LIKE '00000000-0000-0000-000%';

-- Users (last, because other tables FK into it)
DELETE FROM public.users
WHERE id::text LIKE '00000000-0000-0000-000%';

COMMIT;
