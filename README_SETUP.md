# Community App - Setup Instructions

## Phase 1: Foundation & Project Setup

This guide will help you set up the development environment for the Community App.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.10+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** and **npm** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **A Supabase account** - [Sign up](https://supabase.com/)
- **A Razorpay account** (test mode) - [Sign up](https://razorpay.com/)

---

## Step 1: Supabase Setup

### 1.1 Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Fill in project details:
   - **Name**: community-app (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
4. Wait for project to be created (~2 minutes)

### 1.2 Run Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `backend/app/db/schema.sql`
4. Paste into the SQL editor and click "Run"
5. Verify all tables are created in **Database > Tables**

### 1.3 Get API Keys

1. Go to **Settings > API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (⚠️ Keep this secret!)

---

## Step 2: Backend Setup

### 2.1 Create Virtual Environment

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Verify activation (you should see (venv) in your prompt)
```

### 2.2 Install Dependencies

```powershell
pip install -r requirements.txt
```

### 2.3 Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```powershell
   cp .env.example .env
   ```

2. Edit `.env` and fill in your values:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   SUPABASE_ANON_KEY=your_anon_key_here
   
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=your_razorpay_secret_here
   
   JWT_SECRET=generate_a_random_string_at_least_32_characters_long
   JWT_ALGORITHM=HS256
   JWT_EXPIRATION_MINUTES=1440
   
   API_HOST=0.0.0.0
   API_PORT=8000
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   
   ENVIRONMENT=development
   ```

   **To generate a JWT secret:**
   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

### 2.4 Test Backend

```powershell
# Make sure you're in the backend directory with venv activated
uvicorn app.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

Open your browser to:
- **API Root**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs
- **Health Check**: http://localhost:8000/health

---

## Step 3: Frontend Setup

### 3.1 Install Dependencies

```powershell
# Open a NEW terminal (keep backend running)
cd frontend

npm install
```

### 3.2 Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```powershell
   cp .env.example .env
   ```

2. Edit `.env`:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   VITE_API_URL=http://localhost:8000
   ```

### 3.3 Test Frontend

```powershell
npm run dev
```

You should see:
```
  VITE v5.0.12  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your browser to: http://localhost:5173

You should see the Community App welcome page!

---

## Step 4: Verify Setup

### ✅ Backend Checklist
- [ ] Backend runs without errors at http://localhost:8000
- [ ] API docs accessible at http://localhost:8000/api/docs
- [ ] Health check returns `{"status": "healthy"}`
- [ ] No errors in terminal

### ✅ Frontend Checklist
- [ ] Frontend runs without errors at http://localhost:5173
- [ ] Welcome page displays correctly
- [ ] No console errors in browser DevTools

### ✅ Supabase Checklist
- [ ] All tables created successfully
- [ ] RLS policies enabled (check Database > Policies)
- [ ] API keys copied to `.env` files

---

## Project Structure

After setup, your structure should look like:

```
community app/
├── backend/
│   ├── app/
│   │   ├── db/
│   │   │   ├── schema.sql
│   │   │   └── supabase_client.py
│   │   ├── config.py
│   │   └── main.py
│   ├── venv/
│   ├── .env
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.tsx
│   ├── node_modules/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
├── README.md
└── README_SETUP.md (this file)
```

---

## Common Issues

### Backend won't start

**Error**: `ModuleNotFoundError: No module named 'fastapi'`
- **Solution**: Activate virtual environment and run `pip install -r requirements.txt`

**Error**: `supabase_url` field required
- **Solution**: Check that `.env` file exists and has `SUPABASE_URL` set

### Frontend won't start

**Error**: `Cannot find module '@supabase/supabase-js'`
- **Solution**: Run `npm install` in the frontend directory

**Error**: Missing Supabase environment variables
- **Solution**: Create `.env` file in frontend directory with Supabase credentials

### Database schema errors

**Error**: Relation already exists
- **Solution**: The tables already exist. You can skip or drop existing tables first.

---

## Next Steps

Now that Phase 1 is complete, you're ready to proceed to:

**Phase 2: Authentication & PIN System**
- Set up Supabase Auth integration
- Build PIN management system
- Implement rate limiting

Refer to the [implementation_plan.md](file:///C:/Users/maruthi.t/.gemini/antigravity/brain/fa7cb29a-8eba-41cb-a9ce-114a09ffc0bf/implementation_plan.md) for detailed steps.

---

## Development Workflow

### Starting Development

**Terminal 1 (Backend):**
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

### Stopping Development

Press `Ctrl+C` in both terminals to stop the servers.

---

## Getting Help

- **Documentation**: Check the architecture.md and implementation_plan.md files
- **Supabase Docs**: https://supabase.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **Vite Docs**: https://vitejs.dev/

---

**Phase 1 Complete! 🎉**

You now have:
✅ Backend API running with FastAPI  
✅ Frontend running with React + TypeScript + Vite  
✅ Supabase database with complete schema  
✅ Development environment configured  
