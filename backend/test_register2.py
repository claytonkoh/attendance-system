import requests
import json

url = "http://localhost:8000/auth/register"

payload = {
    "name": "Test User",
    "email": "testuser999@example.com",  # Changed email
    "password": "password123",
    "student_id": "999999",
    "major": "Computer Science"
}

files = [
    ('file', ('dummy.jpg', open('dummy.jpg', 'rb'), 'image/jpeg'))
]

try:
    response = requests.post(url, data=payload, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"\nFull Response Text:")
    print(response.text)
    print(f"\n Response length: {len(response.text)} chars")
    
    if response.status_code == 200:
        print("\n✅ Registration successful!")
        print(f"User Data: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"\n❌ Registration failed")
        try:
            error_detail = response.json()
            print(f"Error detail: {error_detail}")
        except:
            pass
except Exception as e:
    print(f"Request failed: {e}")
    import traceback
    traceback.print_exc()
