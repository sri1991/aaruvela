# Community App - Architecture & Flows

## 1. App Overview
The Community App is a secure, web-based platform tailored for managing a community with a controlled membership system. It features role-based governance, secure multi-layer authentication, dynamic membership approvals, and aims to eventually integrate real-time chat and payment gateways.

### Tech Stack
- **Frontend**: React.js, TypeScript, Vite, TailwindCSS
- **Backend**: Python, FastAPI
- **Database & Auth**: Supabase (PostgreSQL + Supabase Auth)
- **Payments**: Razorpay (Integration pending/planned phase)

---

## 2. Backend Architecture
The backend is built with **FastAPI** and primarily acts as a secure middleware between the frontend and the **Supabase** database. It enforces sensitive logic such as PIN verification, account lockouts, and role assignment.

### Core Modules:
- **`app/auth/`**: Custom Authentication. Manages PIN hashing, registration (creating a shadow Supabase auth user using `{phone}@community.app`), login rate limiting, and JWT token issuance.
- **`app/members/`**: Handles membership requests. Authenticated users can submit their bio-data here to apply for roles like `PERMANENT`, `NORMAL`, or `ASSOCIATED`.
- **`app/admin/`**: Provides endpoints for `HEAD` admins to review, approve, or reject membership applications, and automatically assigns a sequencial Member ID (e.g., `PID-001`, `NID-001`, `AID-001`).
- **`app/db/`**: Supabase client initialization and connection handling.

---

## 3. Key User Flows

### A. Registration & Login Flow
1. **Registration**: The user enters their name, phone, and a 4-digit PIN. The backend creates a dummy email (`{phone}@community.app`) to register them in Supabase Auth behind the scenes with a random password. The PIN is hashed with bcrypt and saved in the `users` table.
2. **Login**: 
   - The user enters phone and PIN.
   - The backend checks the `users` table. If the user fails 5 times, the account is locked for 30 minutes. 
   - On success, it returns a JWT token.

### B. Membership Application Flow
1. **Application**: A user logs in (default status `PENDING`, role `GENERAL`). They navigate to the Membership Request page. 
2. **Submission**: They fill out extensive bio-data (dob, star_pada, occupation, address, etc.) and submit.
3. **Database Update**: The backend updates the `users` table with the bio-data and creates a `membership_requests` record with `approval_status = 'PENDING'`.

### C. Admin Approval Flow
1. A user with the `HEAD` role navigates to the Admin Dashboard.
2. They view all `PENDING` requests.
3. They choose to **Approve**. 
4. The backend calculates the next available ID based on the requested role (e.g. `PID` for Permanent, `NID` for Normal) and updates the user's status to `ACTIVE` and assigns the newly generated `member_id`.

---

## 4. D2 Diagrams

Below are the D2 diagrams illustrating the architecture and specific workflows.

### System Architecture Diagram
```d2
direction: right

Frontend: React + Vite App {
  shape: browser
}

Backend: FastAPI Server {
  shape: component
  Auth Module
  Members Module
  Admin Module
}

Supabase: Supabase Services {
  shape: cylinder
  Auth: Supabase Auth
  DB: PostgreSQL Database
}

Frontend -> Backend: REST API calls (JWT Auth)
Backend -> Supabase.Auth: Admin API calls
Backend -> Supabase.DB: SQL/PostgREST queries
```

### Registration Flow Diagram
```d2
direction: right

User -> Frontend (React): Enters Name, Phone, PIN
Frontend (React) -> Backend (FastAPI): POST /auth/register

Backend (FastAPI) -> Backend (FastAPI): Hash PIN (bcrypt)
Backend (FastAPI) -> Supabase Auth: create_user({phone}@community.app, random_pass)
Supabase Auth -> Backend (FastAPI): Returns Auth UUID

Backend (FastAPI) -> Supabase DB: Insert into users table (phone, hashed_pin, UUID)
Supabase DB -> Backend (FastAPI): Success

Backend (FastAPI) -> Backend (FastAPI): Generate JWT Token
Backend (FastAPI) -> Frontend (React): Returns token & user profile
Frontend (React) -> User: Redirect to Dashboard / Membership Request
```

### Admin Approval Flow Diagram
```d2
direction: right

Admin -> Frontend (React): Views Pending Applications
Frontend (React) -> Backend (FastAPI): GET /admin/pending-requests (Requires HEAD role)
Backend (FastAPI) -> Supabase DB: fetch membership_requests
Supabase DB -> Backend (FastAPI): Returns data
Backend (FastAPI) -> Frontend (React): Displays list

Admin -> Frontend (React): Clicks "Approve" for User X (Role: PERMANENT)
Frontend (React) -> Backend (FastAPI): POST /admin/approve-request

Backend (FastAPI) -> Supabase DB: Count existing PERMANENT users
Supabase DB -> Backend (FastAPI): Returns count (e.g., 5)
Backend (FastAPI) -> Backend (FastAPI): Generate Member ID (PID-006)

Backend (FastAPI) -> Supabase DB: Update user status to ACTIVE, role, and member_id
Backend (FastAPI) -> Supabase DB: Update membership_requests to APPROVED
Supabase DB -> Backend (FastAPI): Success
Backend (FastAPI) -> Frontend (React): Success Response
```

---

## 5. Upcoming Proposals

### A. Image Uploads with Supabase Storage
For the membership application process, users need to upload a Profile Picture and Payment Proof. 

**Proposed Flow:**
1. **Storage Setup**: Create two dedicated buckets in Supabase:
   - `avatars`: For Profile Pictures
   - `payment_proofs`: For Payment Transaction Screenshots
2. **Security Rules (RLS)**:
   - `avatars`: Viewable by authenticated users; uploadable only by the owner.
   - `payment_proofs`: Viewable and uploadable only by the owner; viewable by `HEAD` admins.
3. **Frontend Direct Upload**: 
   - The user selects an image file on the frontend form.
   - React uploads the file **directly to Supabase Storage** using the Supabase JS client.
   - Supabase returns a public/signed URL for the image.
4. **Backend Payload submission**: 
   - The frontend includes the returned URL in the JSON payload submitted to FastAPI (`POST /members/apply`).
   - The FastAPI backend securely stores the *text URLs* alongside the user's other data in the `users` and `membership_requests` tables.

### B. Database Schema Evaluation & Improvements
Based on a recent review of `schema.sql`, the current architecture is robust and secure (excellent use of RLS and Constraints). However, as the application scales, the following improvements are proposed:

1. **Normalize the `users` table**: Currently, the `users` table acts as a "God Object" holding both core authentication data and highly specific bio-data (like `gotram`, `star_pada`). Creating a separate `member_profiles` table for bio-data will improve query performance and scalability.
2. **Optimize Admin RLS**: The current RLS policy for admins uses an `EXISTS` subquery which hits the database for every row check. Migrating to Supabase custom JWT claims (e.g., `auth.jwt() ->> 'role' = 'HEAD'`) will make these checks instantaneous.
3. **Implement Soft Deletes**: Changing `ON DELETE CASCADE` to a `deleted_at` timestamp (Soft Deletes) ensures historical records and audit trails for membership requests and payments are preserved even if a user is removed.
