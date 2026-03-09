import requests
import json

API_BASE = "http://localhost:8005"

def test_login(email, password):
    print(f"Testing login for {email}...")
    try:
        resp = requests.post(f"{API_BASE}/api/auth/login", json={"email": email, "password": password})
        print(f"Status Code: {resp.status_code}")
        print(f"Response: {resp.text}")
        return resp.status_code == 200
    except Exception as e:
        print(f"Error connecting to API: {e}")
        return False

if __name__ == "__main__":
    # Test common passwords
    passwords = ["password123", "123456", "admin123"]
    for pwd in passwords:
        if test_login("alex@gmail.com", pwd):
            print(f"SUCCESS: Login worked with password '{pwd}'")
            break
        else:
            print(f"FAILED: Login failed with password '{pwd}'")
        print("-" * 30)
