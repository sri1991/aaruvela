# Tech Debt

Running log of known shortcuts, follow-ups and deferred work from the
workflow gap analysis. Each item carries a status, a pointer to the
relevant files, and (where applicable) a "done when" checklist.

**Status legend**

- `open` — not started
- `in progress` — partially addressed
- `fixed (<branch/commit>)` — landed on the named branch, awaiting merge
- `done` — merged to `main`

---

## Schema / migrations

### `articles` table never created

**Status**: fixed (`claude/identify-workflow-gaps-2Ssqs`, `dab484d`)
**Files**: `backend/app/articles/routes.py`,
`backend/app/db/migration_create_articles_table.sql`,
`backend/app/db/schema.sql`

The articles router queried a table that no migration created — every
endpoint 500'd on a fresh deployment. Added a dedicated migration plus
the canonical definition in `schema.sql` (status workflow,
submitter/reviewer FKs, publish/expiry timestamps, RLS).

### `donations` table never created

**Status**: fixed (`claude/fix-donations-table`, `c0303fc`)
**Files**: `backend/app/db/migration_create_donations_table.sql`,
`backend/app/donations/routes.py`, `src/pages/Donations.jsx`

Donations page was inserting to a non-existent `donations` table from
the browser. Added the table, a backend `/donations` router with
admin verify/reject, and rewired the frontend through it.

### `transactions` table not in `schema.sql`

**Status**: open
**Files**: `backend/app/admin/routes.py:23`,
`backend/app/accounts/routes.py`, `backend/app/donations/routes.py`

The ledger table is queried throughout the backend but is absent from
`schema.sql`; it must have been added directly in Supabase. Add a
migration so fresh installs include it.

### Schema drift: `schema.sql` vs. live database

**Status**: open

`schema.sql` is missing `articles`, `donations`, `transactions`,
`matrimony_profiles` and several `users` columns (`zonal_committee`,
`regional_committee`, `membership_expires_at`, etc.). Adopt a numbered
migration directory (e.g. `db/migrations/0001_…sql`) and rebuild
`schema.sql` from the migrations or drop it in favour of the migration
chain.

---

## Payments

### Razorpay integration for donation verification

**Status**: open
**Introduced**: `claude/fix-donations-table` (`c0303fc`)
**Files**: `backend/app/donations/routes.py`, `src/pages/Donations.jsx`

Donations are UPI-with-manual-reconciliation: donor pastes a UTR, row
enters `PENDING`, admin verifies against the bank statement before an
`INCOME / DONATION` ledger row is created.

**Done when:**
- Razorpay order is created on `POST /donations` and returned to the
  client to launch checkout.
- A signed webhook endpoint validates `payment.captured` events, marks
  the matching donation `VERIFIED`, and inserts the ledger transaction
  in a single transaction.
- Manual `verify`/`reject` endpoints remain for out-of-band donations.

### Razorpay integration for membership fees

**Status**: open
**Files**: `backend/app/admin/routes.py`, `backend/app/config.py`

`payments` table has `gateway='razorpay'` and `reference_id` fields and
the env carries `RAZORPAY_KEY_ID/SECRET`, but there is zero integration
code. Membership requests are approved manually regardless of payment.

**Done when:** Razorpay order is created on application submit;
`payment.captured` webhook flips `membership_requests.payment_status`
to `PAID`; admin approval is gated on `PAID`.

### Membership renewal not gated on payment

**Status**: open
**Files**: `backend/app/admin/routes.py:298+`

`/admin/renew-membership` extends `membership_expires_at` without
checking `payment_status='PAID'` on the renewal request.

### Renewal expiry math drops time on late renewals

**Status**: open
**Files**: `backend/app/admin/routes.py:298+`

Sets `membership_expires_at = today + 1y` instead of
`max(now, current_expiry) + 1y`. A renewal approved a month after
expiry costs the member a month.

---

## Auth / access control

### `require_admin` doesn't check status

**Status**: open
**Files**: `backend/app/auth/dependencies.py:77-79`

Only `role == 'HEAD'` is checked. A `BLOCKED` HEAD can still admin.
Should also require `status == 'ACTIVE'`.

### PIN entropy unenforced

**Status**: open
**Files**: `backend/app/auth/utils.py`,
`scripts/bulk_reset_pins_normal.py`, `scripts/bulk_reset_pins_permanent.py`

`0000`, `1111`, `1234` are all accepted; bulk reset scripts hard-code
defaults like `1234`/`2244`. Add a deny-list of trivial sequences.

### Lockout bypass on `/auth/set-pin`

**Status**: open
**Files**: `backend/app/auth/routes.py`

A locked account with a still-valid token can rotate its PIN. Reject
PIN changes when `locked_until` is in the future.

### No self-service password / PIN reset

**Status**: open

Reset is only via `/admin/reset-pin`. No OTP/SMS recovery flow for
locked-out users without admin access.

### No JWT refresh

**Status**: open
**Files**: `backend/app/auth/routes.py`

Tokens expire on a fixed window; clients must re-login. Add refresh
tokens or rolling expiry.

### Synthetic email asymmetry

**Status**: open
**Files**: `backend/app/auth/routes.py:151`

Registration creates a `{phone}@community.app` Supabase Auth user but
stores phone-only `identifier` in `users`. Two sources of truth that
can drift.

---

## Membership workflow

