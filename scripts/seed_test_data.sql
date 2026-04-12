-- =============================================================================
-- TEST DATA SEED — Aaruvela Community App
-- =============================================================================
-- PURPOSE : Populate test users + matrimony profiles for end-to-end workflow
--           testing without touching real member records.
--
-- SAFE TO RUN REPEATEDLY — uses ON CONFLICT DO NOTHING.
-- REMOVAL : Run scripts/seed_test_data_teardown.sql to wipe all test rows.
--
-- ID STRATEGY
--   • User UUIDs    : start with '00000000-test-' prefix (clearly synthetic)
--   • member_id     : prefix TST- (e.g. TST-PID-001) — the ID generator uses
--                     LIKE 'PID-%' / 'NID-%' / 'AID-%', so TST- rows are
--                     completely invisible to the auto-increment logic.
--   • Phone numbers : 9000000001–9000000010 (reserved test range)
--   • Identifier    : same digits-only phone (matches login logic)
-- =============================================================================

-- ─── FIXED UUIDS ─────────────────────────────────────────────────────────────
-- Copy these into your test scripts / Postman env as needed.
--
--   TEST_PERMANENT_M   = 00000000-0000-0000-0001-000000000001  (male,  TST-PID-001, PIN 2244)
--   TEST_NORMAL_F      = 00000000-0000-0000-0002-000000000002  (female,TST-NID-001, PIN 1234)
--   TEST_NORMAL_M      = 00000000-0000-0000-0003-000000000003  (male,  TST-NID-002, PIN 1234)
--   TEST_ASSOCIATED_F  = 00000000-0000-0000-0004-000000000004  (female,TST-AID-001, PIN 1234)
--   TEST_GENERAL       = 00000000-0000-0000-0005-000000000005  (no member_id, PENDING, PIN 1234)
--   TEST_PENDING_APP   = 00000000-0000-0000-0006-000000000006  (applied, awaiting approval)
-- =============================================================================

BEGIN;

-- ─── 1. USERS ────────────────────────────────────────────────────────────────

INSERT INTO public.users (
    id, identifier, phone, pin_hash, full_name, father_guardian_name,
    role, member_id, status,
    age, dob, tob, gotram, sub_sect, occupation, annual_income,
    star_pada, address, cell_no, email,
    membership_expires_at, joined_at, created_at, updated_at
) VALUES

-- PERMANENT male — full bio, PIN 2244, no expiry
(
    '00000000-0000-0000-0001-000000000001',
    '9000000001', '9000000001',
    '$2b$12$sF0JResk78y1GUFgjnSvsuPGIryvzgyRNsC/dLAOk6rrDzdI28xum',  -- 2244
    'Arjun Test Kumar', 'Rajan Kumar',
    'PERMANENT', 'TST-PID-001', 'ACTIVE',
    34, '1991-03-15', '06:30:00', 'Bharadwaja', 'Smartha', 'Software Engineer', 1200000,
    'Rohini - 2', '12, MG Road, Bangalore - 560001', '9000000001', 'arjun.test@example.com',
    NULL,                                     -- PERMANENT never expires
    NOW() - INTERVAL '2 years', NOW(), NOW()
),

-- NORMAL female — active subscription, PIN 1234
(
    '00000000-0000-0000-0002-000000000002',
    '9000000002', '9000000002',
    '$2b$12$yzTEMj2ZxKQP2UfwPnvOWe7Ib3agJpffL2aOSS8rdt7QUC.AvsT7m',  -- 1234
    'Priya Test Sharma', 'Mohan Sharma',
    'NORMAL', 'TST-NID-001', 'ACTIVE',
    27, '1998-07-22', '10:15:00', 'Kashyapa', 'Smartha', 'Doctor', 800000,
    'Krittika - 1', '45, Anna Salai, Chennai - 600002', '9000000002', 'priya.test@example.com',
    NOW() + INTERVAL '10 months',             -- expires in ~10 months
    NOW() - INTERVAL '1 year', NOW(), NOW()
),

-- NORMAL male — membership about to expire (within 7 days) → to test renewal flow
(
    '00000000-0000-0000-0003-000000000003',
    '9000000003', '9000000003',
    '$2b$12$yzTEMj2ZxKQP2UfwPnvOWe7Ib3agJpffL2aOSS8rdt7QUC.AvsT7m',  -- 1234
    'Suresh Test Iyer', 'Venkat Iyer',
    'NORMAL', 'TST-NID-002', 'ACTIVE',
    30, '1995-11-10', '05:45:00', 'Vasishta', 'Smartha', 'Teacher', 600000,
    'Uttarashada - 3', '78, Gandhi Nagar, Hyderabad - 500001', '9000000003', 'suresh.test@example.com',
    NOW() + INTERVAL '4 days',                -- expiring soon → renewal workflow
    NOW() - INTERVAL '360 days', NOW(), NOW()
),

