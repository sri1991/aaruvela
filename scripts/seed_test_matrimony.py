"""
Seed test matrimony data with isolated TST- member IDs.

USER CREATION  — writes directly to Supabase with TST-PID-/TST-NID-/TST-AID-
                 member IDs so the real PID/NID/AID counters are never touched.
MATRIMONY FLOW — runs through the live API (register → admin approve) to
                 exercise the actual endpoints.

Usage (run from project root):
    python scripts/seed_test_matrimony.py            # full seed
    python scripts/seed_test_matrimony.py --profiles-only  # skip user creation
    python scripts/seed_test_matrimony.py --teardown       # print cleanup SQL

Requires: pip install requests python-dotenv supabase bcrypt
"""

import sys
import argparse
import bcrypt
import requests
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import os

load_dotenv("backend/.env")

BASE_URL = "http://localhost:8000"
ADMIN_PHONE = "1112223333"
ADMIN_PIN   = "1234"
TEST_PIN    = "1234"

SUPABASE_URL         = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# ── Test member definitions ───────────────────────────────────────────────────
# member_id uses TST- prefix so _generate_member_id (LIKE 'PID-%') ignores them.
# Phones in 9100000001-9100000006 — reserved test range.
# matrimony_status controls what the script does after profile submission:
#   VERIFIED_ACTIVE  → admin approves (30-day sub set by API)
#   VERIFIED_EXPIRED → admin approves, then script backdates sub_expires to -3 days
#   PENDING          → profile submitted but NOT approved

