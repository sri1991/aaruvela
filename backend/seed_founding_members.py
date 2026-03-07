"""
Seed script to create founding permanent members with PIN 2244.
Run from backend/ directory:
    python seed_founding_members.py
"""
import asyncio
import bcrypt
from datetime import datetime, timezone
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
DEFAULT_PIN = "2244"

# ── Founding members ─────────────────────────────────────────────────────────
FOUNDING_MEMBERS = [
    { "full_name": "Vadrevu Venkata Satya Narasimha Venugopala Rao", "phone": "9849476726", "photo_url": "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/venugopal.jpeg" },
    { "full_name": "Chiruvolu Srinivasarao",                          "phone": "9885063577", "photo_url": "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/ChSrinivasarao.jpeg" },
    { "full_name": "Chayanam Srinivasa Murthy",                       "phone": "9440326363", "photo_url": "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Chayanam.jpeg" },
    { "full_name": "Kunderu Kanubabu",                                "phone": "8309874005", "photo_url": "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/kanubabu.jpeg" },
    { "full_name": "Vadrevu Sarabharaju",                             "phone": "9866103483", "photo_url": "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Sarabharaju.jpeg" },
    { "full_name": "Nadakuditi Sreeramachandra Murthy",               "phone": "9848645899", "photo_url": "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Nadakuditi.jpeg" },
    { "full_name": "Nerella Gnana Satya Venkatanarayana",             "phone": "9848747447", "photo_url": "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Nerella.jpeg" },
    { "full_name": "Vadrevu Srinivas",                                "phone": "7997459859", "photo_url": "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Vadrevu%20Srinivas.jpeg" },
    { "full_name": "Ventrapragada Venugopalarao",                     "phone": "9440097872", "photo_url": "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Ventrapragada.jpeg" },
    { "full_name": "Koochimanchi Sasidhara Sriram",                   "phone": "9246832468", "photo_url": "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Kuchimanchi.jpeg" },
]
# ─────────────────────────────────────────────────────────────────────────────


def hash_pin(pin: str) -> str:
    return bcrypt.hashpw(pin.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def main():
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
        return

    if not FOUNDING_MEMBERS:
        print("ERROR: FOUNDING_MEMBERS list is empty. Please fill it in before running.")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    hashed_pin = hash_pin(DEFAULT_PIN)

    # Count existing PERMANENT members to start member IDs from correct offset
    existing = supabase.table("users").select("id", count="exact").eq("role", "PERMANENT").execute()
    start_count = existing.count or 0

    created = []
    skipped = []

    for i, member in enumerate(FOUNDING_MEMBERS):
        phone = "".join(filter(str.isdigit, member["phone"]))

        # Check if user already exists
        check = supabase.table("users").select("id").eq("phone", phone).execute()
        if check.data:
            skipped.append(phone)
            print(f"  SKIP  {member['full_name']} ({phone}) — already exists")
            continue

        member_id = f"PID-{start_count + len(created) + 1:03d}"

        row = {
            "identifier": phone,
            "phone": phone,
            "pin_hash": hashed_pin,
            "full_name": member["full_name"],
            "role": "PERMANENT",
            "status": "ACTIVE",
            "member_id": member_id,
            "photo_url": member.get("photo_url", ""),
            "zonal_committee": member.get("zonal_committee", ""),
            "regional_committee": member.get("regional_committee", ""),
            "updated_at": now_utc(),
        }

        result = supabase.table("users").insert(row).execute()
        if result.data:
            uid = result.data[0]["id"]
            # Audit record
            supabase.table("membership_requests").insert({
                "user_id": uid,
                "requested_role": "PERMANENT",
                "application_data": {"full_name": member["full_name"], "phone": phone},
                "payment_status": "PAID",
                "approval_status": "APPROVED",
                "admin_notes": "Founding member — seeded directly",
            }).execute()
            created.append(member_id)
            print(f"  OK    {member['full_name']} → {member_id}")
        else:
            print(f"  FAIL  {member['full_name']} ({phone})")

    print(f"\nDone. Created: {len(created)}, Skipped: {len(skipped)}")
    print("All founding members can log in with their phone number and PIN: 2244")
    print("They can update their profile from the Member Dashboard after logging in.")


if __name__ == "__main__":
    main()
