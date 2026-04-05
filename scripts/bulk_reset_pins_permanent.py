import openpyxl
import re
import asyncio
import logging
import os
from datetime import datetime, timezone

# Add backend directory to path if needed for imports
import sys
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend'))
if backend_path not in sys.path:
    sys.path.append(backend_path)

from app.db import get_supabase_client, run_query
from app.auth.utils import hash_pin

# Configure logging
logging.basicConfig(level=logging.INFO)

EXCEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../Members List.xlsx'))

def clean_phone(phone):
    if not phone:
        return None
    digits = re.sub(r"\D", "", str(phone))
    # Take last 10 digits
    digits = digits[-10:] if len(digits) >= 10 else digits
    return digits if len(digits) == 10 else None

def read_permanent_sheet(ws):
    members = []
    print(f"Reading rows from '{ws.title}'...")
    # Skipping header row 1
    for row in ws.iter_rows(min_row=2, values_only=True):
        if len(row) < 8:
            continue
        # Headers: SL. No., Name, F/W/o, Gender, Gotram, DOB, Address, Cell No
        phone_val = row[7] # Cell No is the 8th column
        name_val = row[1]  # Name is 2nd column
        
        phone = clean_phone(phone_val)
        if phone:
            members.append({
                "name": str(name_val).strip() if name_val else "Unknown",
                "phone": phone
            })
    return members

async def main():
    print("=" * 60)
    print("  Bulk PIN Reset — Permanent Sheet")
    print("=" * 60)
    
    # Load Excel
    try:
        wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
        ws = wb["Permanent"]
    except Exception as e:
        print(f"✗ Error loading Excel file at {EXCEL_PATH}: {e}")
        return

    members = read_permanent_sheet(ws)
    print(f"Loaded {len(members)} unique/valid phone numbers from sheet.")
    
    if not members:
        print("No valid members found to update.")
        return

    # Initialize Supabase
    supabase = get_supabase_client()
    new_hash = hash_pin("2244")
    print(f"Target Hashed PIN: {new_hash}\n")

    success_count = 0
    fail_count = 0
    not_found_count = 0
    processed_phones = set()

    print("Starting updates...")
    for i, member in enumerate(members, 1):
        phone = member["phone"]
        name = member["name"]
        
        if phone in processed_phones:
            continue
        processed_phones.add(phone)

        try:
            # Update user PIN and reset failures
            result = await run_query(
                lambda: supabase.table("users")
                .update({
                    "pin_hash": new_hash,
                    "failed_login_attempts": 0,
                    "locked_until": None
                })
                .eq("identifier", phone)
                .execute()
            )
            
            if result.data:
                print(f"  [{i:>3}] ✓ Updated {phone} ({name})")
                success_count += 1
            else:
                print(f"  [{i:>3}] ⚠ Not Found {phone} ({name})")
                not_found_count += 1
                
        except Exception as e:
            print(f"  [{i:>3}] ✗ Failed {phone} — {e}")
            fail_count += 1

    print("\n" + "=" * 60)
    print("  SUMMARY")
    print(f"  Total Rows Loaded : {len(members)}")
    print(f"  Updated Successfully: {success_count}")
    print(f"  Not Found (Skipped): {not_found_count}")
    print(f"  Failed (Errors)     : {fail_count}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
