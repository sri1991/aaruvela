# Pre-Phase 3 Checklist

Before proceeding to Phase 3 (Membership & Payments), please complete and verify the following:

---

## ✅ 1. Supabase Project Setup

### Create Supabase Project
- [ ] Go to https://app.supabase.com/
- [ ] Click "New Project"
- [ ] Note down your **Project URL** and **API Keys**

### Run Database Schema
- [ ] Open Supabase SQL Editor
- [ ] Copy contents of `backend/app/db/schema.sql`
- [ ] Paste and run in SQL Editor
- [ ] Verify all 7 tables created:
  - [ ] `users`
  - [ ] `membership_requests`
  - [ ] `payments`
  - [ ] `channels`
  - [ ] `channel_members`
  - [ ] `messages`
  - [ ] `presence`

### Verify RLS Policies
- [ ] Go to Database → Policies in Supabase
- [ ] Check that RLS is enabled on all tables
- [ ] Verify policies exist for each table

---

## ✅ 2. Backend Setup

### Install Dependencies
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

**Checklist:**
- [ ] Virtual environment created
- [ ] All dependencies installed without errors
- [ ] No pip errors

### Configure Environment Variables
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in `.env` with your values:

```env
# Required from Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ... (service_role key)
SUPABASE_ANON_KEY=eyJ... (anon public key)

# Generate a random secret
JWT_SECRET=<run: python -c "import secrets; print(secrets.token_urlsafe(32))">

# Razorpay (can use test keys for now)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

### Test Backend
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload
```

**Verify:**
- [ ] Server starts without errors
- [ ] Visit http://localhost:8000
- [ ] Should see: `{"message": "Community App API", "version": "1.0.0", "status": "running"}`
- [ ] Visit http://localhost:8000/api/docs
- [ ] Should see Swagger UI with "Authentication" section
- [ ] Should see 4 auth endpoints:
  - [ ] `POST /auth/set-pin`
  - [ ] `POST /auth/verify-pin`
  - [ ] `POST /auth/unlock-account`
  - [ ] `GET /auth/me`

---

## ✅ 3. Frontend Setup

