# Spec — Chairman Notice, Member Videos, Public Announcements, Advertising

Status: **implemented** — see "Deployment steps" and "Deltas from the spec" below.
Target: Aaruvela (FastAPI + Supabase + Vite/React)

---

## Deployment steps (required before the features work)

1. **Run the migration** — paste [backend/app/db/migration_content_features.sql](../backend/app/db/migration_content_features.sql)
   into the Supabase SQL Editor. Creates `site_settings`, `videos`, `announcements`, `ads`,
   their indexes/triggers, and the `increment_ad_counter` function.
2. **Create the buckets** — run [storage_rls_policies.sql](../storage_rls_policies.sql). It creates
   `chairman`, `videos`, `announcements` and `ads` as public-read with per-bucket size and MIME limits,
   and leaves the existing `membership` policies untouched.
3. **Set `CRON_SECRET`** on the API service (any long random string) and on the new
   `aaruvela-video-cleanup` cron service in [render.yaml](../render.yaml) — the two must match.
   Leave it blank and the cleanup endpoint stays admin-only.
4. Deploy. The cron runs daily at 01:30 IST and calls `POST /videos/cleanup`.

Until step 1 runs, the new endpoints return 500 (`PGRST205 — table not found`); everything else on the
site is unaffected because each new UI element fails soft.

## Deltas from the spec as originally written

- **Uploads use signed upload URLs, not the anon key.** `POST /videos/upload-url` (member) and
  `POST /site/upload-url` (admin) mint a short-lived, single-object upload token with the service-role
  key; the browser PUTs to that. The new buckets therefore have *no* INSERT policy, so a leaked anon key
  cannot fill them — unlike the existing `membership` bucket. It also means the per-member video quota is
  enforced *before* the upload starts rather than after.
- **Videos get a poster frame**, captured client-side from the chosen file
  ([src/lib/videoPoster.js](../src/lib/videoPoster.js)). The videos grid shows posters and downloads no
  video bytes until a member presses play. Poster capture failing (older iOS Safari) is non-fatal.
- **Upload progress** goes through XHR ([src/lib/upload.js](../src/lib/upload.js)) because
  `supabase.storage.upload()` emits no progress events; it falls back to the SDK if XHR fails.
- **Rejected videos have their file deleted immediately**, not at cleanup time.
- The AdminDashboard tab split landed first, as planned — nine tabs now live in
  [src/pages/admin/](../src/pages/admin/) and [AdminDashboard.jsx](../src/pages/AdminDashboard.jsx) is a
  62-line shell.

## Not done

- `schema.sql` still does not contain the pre-existing `articles`, `transactions` or matrimony tables.
  This migration is self-contained, but the drift described in §0 remains.

---

Four features, all variations on "admin-controlled content that appears on the site".
Three of them are new; one (videos) is a near-copy of the existing `articles` module.

---

## 0. Ground rules inherited from the codebase

These are conventions the implementation must follow, taken from what already exists:

