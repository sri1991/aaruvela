# Community App

A secure, web-based community application with controlled membership, role-based governance, real-time chat, and payment integration.

## 🎯 Project Overview

This is a production-grade community platform built with:
- **Security First**: Multi-layer authentication, backend-enforced permissions
- **Controlled Access**: Payment + manual admin approval workflow
- **Real-time Chat**: Instant messaging using Supabase Realtime
- **Role-Based Governance**: Three-tier role system (HEAD, PERMANENT, GENERAL)

## 🏗️ Architecture

```
Frontend (React + TypeScript + Vite)
         ↓
    FastAPI Backend
         ↓
    Supabase (Auth + DB + Realtime)
         ↓
    Razorpay (Payments)
```

## 📚 Documentation

- **[Original Requirements](README.md)** - Complete project specification
- **[Setup Instructions](README_SETUP.md)** - Step-by-step setup guide
- **[Architecture](brain/.../architecture.md)** - System design and technical details
- **[Implementation Plan](brain/.../implementation_plan.md)** - Phased development roadmap

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Supabase account
- Razorpay account (test mode)

### Backend Setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Configure .env file
cp .env.example .env
# Edit .env with your credentials

# Start server
uvicorn app.main:app --reload
```

Backend will run at: http://localhost:8000

### Frontend Setup

```powershell
cd frontend
npm install

# Configure .env file
cp .env.example .env
# Edit .env with your Supabase credentials

# Start dev server
npm run dev
```

Frontend will run at: http://localhost:5173

### Database Setup

1. Create Supabase project at https://app.supabase.com/
2. Run the SQL schema: `backend/app/db/schema.sql`
3. Copy API keys to `.env` files

For detailed instructions, see [README_SETUP.md](README_SETUP.md)

## 📁 Project Structure

```
community app/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── auth/     # Authentication logic
│   │   ├── members/  # Membership management
│   │   ├── payments/ # Payment processing
│   │   ├── chat/     # Chat functionality
│   │   ├── admin/    # Admin operations
│   │   └── db/       # Database utilities
│   └── requirements.txt
├── frontend/          # React + TypeScript frontend
│   ├── src/
│   │   ├── auth/     # Auth UI components
│   │   ├── chat/     # Chat UI
│   │   ├── admin/    # Admin dashboard
│   │   ├── api/      # API client
│   │   └── types/    # TypeScript definitions
│   └── package.json
└── README_SETUP.md    # Setup guide
```

## 🔑 Key Features

### Phase 1 (Complete) ✅
- Project structure setup
- Backend skeleton (FastAPI)
- Frontend skeleton (React + TypeScript)
- Database schema
- Development environment

### Phase 2 (Upcoming)
- Supabase Auth integration
- PIN management system
- Rate limiting & account locking

### Future Phases
- Membership workflows
- Payment integration
- Real-time chat
- Admin dashboard
- Testing & deployment

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth + Custom PIN |
| Real-time | Supabase Realtime |
| Payments | Razorpay |
| Hosting | Vercel (frontend), Fly.io (backend) |

## 🔒 Security Principles

- Backend owns ALL sensitive logic
- Frontend NEVER validates credentials or assigns roles
- Multi-layer authentication (Supabase + PIN)
- Row Level Security (RLS) on all database tables
- Payment does NOT auto-grant access
- Manual admin approval required

## 📈 Development Status

**Current Phase**: Phase 1 - Foundation & Project Setup ✅

See [task.md](brain/.../task.md) for detailed progress tracking.

## 🤝 Contributing

This is a private project. For questions or issues, contact the project administrator.

## 📄 License

Proprietary - All rights reserved
