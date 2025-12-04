import requests

url = "http://localhost:8000/auth/register"

payload = {
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "student_id": "123456",
    "major": "Computer Science"
}

files = [
    ('file', ('dummy.jpg', open('dummy.jpg', 'rb'), 'image/jpeg'))
]

try:
    response = requests.post(url, data=payload, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Full Response: {response.text}")
    if response.status_code == 200:
        print("✅ Registration successful!")
        print(f"User Data: {response.json()}")
except Exception as e:
    print(f"Request failed: {e}")
