import requests
import json

# Clean database first
print("Cleaning database...")
from app.db import get_supabase_client
client = get_supabase_client()
for u in client.auth.admin.list_users():
    client.auth.admin.delete_user(u.id)
client.table('users').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
print("✓ Database cleaned\n")

# Test registration
print("=== Testing Registration ===")
response = requests.post(
    'http://127.0.0.1:8000/auth/register',
    json={
        'phone': '9876543210',
        'pin': '1234',
        'full_name': 'Test User'
    }
)
print(f"Status: {response.status_code}")
data = response.json()
print(json.dumps(data, indent=2))

if response.status_code == 200:
    print("\n✓ Registration successful!")
    token = data['access_token']
    
    # Test login
    print("\n=== Testing Login ===")
    response2 = requests.post(
        'http://127.0.0.1:8000/auth/login',
        json={
            'phone': '9876543210',
            'pin': '1234'
        }
    )
    print(f"Status: {response2.status_code}")
    print(json.dumps(response2.json(), indent=2))
    
    if response2.status_code == 200:
        print("\n✓ Login successful!")
        print("\n🎉 PIN-ONLY AUTHENTICATION WORKING PERFECTLY!")
    else:
        print("\n✗ Login failed")
else:
    print("\n✗ Registration failed")
