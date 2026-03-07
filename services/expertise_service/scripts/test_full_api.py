import requests
import json
import time

API_BASE = "http://localhost:8000"

def test_full_flow():
    print(f"Testing full flow for natty@gmail.com on {API_BASE}...")
    
    # 1. Login
    login_data = {"email": "natty@gmail.com", "password": "password123"}
    try:
        resp = requests.post(f"{API_BASE}/api/auth/login", json=login_data, timeout=5)
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} - {resp.text}")
            return
        
        data = resp.json()
        token = data["access_token"]
        print("Login successful, token obtained.")
        
        # 2. Get Issues
        headers = {"Authorization": f"Bearer {token}"}
        print("Calling /api/expertise/issues...")
        start_time = time.time()
        resp = requests.get(f"{API_BASE}/api/expertise/issues", headers=headers, timeout=10)
        end_time = time.time()
        
        if resp.status_code == 200:
            issues = resp.json().get("issues", [])
            print(f"Success! Found {len(issues)} issues.")
            print(f"Request took {end_time - start_time:.2f} seconds.")
        else:
            print(f"Issues call failed: {resp.status_code} - {resp.text}")
            
    except requests.exceptions.Timeout:
        print("Error: Request timed out!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_full_flow()