| Concern | Existing pattern | Reference |
|---|---|---|
| Backend module | `app/<domain>/{models.py,routes.py}`, router registered in `main.py` | [main.py:79-85](backend/app/main.py#L79-L85) |
| DB access | Supabase **service-role** client, RLS bypassed, all queries via `run_query(lambda: ...)` | [supabase_client.py:21-44](backend/app/db/supabase_client.py#L21-L44) |
| Admin gate | `Depends(require_admin)` → role `HEAD` | [dependencies.py:77-79](backend/app/auth/dependencies.py#L77-L79) |
| Member gate | `Depends(require_active_status)` → status `ACTIVE` + non-expired membership | [dependencies.py:82-101](backend/app/auth/dependencies.py#L82-L101) |
| File upload | Browser uploads **direct to Supabase Storage** with the anon key, then POSTs `{url, path}` to the API | [AdminDashboard.jsx:285-291](src/pages/AdminDashboard.jsx#L285-L291) |
| Approval lifecycle | `PENDING → PUBLISHED / REJECTED`, `expires_at`, admin `cleanup` endpoint | [articles/routes.py](backend/app/articles/routes.py) |
| Validation | Pydantic `Field(pattern=...)` on every enum-ish string | [articles/models.py](backend/app/articles/models.py) |

Two pre-existing gaps this spec has to work around:

1. **`schema.sql` is stale.** It has no `articles`, `accounts`, or `matrimony` tables — those were applied
   directly in the Supabase SQL editor. This spec adds one migration file; it must be run manually and
   `schema.sql` should be updated in the same pass so the drift stops growing.
2. **There is no scheduler.** Article expiry is enforced only by the read filter `expires_at > now`, and
   storage files are deleted only when an admin clicks cleanup. Videos need a real scheduled job (see §2.7).

---

## 1. Chairman's Notice — admin-replaceable PDF

**Today:** `src/assets/6000N Pamplet.pdf` is imported into the JS bundle and rendered in the
Administration → Chairman Message tab ([Administration.jsx:4](src/pages/Administration.jsx#L4),
[:163-219](src/pages/Administration.jsx#L163-L219)). Changing it requires a code change and a redeploy.

**After:** admin uploads a new PDF from the dashboard; the site picks it up immediately.

### 1.1 Data model

Rather than a single-purpose table, introduce a generic settings table — the ads/announcements features
below don't need it, but future "one editable thing" requests (contact email, donation account details,
banner text) will, and it costs one table.

```sql
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Key `chairman_notice`, value shape:

```json
{ "pdf_url": "https://...", "pdf_path": "chairman/1723.._notice.pdf",
  "file_name": "Chairman_Message_2026.pdf", "updated_at": "2026-08-11T..." }
```

### 1.2 Storage

New **public** bucket `chairman`. Path `chairman/{timestamp}_{sanitized_name}.pdf`.
Only ever one live object — the previous one is deleted on replace.

### 1.3 API — new module `app/site/`

| Method | Path | Auth | Behaviour |
|---|---|---|---|
| `GET` | `/site/settings/{key}` | **public** | Returns `value` or `404`. Used by Administration page. |
| `PUT` | `/site/chairman-notice` | `require_admin` | Body `{pdf_url, pdf_path, file_name}`. Reads the current value, deletes the old storage object, upserts the new one. Logs actor. |

Pydantic model:

```python
class ChairmanNoticeUpdate(BaseModel):
    pdf_url: str
    pdf_path: str
    file_name: str = Field(..., max_length=200)
```

### 1.4 Frontend

- **[Administration.jsx](src/pages/Administration.jsx)** — on mount, `GET /site/settings/chairman_notice`.
  Use the returned `pdf_url` in the `<object>` and the download link. If the request fails or returns 404,
  fall back to the bundled `chairmanMessagePdf` import so the page never regresses to empty.
  Show `file_name` in the toolbar instead of the hardcoded `6000N_Pamplet.pdf`.
- **AdminDashboard** — new tab **Site Content** with a single card: current file name + last-updated date,
  a "Replace PDF" file input (accept `application/pdf`, max 10 MB — same cap as articles), upload direct to
  the `chairman` bucket, then `PUT /site/chairman-notice`.

### 1.5 Acceptance criteria

- [ ] Admin uploads a PDF; a hard refresh of `/administration` → Chairman Message shows the new document.
- [ ] The previously stored PDF is gone from the `chairman` bucket (no orphan accumulation).
- [ ] A logged-out visitor can view the notice (endpoint is public).
- [ ] With no `chairman_notice` row present, the page still renders the bundled fallback PDF.
- [ ] Non-admin `PUT` returns 403.

**Effort:** ~half a day.

---

## 2. Member videos — upload → admin approval → visible 1 week

**Decision taken:** direct video *file* upload (not YouTube links). Read §2.8 before starting — this
is the one feature with a real running cost.

### 2.1 Data model

```sql
CREATE TABLE IF NOT EXISTS videos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          TEXT NOT NULL,
  description    TEXT,
  video_url      TEXT NOT NULL,      -- public URL
  video_path     TEXT NOT NULL,      -- storage path, needed for deletion
  thumbnail_url  TEXT,               -- optional poster frame
  thumbnail_path TEXT,
  mime_type      TEXT,
  size_bytes     BIGINT,
  duration_secs  INT,
  status         TEXT CHECK (status IN ('PENDING','PUBLISHED','REJECTED')) DEFAULT 'PENDING',
  submitted_by   UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewed_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_notes    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  published_at   TIMESTAMPTZ,
  expires_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_videos_status_expiry ON videos(status, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_submitter ON videos(submitted_by, created_at DESC);
```

`expires_at = published_at + 7 days`, set at approval time (mirrors `articles` 30-day logic at
[articles/routes.py:138-145](backend/app/articles/routes.py#L138-L145)).

### 2.2 Storage

Public bucket `videos`, path `submissions/{user_id}/{timestamp}_{sanitized_name}`.
Set the bucket's per-file limit and allowed MIME types **in the Supabase dashboard**, not just in JS —
client-side checks are advisory only.

- Allowed: `video/mp4`, `video/webm`, `video/quicktime`
- **Max 25 MB per file** (see §2.8 for why not 50)

### 2.3 Submission rules (server-enforced, not just UI)

- Submitter must satisfy `require_active_status`.
- Max **1 PENDING** submission per member at a time → 409 with a clear message.
- Max **2 PUBLISHED, non-expired** videos per member → 409.
- Title 3–200 chars, description ≤ 1000 chars.
- Reject the submit call if `size_bytes` exceeds the cap (the client sends it; also verify against the
  storage object via `supabase.storage.from_("videos").list()` on the parent path before approval).

### 2.4 API — new module `app/videos/`

| Method | Path | Auth | Behaviour |
|---|---|---|---|
| `GET` | `/videos` | `require_active_status` | `status=PUBLISHED AND expires_at > now`, newest first. |
| `GET` | `/videos/my-submissions` | `require_active_status` | Own history incl. `status` + `admin_notes`. |
| `GET` | `/videos/pending` | `require_admin` | Queue, joined to submitter `full_name, member_id`. |
| `POST` | `/videos/submit` | `require_active_status` | Enforces §2.3, inserts `PENDING`. |
| `POST` | `/videos/{id}/review` | `require_admin` | `APPROVE` → `PUBLISHED`, sets `published_at`/`expires_at` (+7d). `REJECT` → `REJECTED` **and deletes the storage object immediately** (a rejected 25 MB file should not sit in the bucket). |
| `DELETE` | `/videos/{id}` | `require_admin` | Takedown: removes row + storage object. |
| `POST` | `/videos/cleanup` | `require_admin` **or** cron secret | Deletes expired + rejected rows and their storage objects. Returns counts. |

Copy the structure of [articles/routes.py](backend/app/articles/routes.py) verbatim where possible —
same `run_query` usage, same logging style, same error shapes.

### 2.5 Member-facing UI

- **New page `/videos`** (routed in [App.jsx](src/App.jsx), added to [Navbar.jsx](src/components/Navbar.jsx) navItems)
  — responsive grid of cards, each with `<video controls preload="metadata" poster={thumbnail_url}>`.
  `preload="metadata"` matters: `preload="auto"` on a grid of videos would pull every file on page load.
  Show submitter name and a "Xd left" chip like [News.jsx:124-128](src/pages/News.jsx#L124-L128).
- **Access:** active members only, matching News. Public visibility is a one-line change later if wanted,
  but it multiplies bandwidth exposure — see §2.8.
- **MemberDashboard** — a "Submit a video" card next to the existing article submit form
  ([MemberDashboard.jsx:212-232](src/pages/MemberDashboard.jsx#L212-L232)). Needs an **upload progress bar**;
  `supabase.storage.upload()` gives no progress events, so use `createSignedUploadUrl()` + `XMLHttpRequest`
  with `upload.onprogress`. A 25 MB upload on Indian mobile data can take a minute — a spinner with no
  progress will read as a hang and users will retry, doubling the storage churn.
- Show my-submissions status list (PENDING / PUBLISHED with days left / REJECTED with admin note).

### 2.6 Admin UI

New **Videos** tab in AdminDashboard: pending queue with an inline `<video>` preview (admin must be able to
watch before approving), Approve / Reject-with-note buttons, plus a "Published" list showing expiry and a
takedown button. Add a storage-usage line ("N published videos · X MB of 1 GB").

### 2.7 Expiry must actually run

Read filters hide expired videos, but the **files** stay until something deletes them. Options, in order
of preference:

1. **Render Cron Job** (the repo already deploys via [render.yaml](render.yaml)) — daily `curl -X POST
   $API_URL/videos/cleanup -H "X-Cron-Secret: $CRON_SECRET"`. Accept either an admin JWT or a
   `CRON_SECRET` header on that endpoint. Free tier on Render supports cron jobs.
2. **Supabase `pg_cron`** — can delete rows but not storage objects; would leave orphan files. Not sufficient alone.
3. Manual admin button only — acceptable for launch, but the bucket will fill if the admin forgets.

Ship option 1. It's ~10 lines and it is the difference between a feature that runs itself and a chore.

### 2.8 ⚠️ Cost reality — read before building

You chose direct upload over YouTube links; that's a legitimate call for a community that isn't
comfortable with YouTube. But the numbers are tight on the Supabase **free** tier:

- **Storage: 1 GB total**, currently ~6.4 MB used across member photos, payment proofs and article PDFs.
  At a 25 MB cap, **~40 concurrent videos fills the disk**. At 50 MB, ~20.
- **Egress: 5 GB/month.** One 25 MB video watched 200 times = 5 GB. A single popular video can exhaust
  the month's bandwidth for the *entire site*, including member photos and ID cards.
- Supabase free tier also caps individual uploads at 50 MB — verify the bucket setting in the dashboard.

Mitigations baked into this spec: 25 MB cap, 7-day expiry with real deletion, per-member quotas,
members-only access, `preload="metadata"`. Add to that:

- Tell members to upload **short clips (≤2 min, 480–720p)** in the submit form's helper text.
- Put the storage-usage readout in the admin tab so the ceiling is visible before it's hit.
- **Escalation path when it fills:** Cloudflare R2 (10 GB free, **zero egress fees**) — already the
  documented plan for article PDFs. If videos take off, R2 or Cloudflare Stream becomes necessary rather
  than optional, and it's the same presigned-upload refactor for both features.

**Effort:** ~2–3 days (largest of the four).

---

## 3. Public announcement space

**Decision taken:** admin authors, everyone (including logged-out visitors) can read.

### 3.1 Data model

```sql
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,               -- plain text / newline-preserved; NOT raw HTML
  category    TEXT CHECK (category IN ('GENERAL','EVENT','URGENT','MEETING')) DEFAULT 'GENERAL',
  image_url   TEXT,
  image_path  TEXT,
  link_url    TEXT,                        -- optional "read more" target
  pinned      BOOLEAN DEFAULT FALSE,
  status      TEXT CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED')) DEFAULT 'DRAFT',
  publish_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,                 -- NULL = never expires
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_announcements_live ON announcements(status, publish_at DESC);
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

`body` is rendered as text with `white-space: pre-line`, **never** `dangerouslySetInnerHTML`. Admin is
trusted, but an XSS sink on a public page is not worth the convenience of bold text.

### 3.2 API — new module `app/announcements/`

| Method | Path | Auth | Behaviour |
|---|---|---|---|
| `GET` | `/announcements` | **public** | `status=PUBLISHED AND publish_at <= now AND (expires_at IS NULL OR expires_at > now)`, pinned first then newest. Supports `?limit=`. |
| `GET` | `/announcements/{id}` | **public** | Single, same visibility rules. |
| `GET` | `/announcements/all` | `require_admin` | Every row incl. drafts/archived. |
| `POST` | `/announcements` | `require_admin` | Create. |
| `PUT` | `/announcements/{id}` | `require_admin` | Update (incl. status transitions, pin/unpin). |
| `DELETE` | `/announcements/{id}` | `require_admin` | Delete row + image object. |

Apply the existing `slowapi` limiter to the public GETs (e.g. 60/min per IP) — they're the first
unauthenticated endpoints in the API, so they're the first thing a scraper will find.

Storage: reuse a public bucket `announcements` for optional images, max 2 MB, `image/jpeg|png|webp`.

### 3.3 Frontend

- **New page `/announcements`** — full list, category filter chips, card layout consistent with News.
  Added to Navbar (public item, no auth gate).
- **Home page** — an announcements strip **above** the gallery in [Home.jsx](src/pages/Home.jsx): the 3
  most recent live announcements, pinned first, each linking to `/announcements`. Render nothing at all
  when the list is empty (no empty-state box on the landing page).
- Urgent-category announcements get a distinct treatment (red accent + `AlertTriangle` icon).
- **AdminDashboard → Announcements tab** — table of all announcements with status badge, pin toggle,
  edit/delete, and a "New announcement" modal (title, body, category, optional image, optional expiry,
  save as draft or publish).

### 3.4 Acceptance criteria

- [ ] Logged-out visitor sees published announcements on `/` and `/announcements`.
- [ ] A draft is invisible publicly and visible in the admin tab.
- [ ] An announcement with `expires_at` in the past disappears from public views without any manual step.
- [ ] Pinned items sort above unpinned regardless of date.
- [ ] `<script>` typed into the body renders as literal text.

**Effort:** ~1 day.

---

## 4. Advertising area — admin-managed slots

**Today:** [AdBanner.jsx](src/components/AdBanner.jsx) is a hardcoded "Advertise with us" banner with a
mailto link, rendered once on Home. It becomes the *fallback* rather than the only state.

### 4.1 Data model

```sql
CREATE TABLE IF NOT EXISTS ads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  subtitle        TEXT,
  image_url       TEXT,
  image_path      TEXT,
  target_url      TEXT,
  placement       TEXT CHECK (placement IN ('HOME_BANNER','NEWS_LIST','MATRIMONY','FOOTER')) DEFAULT 'HOME_BANNER',
  advertiser_name TEXT,
  contact_info    TEXT,
  payment_ref     TEXT,                     -- ties to the accounts ledger if the ad was paid for
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
```

### 4.2 API — new module `app/ads/`

| Method | Path | Auth | Behaviour |
|---|---|---|---|
| `GET` | `/ads?placement=HOME_BANNER` | **public** | `active AND starts_at <= now AND (ends_at IS NULL OR ends_at > now)`, ordered by `sort_order`. |
| `GET` | `/ads/all` | `require_admin` | Everything, incl. expired/inactive, with counters. |
| `POST` | `/ads` | `require_admin` | Create. |
| `PUT` | `/ads/{id}` | `require_admin` | Update / activate / deactivate. |
| `DELETE` | `/ads/{id}` | `require_admin` | Delete row + image. |
| `POST` | `/ads/{id}/click` | **public** | `impressions`/`clicks` increment, fire-and-forget. |

Click/impression counting: keep it cheap. Increment via a small `rpc` or read-modify-write; do **not**
add per-view rows. If counters prove noisy, drop them — they're the least important part of this feature.

Storage: public bucket `ads`, max 2 MB, `image/jpeg|png|webp`. Recommend a fixed aspect ratio
(e.g. 1200×300 for `HOME_BANNER`) documented in the admin form's helper text; render with
`object-cover` so off-spec uploads don't break layout.

### 4.3 Frontend

- **New `src/components/AdSlot.jsx`** — takes `placement`, fetches `/ads?placement=...`, picks one at
  random per mount (or rotates on a timer if more than one is live), renders image + title + subtitle
  wrapped in an anchor with `target="_blank" rel="noopener noreferrer sponsored"`, and keeps the small
  "Ad" label already in AdBanner. Firing `POST /ads/{id}/click` on click.
- **Fallback:** when the fetch returns nothing, render the current hardcoded "Advertise with us" banner —
  so the slot is never blank and the house ad keeps selling inventory.
- **[Home.jsx](src/pages/Home.jsx)** — replace `<AdBanner />` with `<AdSlot placement="HOME_BANNER" />`.
  `AdBanner` stays in the tree as the fallback child.
- Optional second placement on `/news` and `/matrimony` once the home slot is proven.
- **AdminDashboard → Ads tab** — table (thumbnail, advertiser, placement, run dates, active toggle,
  impressions/clicks) + create/edit modal.

The existing [Disclaimer.jsx](src/pages/Disclaimer.jsx) already carries third-party-advertisement
language, so no new legal copy is needed — but confirm the "we do not endorse" clause is linked from
near the ad slot.

**Effort:** ~1 day.

---

## 5. Cross-cutting work

### 5.1 One migration file

`backend/app/db/migration_content_features.sql` containing `site_settings`, `videos`, `announcements`,
`ads`, their indexes and `updated_at` triggers. Run it in the Supabase SQL editor.
**Also fold the existing untracked tables (`articles`, `accounts`, matrimony) into `schema.sql`** in the
same pass — right now nobody can rebuild this database from the repo.

### 5.2 Storage buckets + policies

`chairman`, `videos`, `announcements`, `ads` — all public-read. Extend
[storage_rls_policies.sql](storage_rls_policies.sql) (currently only covers `membership`) with per-bucket
SELECT/INSERT policies and per-bucket size + MIME restrictions. Note the current policy set allows *anon*
uploads to `membership`; do **not** copy that for `videos` — restrict INSERT to authenticated users so an
unauthenticated script can't fill the bucket.

### 5.3 Backend registration

Four new routers in [main.py](backend/app/main.py):

```python
app.include_router(site_router,          prefix="/site",          tags=["Site"])
app.include_router(videos_router,        prefix="/videos",        tags=["Videos"])
app.include_router(announcements_router, prefix="/announcements", tags=["Announcements"])
app.include_router(ads_router,           prefix="/ads",           tags=["Ads"])
```

### 5.4 AdminDashboard is already over budget

[AdminDashboard.jsx](src/pages/AdminDashboard.jsx) is **943 lines** with 5 tabs; this spec adds 4 more
(Site Content, Videos, Announcements, Ads) which would push it past 1,600 — well over the project's
500-line guideline. Extract each tab into `src/pages/admin/<Name>Tab.jsx` **first**, as a pure move with
no behaviour change, then add the new tabs as files. This is a prerequisite, not a nice-to-have.

### 5.5 Public endpoints

`/announcements`, `/ads`, and `/site/settings/{key}` are the first unauthenticated data endpoints in the
API. Confirm `cors_origins_list` covers the production origin, and put the slowapi limiter on each.

---

## 6. Suggested order

| # | Feature | Why this position | Est. |
|---|---|---|---|
| 0 | Split AdminDashboard tabs into files | Unblocks everything after it | 2 h |
| 1 | Chairman notice + `site_settings` | Smallest; proves the settings + admin-upload pattern | 0.5 d |
| 2 | Announcements | Establishes the public-read path and the public admin CRUD shape | 1 d |
| 3 | Ads | Reuses the announcements shape almost exactly | 1 d |
| 4 | Videos + cron cleanup | Largest, and the only one with an ongoing cost | 2–3 d |

Roughly a week of focused work. Features 1–3 are low-risk; feature 4 is the one to watch.

---

## 7. Open questions

1. **Video size cap** — shipped at 25 MB (`MAX_VIDEO_BYTES` in
   [backend/app/videos/models.py](../backend/app/videos/models.py), mirrored in the bucket limit and the
   submit form). A 2-minute phone clip at 1080p is ~60–100 MB; at 480p it's ~15 MB. Say the word and it
   moves — but read §2.8 first.
2. **Video audience** — shipped members-only, matching News. Public would be higher reach but multiplies
   the bandwidth exposure described in §2.8.
3. **Telugu content** — the navbar has a Tel/Eng toggle that isn't wired up. Do announcements need
   `title_te` / `body_te` columns now, or is bilingual out of scope for this round?
4. **Paid ads** — `payment_ref` is in the schema so an ad can be linked to a ledger entry. Should
   creating an ad also create an INCOME transaction in the accounts module, or stay manual?
5. **Approval notifications** — members currently learn their article was approved only by checking the
   dashboard. Same for videos, or is SMS/WhatsApp/email notification in scope? (There is no notification
   infrastructure today.)
