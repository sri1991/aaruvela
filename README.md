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

## 🧪 The "Full-Cycle" Testing Flow
Use this flow to test or demo the entire system from Guest to Active Member:

1.  **Register (Guest)**: Go to `/auth` and sign up with a new phone number.
2.  **Application**: You will be forced to the `/membership` form. Complete all 6 steps.
3.  **Payment Proof**: At the last step, provide a Transaction ID or Screenshot Link.
4.  **Admin Login**: Logout, then log in using the **Master Admin** credentials below.
5.  **Approve**: Go to the `/admin` dashboard, click "View Full Application", and then **"Approve & Activate"**.
6.  **Success**: Logout, log back in with the Guest number. You now have access to the **Member Dashboard**!

---

## 🔑 Demo Credentials

| Role | Phone Number | PIN | Description |
| :--- | :--- | :--- | :--- |
| **Master Admin** | `1112223333` | `1234` | Full access to approvals and management. |
| **Test User** | `9876543210` | `1234` | A general user for testing regular access. |

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