### Configure Environment Variables
- [ ] Copy `.env.example` to `.env` in frontend folder
- [ ] Fill in with Supabase credentials:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (same as backend SUPABASE_ANON_KEY)
VITE_API_URL=http://localhost:8000
```

### Test Frontend
```powershell
cd frontend
npm run dev
```

**Verify:**
- [ ] Server starts without errors
- [ ] Visit http://localhost:5173
- [ ] Should see homepage with "Login" and "Sign Up" buttons
- [ ] No console errors in browser DevTools

---

## ✅ 4. Test Authentication Flow

### Test Signup (Complete Flow)

1. **Navigate to Signup**
   - [ ] Go to http://localhost:5173/signup
   - [ ] Page loads without errors

2. **Enter Credentials**
   - [ ] Enter email: `test@example.com`
   - [ ] Enter password: `password123`
   - [ ] Click "Continue"
   - [ ] Should see success message
   - [ ] Should proceed to PIN step

3. **Set PIN**
   - [ ] Enter PIN: `1234`
   - [ ] Confirm PIN: `1234`
   - [ ] Click "Set PIN & Continue"
   - [ ] Should redirect to login page

4. **Verify in Supabase**
   - [ ] Go to Supabase → Authentication → Users
   - [ ] Should see user with email `test@example.com`
   - [ ] Go to Database → Table Editor → users
   - [ ] Should see user record with:
     - `identifier`: test@example.com
     - `status`: PENDING
     - `pin_hash`: (should have a hash starting with $2b$)
     - `role`: NULL

### Test Login (Complete Flow)

1. **Navigate to Login**
   - [ ] Go to http://localhost:5173/login
   - [ ] Page loads without errors

2. **Enter Credentials**
   - [ ] Enter email: `test@example.com`
   - [ ] Enter password: `password123`
   - [ ] Click "Continue"
   - [ ] Should proceed to PIN step

3. **Enter PIN**
   - [ ] Enter PIN: `1234`
   - [ ] Click "Login"
   - [ ] Should see success message
   - [ ] Should redirect (likely to membership-request page since status is PENDING)

4. **Verify Token**
   - [ ] Open browser DevTools → Application → Session Storage
   - [ ] Should see `access_token` key with JWT value

---

## ✅ 5. Test Rate Limiting & Account Locking

### Test Failed Login Attempts

1. **Failed Attempts**
   - [ ] Go to login page
   - [ ] Enter correct email/password
   - [ ] Enter **wrong** PIN: `9999`
   - [ ] Should see: "Invalid PIN. 4 attempts remaining."
   - [ ] Try wrong PIN again: `8888`
   - [ ] Should see: "Invalid PIN. 3 attempts remaining."
   - [ ] Continue until 5 failed attempts
   - [ ] Should see: "Account locked for 30 minutes..."

2. **Verify Lock in Database**
   - [ ] Go to Supabase → Table Editor → users
   - [ ] Find test user
   - [ ] Check fields:
     - `failed_login_attempts`: should be 5
     - `locked_until`: should have a future timestamp

3. **Verify Lock Works**
   - [ ] Try logging in with correct PIN
   - [ ] Should still see "Account locked" message

### Test Account Unlock (Optional - requires HEAD user)

Skip this if you don't have a HEAD user yet. We'll test this in Phase 3.

---

## ✅ 6. Create HEAD User (Admin)

You'll need at least one admin user to test Phase 3 features.

### Option A: Using Supabase Console (Easiest)

1. **Create Auth User**
   - [ ] Go to Supabase → Authentication → Users
   - [ ] Click "Add User" → Email
   - [ ] Enter email: `admin@example.com`
   - [ ] Enter password: `admin123`
   - [ ] Click "Create User"

2. **Update Database Record**
   - [ ] Go to Database → Table Editor → users
   - [ ] Find or insert a row with:
     - `id`: (copy ID from auth user above)
     - `identifier`: admin@example.com
     - `role`: HEAD
     - `status`: ACTIVE
     - `pin_hash`: NULL (will set via app)

3. **Set Admin PIN**
   - [ ] Log in to app with admin@example.com
   - [ ] Set PIN via signup flow OR use Swagger UI:
     - Go to http://localhost:8000/api/docs
     - Use /auth/set-pin endpoint
     - Get JWT from Supabase (login with admin credentials)
     - Set PIN: `0000` (or your choice)

### Option B: Using SQL

Run this in Supabase SQL Editor:

```sql
-- Insert HEAD user (replace the ID with actual Supabase auth user ID)
INSERT INTO users (id, identifier, role, status, created_at)
VALUES 
  ('YOUR_SUPABASE_AUTH_USER_ID', 'admin@example.com', 'HEAD', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE
SET role = 'HEAD', status = 'ACTIVE';
```

**Verify:**
- [ ] Admin user exists in `users` table
- [ ] `role` = 'HEAD'
- [ ] `status` = 'ACTIVE'
- [ ] Can log in with admin credentials

---

## ✅ 7. Verify API Endpoints (Optional but Recommended)

Using http://localhost:8000/api/docs:

### Test /auth/me
- [ ] Get JWT token (login via frontend or Supabase)
- [ ] Click "Authorize" in Swagger
- [ ] Enter: `Bearer <your_jwt_token>`
- [ ] Try `/auth/me` endpoint
- [ ] Should return your user data

### Test /auth/set-pin
- [ ] Use Authorize with JWT
- [ ] Try `/auth/set-pin` with new PIN
- [ ] Should return success message
- [ ] Verify you can login with new PIN

### Test /auth/unlock-account (Admin only)
- [ ] Use admin JWT token
- [ ] Try unlocking a locked account
- [ ] Should work if you're HEAD role
- [ ] Should fail if you're not HEAD

---

## ✅ 8. Check for Errors

### Backend Errors
- [ ] No errors in terminal where backend is running
- [ ] No Python exceptions
- [ ] No Supabase connection errors

### Frontend Errors
- [ ] No errors in browser console (F12)
- [ ] No TypeScript compilation errors
- [ ] No network errors in Network tab

---

## 📸 Screenshots to Share (Optional)

If you encounter any issues, please share screenshots of:

1. Supabase tables view showing `users` table
2. Backend terminal showing it running
3. Frontend homepage with Login/Sign Up buttons
4. Swagger UI at /api/docs showing auth endpoints
5. Any error messages in browser console or terminal

---

## 🎯 Success Criteria

You're ready for Phase 3 if you can answer YES to all:

- [ ] ✅ Supabase project created and schema deployed
- [ ] ✅ Backend runs without errors
- [ ] ✅ Frontend runs without errors
- [ ] ✅ Can sign up a new user
- [ ] ✅ Can log in with email/password + PIN
- [ ] ✅ Account locking works after 5 failed attempts
- [ ] ✅ At least one HEAD user exists for admin testing
- [ ] ✅ No console or terminal errors

---

## ❓ Common Issues & Solutions

### Issue: "ModuleNotFoundError" in backend
**Solution:** Make sure virtual environment is activated and dependencies installed:
```powershell
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Issue: "Missing environment variables" error
**Solution:** Create `.env` file from `.env.example` and fill in all values

### Issue: Frontend can't connect to backend
**Solution:** 
- Check backend is running on port 8000
- Check `VITE_API_URL` in frontend `.env` is correct
- Check CORS origins in backend `.env` includes `http://localhost:5173`

### Issue: Supabase errors
**Solution:**
- Verify API keys are correct
- Check schema.sql was executed successfully
- Ensure you're using the right keys (service_role for backend, anon for frontend)

### Issue: TypeScript errors in frontend
**Solution:**
- Make sure `vite-env.d.ts` file exists
- Run `npm install` again
- Restart VSCode

---

## 📞 Need Help?

If you encounter issues:
1. Share the specific error message
2. Mention which step you're stuck on
3. Share relevant screenshots
4. I'll help troubleshoot!

Once everything above is ✅, we're ready for **Phase 3: Membership & Payments**!