TEST_MEMBERS = [
    # ── Males ─────────────────────────────────────────────────────────────────
    {
        "full_name": "Arjun Dev Sharma",
        "phone": "9100000001",
        "role": "PERMANENT",
        "member_id": "TST-PID-001",
        "gender": "MALE",
        "age": 31,
        "dob": "1994-06-15",
        "tob": "06:30:00",
        "gotram": "Bharadwaja",
        "star_with_pada": "Rohini - 2",
        "place_of_birth": "Hyderabad",
        "current_city": "Hyderabad",
        "occupation": "Software Engineer",
        "annual_income": "18 LPA",
        "father_guardian_name": "Dev Sharma",
        "brothers": 1,
        "sisters": 0,
        "willing_to_relocate": True,
        "particulars": "BE Computer Science. Working in a reputed MNC. Interests include classical music and travel. Vegetarian. Well settled family background.",
        "requirement": "Looking for a well-educated girl from a good Niyogi Brahmin family. Working preferred.",
        "matrimony_status": "VERIFIED_ACTIVE",
    },
    {
        "full_name": "Venkat Prasad Rao",
        "phone": "9100000002",
        "role": "NORMAL",
        "member_id": "TST-NID-001",
        "gender": "MALE",
        "age": 28,
        "dob": "1997-11-03",
        "tob": "09:15:00",
        "gotram": "Vasishta",
        "star_with_pada": "Uttarashada - 1",
        "place_of_birth": "Vijayawada",
        "current_city": "Bangalore",
        "occupation": "Doctor (MBBS)",
        "annual_income": "12 LPA",
        "father_guardian_name": "Prasad Rao",
        "brothers": 0,
        "sisters": 1,
        "willing_to_relocate": False,
        "particulars": "MBBS from Osmania Medical College. Currently doing postgraduate studies. Belongs to a traditional family.",
        "requirement": "Prefer a graduate girl, homemaker or working both acceptable. Should be from Niyogi community.",
        "matrimony_status": "VERIFIED_ACTIVE",
    },
    {
        "full_name": "Suresh Kumar Iyer",
        "phone": "9100000003",
        "role": "NORMAL",
        "member_id": "TST-NID-002",
        "gender": "MALE",
        "age": 33,
        "dob": "1992-03-22",
        "tob": "14:00:00",
        "gotram": "Kashyapa",
        "star_with_pada": "Krittika - 3",
        "place_of_birth": "Chennai",
        "current_city": "Chennai",
        "occupation": "Government Employee",
        "annual_income": "8 LPA",
        "father_guardian_name": "Kumar Iyer",
        "brothers": 2,
        "sisters": 0,
        "willing_to_relocate": True,
        "particulars": "B.Sc graduate. Works in state government. Traditional family. Simple and sincere.",
        "requirement": "Any educated girl from a good family background.",
        "matrimony_status": "PENDING",   # left unverified — tests the pending state
    },

    # ── Females ───────────────────────────────────────────────────────────────
    {
        "full_name": "Priya Lakshmi Varma",
        "phone": "9100000004",
        "role": "PERMANENT",
        "member_id": "TST-PID-002",
        "gender": "FEMALE",
        "age": 27,
        "dob": "1998-08-10",
        "tob": "07:45:00",
        "gotram": "Atri",
        "star_with_pada": "Hasta - 2",
        "place_of_birth": "Hyderabad",
        "current_city": "Hyderabad",
        "occupation": "Software Engineer",
        "annual_income": "14 LPA",
        "father_guardian_name": "Narayana Varma",
        "brothers": 1,
        "sisters": 0,
        "willing_to_relocate": True,
        "particulars": "B.Tech IT graduate. Working in a product company. Interests include reading, cooking and classical dance.",
        "requirement": "Prefer a well-settled groom, engineer or doctor. Hyderabad based preferred.",
        "matrimony_status": "VERIFIED_ACTIVE",
    },
    {
        "full_name": "Deepika Sundaram",
        "phone": "9100000005",
        "role": "NORMAL",
        "member_id": "TST-NID-003",
        "gender": "FEMALE",
        "age": 25,
        "dob": "2000-02-14",
        "tob": "11:30:00",
        "gotram": "Vishwamitra",
        "star_with_pada": "Ashwini - 4",
        "place_of_birth": "Tirupati",
        "current_city": "Hyderabad",
        "occupation": "Teacher",
        "annual_income": "5 LPA",
        "father_guardian_name": "Sundaram",
        "brothers": 0,
        "sisters": 2,
        "willing_to_relocate": False,
        "particulars": "B.Ed graduate. Teaching at a private school. Simple, homely and family oriented.",
        "requirement": "Looking for a government employee or private sector professional. Should be Niyogi Brahmin.",
        "matrimony_status": "VERIFIED_EXPIRED",  # approved then backdated — tests renewal flow
    },
    {
        "full_name": "Kavitha Ramana Devi",
        "phone": "9100000006",
        "role": "ASSOCIATED",
        "member_id": "TST-AID-001",
        "gender": "FEMALE",
        "age": 24,
        "dob": "2001-09-05",
        "tob": "05:00:00",
        "gotram": "Angirasa",
        "star_with_pada": "Mrigashira - 1",
        "place_of_birth": "Nellore",
        "current_city": "Bangalore",
        "occupation": "MBA Student",
        "annual_income": "N/A",
        "father_guardian_name": "Ramana Murthy",
        "brothers": 1,
        "sisters": 1,
        "willing_to_relocate": True,
        "sub_sect": "Yes",
        "sect_no": "No",
        "particulars": "Final year MBA. Belongs to a respected Associated family. Interests include music and painting.",
        "requirement": "Looking for a well-educated groom from a good Niyogi family. Open to location.",
        "matrimony_status": "VERIFIED_ACTIVE",
    },

    # ── Additional females for login testing ──────────────────────────────────
    {
        "full_name": "Sravani Kota",
        "phone": "9100000007",
        "role": "NORMAL",
        "member_id": "TST-NID-004",
        "gender": "FEMALE",
        "age": 26,
        "dob": "1999-04-12",
        "tob": "08:20:00",
        "gotram": "Bharadwaja",
        "star_with_pada": "Punarvasu - 3",
        "place_of_birth": "Vijayawada",
        "current_city": "Hyderabad",
        "occupation": "Chartered Accountant",
        "annual_income": "10 LPA",
        "father_guardian_name": "Ranga Rao Kota",
        "brothers": 1,
        "sisters": 0,
        "willing_to_relocate": True,
        "particulars": "CA qualified. Working with a leading audit firm. Traditional values, modern outlook. Enjoys classical dance and cooking.",
        "requirement": "Looking for a well-settled professional. Engineer or CA preferred. Niyogi community.",
        "matrimony_status": "VERIFIED_ACTIVE",
    },
    {
        "full_name": "Mounika Tadepalli",
        "phone": "9100000008",
        "role": "NORMAL",
        "member_id": "TST-NID-005",
        "gender": "FEMALE",
        "age": 23,
        "dob": "2002-11-28",
        "tob": "13:45:00",
        "gotram": "Vasishta",
        "star_with_pada": "Sravana - 2",
        "place_of_birth": "Guntur",
        "current_city": "Bangalore",
        "occupation": "Software Engineer",
        "annual_income": "8 LPA",
        "father_guardian_name": "Siva Prasad Tadepalli",
        "brothers": 0,
        "sisters": 1,
        "willing_to_relocate": False,
        "particulars": "B.Tech CSE from JNTU. Working in Bangalore. Interests include yoga, painting and reading. Homely and family oriented.",
        "requirement": "Prefer a software professional or government employee based in Bangalore or Hyderabad.",
        "matrimony_status": "VERIFIED_ACTIVE",
    },
    {
        "full_name": "Anitha Veluri",
        "phone": "9100000009",
        "role": "PERMANENT",
        "member_id": "TST-PID-003",
        "gender": "FEMALE",
        "age": 29,
        "dob": "1996-07-03",
        "tob": "06:00:00",
        "gotram": "Kashyapa",
        "star_with_pada": "Rohini - 4",
        "place_of_birth": "Rajahmundry",
        "current_city": "Hyderabad",
        "occupation": "Doctor (MD)",
        "annual_income": "20 LPA",
        "father_guardian_name": "Nageswara Rao Veluri",
        "brothers": 1,
        "sisters": 1,
        "willing_to_relocate": True,
        "particulars": "MD graduate. Practicing at a private hospital. Belongs to a well-known Niyogi family from Rajahmundry. Interests include music and travel.",
        "requirement": "Prefer a doctor or highly qualified professional. Good family background essential.",
        "matrimony_status": "VERIFIED_ACTIVE",
    },
    {
        "full_name": "Bhavana Chilakalapudi",
        "phone": "9100000010",
        "role": "ASSOCIATED",
        "member_id": "TST-AID-002",
        "gender": "FEMALE",
        "age": 22,
        "dob": "2003-03-17",
        "tob": "10:10:00",
        "gotram": "Atri",
        "star_with_pada": "Hasta - 1",
        "place_of_birth": "Tenali",
        "current_city": "Vijayawada",
        "occupation": "B.Tech Student",
        "annual_income": "N/A",
        "father_guardian_name": "Subrahmanyam Chilakalapudi",
        "brothers": 2,
        "sisters": 0,
        "willing_to_relocate": True,
        "sub_sect": "No",
        "sect_no": "Yes",
        "particulars": "Final year B.Tech student. Belongs to the Brahmin community. Simple, traditional and family oriented. Interests include classical music.",
        "requirement": "Looking for a kind, well-educated groom with good family values.",
        "matrimony_status": "VERIFIED_ACTIVE",
    },
]