-- ASSOCIATED female — active, PIN 1234
(
    '00000000-0000-0000-0004-000000000004',
    '9000000004', '9000000004',
    '$2b$12$yzTEMj2ZxKQP2UfwPnvOWe7Ib3agJpffL2aOSS8rdt7QUC.AvsT7m',  -- 1234
    'Deepa Test Rao', 'Krishna Rao',
    'ASSOCIATED', 'TST-AID-001', 'ACTIVE',
    25, '2000-01-05', '08:00:00', 'Atri', 'Smartha', 'Student', 0,
    'Hasta - 4', '22, Jayanagar, Bangalore - 560011', '9000000004', 'deepa.test@example.com',
    NOW() + INTERVAL '6 months',
    NOW() - INTERVAL '6 months', NOW(), NOW()
),

-- GENERAL user — no member ID, PENDING — to test membership application flow
(
    '00000000-0000-0000-0005-000000000005',
    '9000000005', '9000000005',
    '$2b$12$yzTEMj2ZxKQP2UfwPnvOWe7Ib3agJpffL2aOSS8rdt7QUC.AvsT7m',  -- 1234
    'Rahul Test Nair', 'Sivan Nair',
    'GENERAL', NULL, 'PENDING',
    22, '2003-06-18', '12:00:00', NULL, NULL, 'Student', 0,
    NULL, 'Trivandrum, Kerala', '9000000005', NULL,
    NULL, NULL, NOW(), NOW()
),

-- GENERAL user — applied NORMAL membership, awaiting admin approval
(
    '00000000-0000-0000-0006-000000000006',
    '9000000006', '9000000006',
    '$2b$12$yzTEMj2ZxKQP2UfwPnvOWe7Ib3agJpffL2aOSS8rdt7QUC.AvsT7m',  -- 1234
    'Kavitha Test Menon', 'Raju Menon',
    'GENERAL', NULL, 'PENDING',
    29, '1996-09-30', '07:20:00', 'Vishwamitra', 'Smartha', 'Nurse', 450000,
    'Swati - 2', '5, Palarivattom, Kochi - 682025', '9000000006', 'kavitha.test@example.com',
    NULL, NULL, NOW(), NOW()
)

ON CONFLICT (id) DO NOTHING;


-- ─── 2. MEMBERSHIP REQUESTS ──────────────────────────────────────────────────

INSERT INTO public.membership_requests (
    id, user_id, requested_role, application_data,
    payment_status, approval_status, admin_notes,
    request_type, created_at, updated_at
) VALUES

-- Approved record for NORMAL female (TST-NID-001)
(
    '00000000-0000-0000-0010-000000000001',
    '00000000-0000-0000-0002-000000000002',
    'NORMAL',
    '{"full_name":"Priya Test Sharma","occupation":"Doctor","annual_income":800000}'::jsonb,
    'PAID', 'APPROVED', 'Test data — approved on seed',
    'APPLICATION', NOW() - INTERVAL '1 year', NOW()
),

-- Approved record for NORMAL male (TST-NID-002)
(
    '00000000-0000-0000-0010-000000000002',
    '00000000-0000-0000-0003-000000000003',
    'NORMAL',
    '{"full_name":"Suresh Test Iyer","occupation":"Teacher"}'::jsonb,
    'PAID', 'APPROVED', 'Test data — approved on seed',
    'APPLICATION', NOW() - INTERVAL '360 days', NOW()
),

-- Pending renewal for NORMAL male (expiring soon)
(
    '00000000-0000-0000-0010-000000000003',
    '00000000-0000-0000-0003-000000000003',
    'NORMAL',
    NULL,
    'PAID', 'PENDING', NULL,
    'RENEWAL', NOW() - INTERVAL '1 day', NOW()
),

-- Pending application for GENERAL user (Kavitha)
(
    '00000000-0000-0000-0010-000000000004',
    '00000000-0000-0000-0006-000000000006',
    'NORMAL',
    '{"full_name":"Kavitha Test Menon","occupation":"Nurse","annual_income":450000,"gotram":"Vishwamitra"}'::jsonb,
    'EXEMPT', 'PENDING', NULL,
    'APPLICATION', NOW() - INTERVAL '2 days', NOW()
)

ON CONFLICT (id) DO NOTHING;


-- ─── 3. MATRIMONY PROFILES ───────────────────────────────────────────────────
-- Covers all four payment/status combinations for full workflow testing.

INSERT INTO public.matrimony_profiles (
    id, user_id, parishat_id, full_name, gender,
    father_guardian_name, age, dob, tob,
    gotram, star_with_pada, place_of_birth, current_city,
    occupation, annual_income,
    brothers, sisters, willing_to_relocate,
    particulars, requirement,
    contact_no, email,
    photo_url, photos,
    payment_reference, payment_status, status,
    subscription_expires_at, created_at, updated_at
) VALUES

