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

## ⏭️ Development Roadmap
*   **Phase 5**: Matrimony Hub & Member Directory.
*   **Phase 6**: Integrated Razorpay Payments.
*   **Phase 7**: Digital ID Card Generation.


To view the swagger docs : 

"    http://localhost:8000/api/docs   "

1.
frontend: env 
aaruvela

VITE_SUPABASE_URL=https://jbaykylbcdairolyonsm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXlreWxiY2RhaXJvbHlvbnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDY3NzYsImV4cCI6MjA4NTA4Mjc3Nn0.pY60PwcrLBCWa6nSOx9KblD0fUPC_XdPIQo7gxL_c6Y
VITE_API_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000


2.
backend env

# Supabase Configuration
SUPABASE_URL=https://jbaykylbcdairolyonsm.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXlreWxiY2RhaXJvbHlvbnNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwNjc3NiwiZXhwIjoyMDg1MDgyNzc2fQ.GGYsDF2gzXjTRmZ92b_H-Pgdzyp1CO7hQtP8lwmRt1g
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXlreWxiY2RhaXJvbHlvbnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDY3NzYsImV4cCI6MjA4NTA4Mjc3Nn0.pY60PwcrLBCWa6nSOx9KblD0fUPC_XdPIQo7gxL_c6Y

# Razorpay Configuration (use test keys for now)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXX

# JWT Configuration
JWT_SECRET=kAgY6NQu6MbDS1BS76zdYIRgQtCFO0xpnbVD5OzPZf4
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost:5175,http://localhost:3000

# Environment
ENVIRONMENT=development