PHOTO_URL = "https://placehold.co/400x400/e2e8f0/64748b.jpg?text=Test+Profile"

# ─────────────────────────────────────────────────────────────────────────────

def _hash(pin: str) -> str:
    return bcrypt.hashpw(pin.encode(), bcrypt.gensalt()).decode()

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

def _expires_1yr() -> str:
    return (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()

def _h(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Supabase direct helpers ───────────────────────────────────────────────────

def _supabase_client():
    try:
        from supabase import create_client
    except ImportError:
        print("  ✗ supabase package not found. Run: pip install supabase")
        sys.exit(1)
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("  ✗ SUPABASE_URL / SUPABASE_SERVICE_KEY not set in backend/.env")
        sys.exit(1)
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def upsert_user(sb, member: dict) -> str | None:
    """
    Insert (or fix up) a test user with TST- member_id. Returns user_id or None.
    If a user with this phone already exists (e.g. from a previous API-created run
    with a real PID/NID ID), we patch their member_id to the TST- value so the
    teardown SQL can reliably target them.
    """
    phone = member["phone"]
    mid   = member["member_id"]
    role  = member["role"]

    # 1. Already has the TST- member_id → nothing to do
    by_mid = sb.table("users").select("id").eq("member_id", mid).execute()
    if by_mid.data:
        return by_mid.data[0]["id"]

    # 2. Exists by phone but with a different member_id → patch it to TST-
    by_phone = sb.table("users").select("id, member_id").eq("phone", phone).execute()
    if by_phone.data:
        user_id = by_phone.data[0]["id"]
        sb.table("users").update({
            "member_id":  mid,
            "role":       role,
            "status":     "ACTIVE",
            "full_name":  member["full_name"],
            "updated_at": _now(),
        }).eq("id", user_id).execute()
        return user_id

    # 3. Brand new user — insert
    row = {
        "identifier":  phone,
        "phone":        phone,
        "pin_hash":     _hash(TEST_PIN),
        "full_name":    member["full_name"],
        "role":         role,
        "status":       "ACTIVE",
        "member_id":    mid,
        "updated_at":   _now(),
        "joined_at":    _now(),
    }
    if role not in ("PERMANENT", "HEAD"):
        row["membership_expires_at"] = _expires_1yr()

    result = sb.table("users").insert(row).execute()
    if not result.data:
        return None

    user_id = result.data[0]["id"]
    sb.table("membership_requests").insert({
        "user_id":          user_id,
        "requested_role":   role,
        "application_data": {"full_name": member["full_name"], "phone": phone},
        "payment_status":   "PAID",
        "approval_status":  "APPROVED",
        "admin_notes":      f"Test data — TST member_id={mid}",
    }).execute()

    return user_id


def backdate_subscription(sb, phone: str):
    """Set subscription_expires_at 3 days in the past for expired-sub test."""
    past = (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
    sb.table("matrimony_profiles").update(
        {"subscription_expires_at": past}
    ).eq("user_id",
        sb.table("users").select("id").eq("phone", phone).execute().data[0]["id"]
    ).execute()


# ── API helpers ───────────────────────────────────────────────────────────────

def login(phone: str, pin: str) -> str | None:
    resp = requests.post(f"{BASE_URL}/auth/verify-pin", json={"identifier": phone, "pin": pin})
    if resp.status_code == 200:
        return resp.json().get("access_token")
    print(f"    ✗ Login failed for {phone}: {resp.text}")
    return None


def register_matrimony(token: str, member: dict) -> str | None:
    payload = {
        "full_name":            member["full_name"],
        "gender":               member["gender"],
        "age":                  member["age"],
        "dob":                  member["dob"],
        "tob":                  member["tob"],
        "gotram":               member.get("gotram"),
        "star_with_pada":       member.get("star_with_pada"),
        "place_of_birth":       member.get("place_of_birth"),
        "current_city":         member.get("current_city"),
        "occupation":           member.get("occupation"),
        "annual_income":        member.get("annual_income"),
        "father_guardian_name": member.get("father_guardian_name"),
        "brothers":             member.get("brothers"),
        "sisters":              member.get("sisters"),
        "willing_to_relocate":  member.get("willing_to_relocate"),
        "particulars":          member.get("particulars"),
        "requirement":          member.get("requirement"),
        "sub_sect":             member.get("sub_sect"),
        "sect_no":              member.get("sect_no"),
        "contact_no":           member["phone"],
        "photos":               [PHOTO_URL],
        "payment_reference":    f"TST-UTR-{member['member_id']}",
    }
    resp = requests.post(f"{BASE_URL}/matrimony/register", json=payload, headers=_h(token))
    if resp.status_code == 200:
        return resp.json().get("profile_id")
    print(f"    ✗ matrimony/register failed: {resp.text}")
    return None


def admin_approve_matrimony(admin_token: str, profile_id: str) -> bool:
    resp = requests.post(
        f"{BASE_URL}/admin/matrimony-approve",
        json={"profile_id": profile_id, "action": "APPROVE"},
        headers=_h(admin_token),
    )
    return resp.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────

def run_seed(profiles_only: bool = False):
    print("=" * 65)
    print("  Aaruvela — Matrimony Test Data Seed  (TST- IDs)")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    if profiles_only:
        print("  Mode: --profiles-only")
    print("=" * 65)

    sb = _supabase_client()

    # ── Step 1: Admin login ───────────────────────────────────────────────────
    print("\n  [1/4] Admin login...")
    admin_token = login(ADMIN_PHONE, ADMIN_PIN)
    if not admin_token:
        print("  ✗ Cannot continue without admin token.")
        sys.exit(1)
    print("  ✓ Admin authenticated")

    results      = []
    member_tokens = {}

    # ── Step 2: Upsert users via Supabase (TST- IDs, no API counter bump) ────
    print("\n  [2/4] Upserting test users directly (TST- member IDs)...\n")

    for m in TEST_MEMBERS:
        name  = m["full_name"]
        phone = m["phone"]
        mid   = m["member_id"]
        role  = m["role"]
        print(f"    → {name}  ({role})  {mid}  {phone}")

        if profiles_only:
            # Just verify the user exists
            check = sb.table("users").select("id").eq("member_id", mid).execute()
            if not check.data:
                print(f"      ✗ Not found — run without --profiles-only first")
                results.append({"name": name, "status": "NOT_FOUND"})
                continue
            print(f"      ~ Already exists")
        else:
            user_id = upsert_user(sb, m)
            if not user_id:
                print(f"      ✗ Insert failed")
                results.append({"name": name, "status": "INSERT_FAILED"})
                continue
            print(f"      ✓ Upserted  user_id={user_id[:8]}...")

        token = login(phone, TEST_PIN)
        if token:
            member_tokens[phone] = token
            print(f"      ✓ Logged in")
        else:
            print(f"      ✗ Login failed — matrimony step will be skipped")
            results.append({"name": name, "status": "LOGIN_FAILED"})

    # ── Step 3: Submit matrimony profiles via API ─────────────────────────────
    print("\n  [3/4] Submitting matrimony profiles via API...\n")
    profile_ids = {}

    for m in TEST_MEMBERS:
        phone = m["phone"]
        name  = m["full_name"]
        token = member_tokens.get(phone)
        if not token:
            continue

        # Check if profile already exists (idempotent)
        my_resp = requests.get(f"{BASE_URL}/matrimony/me", headers=_h(token))
        if my_resp.status_code == 200 and my_resp.json():
            existing_pid = my_resp.json().get("id")
            profile_ids[phone] = existing_pid
            print(f"    ~ {name} — profile already exists  id={existing_pid[:8]}...")
            continue

        print(f"    → {name}")
        pid = register_matrimony(token, m)
        if pid:
            profile_ids[phone] = pid
            print(f"      ✓ Submitted  id={pid[:8]}...")
        else:
            print(f"      ✗ Failed")
            results.append({"name": name, "status": "MATRIMONY_FAILED"})

    # ── Step 4: Admin approves / backdates ────────────────────────────────────
    print("\n  [4/4] Approving profiles...\n")

    for m in TEST_MEMBERS:
        phone  = m["phone"]
        name   = m["full_name"]
        mid    = m["member_id"]
        mstatus = m["matrimony_status"]
        pid    = profile_ids.get(phone)

        if not pid:
            continue

        if mstatus == "PENDING":
            print(f"    ⏳ {name} ({mid}) — left as PENDING")
            results.append({"name": name, "member_id": mid, "phone": phone, "profile_id": pid, "status": "PENDING"})
            continue

        ok = admin_approve_matrimony(admin_token, pid)
        if not ok:
            print(f"    ✗ {name} ({mid}) — approval API failed")
            results.append({"name": name, "member_id": mid, "phone": phone, "status": "APPROVE_FAILED"})
            continue

        if mstatus == "VERIFIED_EXPIRED":
            backdate_subscription(sb, phone)
            print(f"    ✓ {name} ({mid}) — VERIFIED, subscription backdated 3 days (tests renewal)")
            results.append({"name": name, "member_id": mid, "phone": phone, "profile_id": pid, "status": "VERIFIED_EXPIRED"})
        else:
            print(f"    ✓ {name} ({mid}) — VERIFIED + active subscription")
            results.append({"name": name, "member_id": mid, "phone": phone, "profile_id": pid, "status": "VERIFIED_ACTIVE"})

    # ── Summary ───────────────────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("  SUMMARY")
    print("=" * 65)
    print(f"  {'Name':<26} {'Member ID':<12} {'Phone':<14} {'Matrimony'}")
    print(f"  {'-'*26} {'-'*12} {'-'*14} {'-'*20}")
    for r in results:
        print(f"  {r.get('name','?'):<26} {r.get('member_id',''):<12} {r.get('phone',''):<14} {r.get('status','')}")

    print("""
  LOGIN — all test accounts use PIN: 1234
  ────────────────────────────────────────────────────────────
  MALES
  9100000001  TST-PID-001  Arjun Dev Sharma        VERIFIED + active sub
  9100000002  TST-NID-001  Venkat Prasad Rao       VERIFIED + active sub
  9100000003  TST-NID-002  Suresh Kumar Iyer       PENDING (unverified)

  FEMALES
  9100000004  TST-PID-002  Priya Lakshmi Varma     VERIFIED + active sub
  9100000005  TST-NID-003  Deepika Sundaram        VERIFIED + EXPIRED sub
  9100000006  TST-AID-001  Kavitha Ramana Devi     VERIFIED + active sub (Brahmin)
  9100000007  TST-NID-004  Sravani Kota            VERIFIED + active sub
  9100000008  TST-NID-005  Mounika Tadepalli       VERIFIED + active sub
  9100000009  TST-PID-003  Anitha Veluri           VERIFIED + active sub
  9100000010  TST-AID-002  Bhavana Chilakalapudi   VERIFIED + active sub (Brahmin)

  To remove all test data:
    python scripts/seed_test_matrimony.py --teardown
    (copy the printed SQL → Supabase SQL Editor → Run)
""")


def run_teardown():
    phones = [m["phone"]     for m in TEST_MEMBERS]
    mids   = [m["member_id"] for m in TEST_MEMBERS]
    phone_list = ", ".join(f"'{p}'" for p in phones)
    mid_list   = ", ".join(f"'{m}'" for m in mids)

    print("=" * 65)
    print("  Teardown SQL — paste into Supabase SQL Editor and run")
    print("=" * 65)
    print(f"""
-- 1. Matrimony profiles
DELETE FROM public.matrimony_profiles
WHERE user_id IN (
    SELECT id FROM public.users WHERE member_id IN ({mid_list})
);

-- 2. Membership requests
DELETE FROM public.membership_requests
WHERE user_id IN (
    SELECT id FROM public.users WHERE member_id IN ({mid_list})
);

-- 3. Payments
DELETE FROM public.payments
WHERE user_id IN (
    SELECT id FROM public.users WHERE member_id IN ({mid_list})
);

-- 4. Users  (TST- member IDs are safe to target — never assigned to real members)
DELETE FROM public.users WHERE member_id IN ({mid_list});
""")


# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Aaruvela matrimony test data seed")
    parser.add_argument("--teardown",      action="store_true",
                        help="Print teardown SQL instead of seeding")
    parser.add_argument("--profiles-only", action="store_true",
                        help="Skip user creation, only submit + approve profiles")
    args = parser.parse_args()

    if args.teardown:
        run_teardown()
    else:
        run_seed(profiles_only=args.profiles_only)
