import requests
import json

# Test registration
print("Testing registration endpoint...")
response = requests.post(
    'http://127.0.0.1:8000/auth/register',
    json={
        'phone': '6666666666',
        'pin': '1234',
        'full_name': 'API Test User'
    }
)

print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 200:
    print("\n✓ Registration successful!")
    token = response.json()['access_token']
    print(f"Token: {token[:30]}...")
else:
    print(f"\n✗ Registration failed")