### Member ID generation race condition

**Status**: open
**Files**: `backend/app/admin/routes.py:54-73`

Uses `MAX(member_id) + 1` instead of a Postgres sequence. Two
concurrent admin approvals can collide on the unique `member_id`.

**Done when:** replace with one sequence per role
(`member_id_pid_seq`, etc.) or a single sequence + role prefix derived
on insert.

### No role-transition validation

**Status**: open
**Files**: `backend/app/admin/routes.py`

PERMANENT → NORMAL, demotion of the last HEAD, etc. are all allowed.
Add a guard table or explicit checks.

### No status-transition validation

**Status**: open

`PENDING → ACTIVE → BLOCKED` ordering not enforced. Status can flip
arbitrarily via admin endpoints.

### Expiry enforcement spotty

**Status**: open
**Files**: `backend/app/auth/dependencies.py:82-101`

`require_active_status` checks `membership_expires_at`, but several
endpoints depend on `get_current_user` instead and allow expired
members through.

### Rejection reason never returned to user

**Status**: open
**Files**: `backend/app/admin/routes.py:103,149`,
`backend/app/members/routes.py`

`admin_notes` is captured on rejection but never surfaced via any
member-facing endpoint, so applicants don't know why they were
rejected.

### No bulk member import endpoint

**Status**: open
**Files**: `scripts/bulk_onboard_members.py`

Bulk onboarding only exists as a standalone Python script run against
production Supabase. Add an admin-only `/admin/bulk-import` endpoint
that accepts a CSV/XLSX upload.

---

## Matrimony

### Matrimony storage bucket has no RLS

**Status**: open
**Files**: `storage_rls_policies.sql`,
`backend/app/matrimony/routes.py:56`

`storage_rls_policies.sql` configures a `membership` bucket; matrimony
actually uploads to `matrimony-photos`. The policies don't apply to
the bucket actually in use.

### Matrimony view RLS doesn't gate on user status

**Status**: open
**Files**: `matrimony_schema.sql:58-61`

Policy filters by `matrimony_profiles.status='ACTIVE'` and
`payment_status='VERIFIED'`, but doesn't check `users.status='ACTIVE'`.
A blocked member's profile remains visible.

### Matrimony subscription expiry is naive UTC

**Status**: open
**Files**: `backend/app/admin/routes.py:338`,
`backend/app/matrimony/routes.py:240`

`datetime.utcnow() + timedelta(days=30)` mixed with timezone-naive
storage; off-by-hours possible. Subscription countdown isn't returned
to the user either.

### No profile deactivation / hide

**Status**: open

Members can only delete a matrimony profile, not pause/hide it while
keeping bio-data.

---

## Articles / News

### Article cleanup is manual

**Status**: open
**Files**: `backend/app/articles/routes.py:196-228`

30-day expiry only takes effect when an admin hits `/articles/cleanup`.
Move to a scheduled job (Supabase cron / Render cron / pg_cron).

### Article expiry not visible to author

**Status**: open

Authors aren't notified before publication expires; the article just
disappears.

---

## Chat (channels / messages / presence)

### Chat is dead schema

**Status**: open
**Files**: `backend/app/db/schema.sql:73-112`,
`backend/app/main.py`

Tables, indexes and RLS policies exist but no router is registered, no
endpoints defined and no frontend. Either implement chat (most likely
on Supabase Realtime) or drop the tables to reduce confusion.

---

## Storage

### File upload validation weak

**Status**: open
**Files**: `backend/app/matrimony/routes.py:56`

Photo upload accepts any file the client sends with no MIME or size
sanity check before pushing to Supabase Storage.

### No orphan-file cleanup

**Status**: open

Deleting a matrimony profile or article doesn't always clean up the
underlying storage object. Add a cascade hook or a periodic sweep.

---

## Audit / observability

### No audit log

**Status**: open

Membership approvals, role changes, status changes, donation verifies
and PIN resets are not persisted as an append-only log. Only the
latest state survives.

**Done when:** an `audit_events` table captures actor, action, target,
before/after JSON, and `recorded_at`; written from every admin route
and from `auth.set_pin`.

### No webhook / external-system observability

**Status**: open

Razorpay webhooks have no handler at all (see Payments section); when
they exist, they should log every event into a `webhook_events` table
for replay and debugging.

### No background jobs

**Status**: open

Article cleanup, membership-expiry sweeps, lockout decay and orphan
storage cleanup are all manual or per-request. Pick a job runner
(pg_cron / Render cron / a small worker) and migrate them.

---

## Hardening

### Concurrent profile updates clobber each other

**Status**: open
**Files**: `backend/app/auth/routes.py:299-304`

Two tabs `PUT /auth/me` simultaneously and last-write-wins. Add an
`updated_at` etag check or row version.

### Frontend-direct Supabase writes still possible

**Status**: open

Donations was the worst offender (now fixed). Audit remaining
`supabase.from('…').insert/update/delete` calls in the frontend and
move sensitive ones behind backend endpoints.

### Soft-delete absent

**Status**: open

`ON DELETE CASCADE` on `membership_requests` and `payments` means
deleting a user wipes their financial trail. Switch to a `deleted_at`
timestamp pattern.

### No consent / T&C capture

**Status**: open

Matrimony registration and donations don't record consent. Capture a
`tnc_version` and timestamp on the relevant tables for privacy
compliance.