-- ① VERIFIED + ACTIVE subscription (male) — can browse matches
(
    '00000000-0000-0000-0020-000000000001',
    '00000000-0000-0000-0001-000000000001',  -- Arjun (TST-PID-001)
    'TST-PID-001',
    'Arjun Test Kumar', 'MALE',
    'Rajan Kumar', 34, '1991-03-15', '06:30:00',
    'Bharadwaja', 'Rohini - 2', 'Bangalore', 'Bangalore',
    'Software Engineer', '12,00,000',
    1, 1, true,
    'Software engineer with 10 years of experience. Enjoys classical music and trekking. Looking for a life partner who shares similar values.',
    'Prefer a well-educated girl from a good family background. Working or homemaker both acceptable.',
    '9000000001', 'arjun.test@example.com',
    'https://placehold.co/400x400?text=Arjun',
    ARRAY['https://placehold.co/400x400?text=Arjun', 'https://placehold.co/400x400?text=Arjun2'],
    'TST-PAY-ARJUN-001', 'VERIFIED', 'ACTIVE',
    NOW() + INTERVAL '25 days',               -- active, 25 days left
    NOW() - INTERVAL '5 days', NOW()
),

-- ② VERIFIED + EXPIRED subscription (female) — matches blocked, can renew
(
    '00000000-0000-0000-0020-000000000002',
    '00000000-0000-0000-0002-000000000002',  -- Priya (TST-NID-001)
    'TST-NID-001',
    'Priya Test Sharma', 'FEMALE',
    'Mohan Sharma', 27, '1998-07-22', '10:15:00',
    'Kashyapa', 'Krittika - 1', 'Chennai', 'Chennai',
    'Doctor', '8,00,000',
    0, 2, false,
    'MBBS graduate working at a government hospital. Interested in cooking and classical dance.',
    'Looking for a software professional or doctor. Must be from a good family.',
    '9000000002', 'priya.test@example.com',
    'https://placehold.co/400x400?text=Priya',
    ARRAY['https://placehold.co/400x400?text=Priya'],
    'TST-PAY-PRIYA-001', 'VERIFIED', 'ACTIVE',
    NOW() - INTERVAL '2 days',                -- EXPIRED 2 days ago → tests renewal flow
    NOW() - INTERVAL '35 days', NOW()
),

-- ③ PENDING payment (male) — newly registered, awaiting admin verification
(
    '00000000-0000-0000-0020-000000000003',
    '00000000-0000-0000-0003-000000000003',  -- Suresh (TST-NID-002)
    'TST-NID-002',
    'Suresh Test Iyer', 'MALE',
    'Venkat Iyer', 30, '1995-11-10', '05:45:00',
    'Vasishta', 'Uttarashada - 3', 'Hyderabad', 'Hyderabad',
    'Teacher', '6,00,000',
    2, 0, true,
    'School teacher passionate about education and social work. Vegetarian. Enjoys reading and travel.',
    'Looking for a simple, homely girl from a Smartha Brahmin family.',
    '9000000003', 'suresh.test@example.com',
    'https://placehold.co/400x400?text=Suresh',
    ARRAY['https://placehold.co/400x400?text=Suresh'],
    'TST-PAY-SURESH-001', 'PENDING', 'ACTIVE',
    NULL,                                      -- not set until admin approves
    NOW() - INTERVAL '1 day', NOW()
),

-- ④ REJECTED payment (female) — payment was rejected, profile inactive
(
    '00000000-0000-0000-0020-000000000004',
    '00000000-0000-0000-0004-000000000004',  -- Deepa (TST-AID-001)
    'TST-AID-001',
    'Deepa Test Rao', 'FEMALE',
    'Krishna Rao', 25, '2000-01-05', '08:00:00',
    'Atri', 'Hasta - 4', 'Bangalore', 'Bangalore',
    'Student', 'N/A',
    1, 1, false,
    'Final year engineering student. Interests include music and painting.',
    'Looking for a well-settled groom, preferably an engineer or doctor.',
    '9000000004', 'deepa.test@example.com',
    'https://placehold.co/400x400?text=Deepa',
    ARRAY['https://placehold.co/400x400?text=Deepa'],
    'TST-PAY-DEEPA-INVALID', 'REJECTED', 'ACTIVE',
    NULL,
    NOW() - INTERVAL '3 days', NOW()
)

ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =============================================================================
-- QUICK REFERENCE (login credentials for testing)
-- =============================================================================
-- Phone / Identifier  | Name             | Role        | member_id   | PIN  | Matrimony status
-- 9000000001          | Arjun Test Kumar | PERMANENT   | TST-PID-001 | 2244 | VERIFIED + active sub
-- 9000000002          | Priya Test Sharma| NORMAL      | TST-NID-001 | 1234 | VERIFIED + EXPIRED sub
-- 9000000003          | Suresh Test Iyer | NORMAL      | TST-NID-002 | 1234 | PENDING payment
-- 9000000004          | Deepa Test Rao   | ASSOCIATED  | TST-AID-001 | 1234 | REJECTED payment
-- 9000000005          | Rahul Test Nair  | GENERAL     | —           | 1234 | No profile
-- 9000000006          | Kavitha Test Menon| GENERAL    | —           | 1234 | No profile, pending membership
-- =============================================================================
