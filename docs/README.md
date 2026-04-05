# 🏆 Aaruvela Community Application (Unified Platform)

A high-security, role-based community management system with digital membership, admin approvals, and future matrimony/directory services.

---

## 🚀 Quick Start: How to Run

### 1. Backend (Python FastAPI)
Navigate to the backend folder and start the server:
```powershell
cd backend
# Create virtual environment (first time only)
python -m venv venv
.\venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload
```
*Server runs on: http://localhost:8000*

### 2. Frontend (React Vite)
Open a separate terminal in the root folder (`aaruvela`):
```powershell
# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```
*Website runs on: http://localhost:5173*

---

## 🔑 Demo Credentials

| Role | Phone Number | PIN | Description |
| :--- | :--- | :--- | :--- |
| **Master Admin** | `1112223333` | `1234` | Full access to approvals and management. |
| **Test User** | `3456789012` | `1234` | A general user for testing regular access. |

---

## 📊 Project Architecture
*   **Frontend**: React + Tailwind CSS + Framer Motion (Located in root).
*   **Backend**: Python FastAPI + Supabase SDK (Located in `/backend`).
*   **Database**: Supabase Postgres (Roles, Requests, and User Profiles).

---

## 🗄️ Supabase Setup

### Storage Buckets
| Bucket | Purpose | Visibility |
|--------|---------|------------|
| `membership` | Member profile photos | Public |
| `articles` | Article/News PDFs | Public |

### Articles Table (run once in Supabase SQL Editor)
```sql
CREATE TABLE articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    pdf_url TEXT NOT NULL,
    pdf_path TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'ARTICLE' CHECK (category IN ('NEWS', 'ARTICLE')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PUBLISHED', 'PENDING', 'REJECTED')),
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_expires_at ON articles(expires_at);
```

### Transactions Table (run once in Supabase SQL Editor)
```sql
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    reference_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
```

### Auto-delete expired articles via pg_cron
Enable `pg_cron` in Supabase Dashboard → Database → Extensions, then run:
```sql
SELECT cron.schedule(
    'delete-expired-articles',
    '0 2 * * *',
    $$DELETE FROM articles WHERE expires_at < NOW()$$
);
```
> pg_cron removes DB records only. Storage files are cleaned up by `DELETE /articles/{id}` and `POST /articles/cleanup`.

---

## ⏭️ Development Roadmap
*   **Phase 5**: Matrimony Hub & Member Directory.
*   **Phase 6**: Integrated Razorpay Payments.
*   **Phase 7**: Digital ID Card Generation.

### 🔮 Infrastructure — Storage Migration: Supabase → Cloudflare R2
**When to do this:** When Supabase Storage free tier (1 GB shared across photos + PDFs) approaches capacity.

**Why R2:**
- 10 GB free storage (10× Supabase free tier)
- 1M write / 10M read ops free per month
- Zero egress fees (unlike AWS S3)
- S3-compatible API — minimal code change

**Migration steps when ready:**
1. Cloudflare account → R2 → create `articles` bucket
2. Add to `.env`: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`
3. `pip install boto3`
4. Replace Supabase storage calls in `backend/app/articles/routes.py` with boto3 S3 calls
5. Migrate existing PDFs: download from Supabase → upload to R2 → update `pdf_url` in DB
6. Update frontend upload flow: replace Supabase JS client direct upload with backend presigned-URL endpoint

**Files to change:** `backend/app/articles/routes.py`, article submit/publish forms in frontend.

---

To view the swagger docs: `http://localhost:8000/api/docs`
