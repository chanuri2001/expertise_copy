
import requests
import json
import time

API_BASE = "http://localhost:8000"

def test_resolution_flow():
    print("Testing Resolution Flow with Notes...")
    
    # 1. Login or find a user
    # Assume admin@gmail.com is a manager
    login_data = {"email": "admin@gmail.com", "password": "password123"}
    resp = requests.post(f"{API_BASE}/api/auth/login", json=login_data)
    if resp.status_code != 200:
        print("Login failed, trying to register...")
        reg_data = {"email": "admin@gmail.com", "name": "Admin PM", "password": "password123", "role": "manager"}
        requests.post(f"{API_BASE}/api/auth/register", json=reg_data)
        resp = requests.post(f"{API_BASE}/api/auth/login", json=login_data)
    
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Create an issue
    issue_data = {
        "title": "Resolution Test Issue",
        "description": "Testing the new resolution note feature",
        "submittedBy": "user@example.com",
        "submittedByName": "Test Submitter",
        "priority": "high"
    }
    resp = requests.post(f"{API_BASE}/api/expertise/issues", json=issue_data, headers=headers)
    issue = resp.json()
    issue_id = issue["id"]
    print(f"Created issue: {issue_id}")
    
    # 3. Assign it to a developer
    # Ensure harini@gmail.com exists
    dev_data = {"email": "harini@gmail.com", "name": "Harini", "password": "password123", "role": "developer"}
    requests.post(f"{API_BASE}/api/auth/register", json=dev_data)
    
    assign_payload = {
        "issueId": issue_id,
        "developerEmail": "harini@gmail.com",
        "developerName": "Harini"
    }
    requests.post(f"{API_BASE}/api/expertise/issues/assign", json=assign_payload, headers=headers)
    print(f"Assigned issue {issue_id} to harini@gmail.com")
    
    # 4. Resolve it with a note
    note = "Fixed by optimizing the database indexing for the specific query."
    resolve_url = f"{API_BASE}/api/expertise/issues/{issue_id}/complete?developerEmail=harini@gmail.com&resolutionNote={note}"
    resp = requests.post(resolve_url, headers=headers)
    
    if resp.status_code == 200:
        updated_issue = resp.json()
        print(f"Successfully resolved issue. Status: {updated_issue['status']}")
        print(f"Resolution Note: {updated_issue.get('resolutionNote')}")
        
        if updated_issue.get('resolutionNote') == note:
            print("VERIFICATION SUCCESS: Resolution note stored correctly.")
        else:
            print("VERIFICATION FAILURE: Resolution note mismatch.")
    else:
        print(f"Failed to resolve issue: {resp.text}")

if __name__ == "__main__":
    test_resolution_flow()
