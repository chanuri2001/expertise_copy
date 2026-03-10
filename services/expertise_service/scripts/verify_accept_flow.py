
import requests
import json
import time

API_BASE = "http://127.0.0.1:8005"

def test_accept_flow():
    # 1. Create an issue
    issue_payload = {
        "title": "Verification Issue for Accept Flow",
        "description": "testing 123",
        "submittedBy": "natty@gmail.com",
        "submittedByName": "Natty PM",
        "priority": "medium"
    }
    res = requests.post(f"{API_BASE}/api/expertise/issues", json=issue_payload)
    issue = res.json()
    issue_id = issue['id']
    print(f"Created issue: {issue_id}, Status: {issue['status']}")

    # 2. Assign to Alex
    assign_payload = {
        "issueId": issue_id,
        "developerEmail": "alex@company.com",
        "developerName": "Alex"
    }
    # Note: Requires manager role, but we use internal seeded data for simplicity 
    # or just assume the env/mocking works if needed. 
    # Since we are testing live API, let's use the actual endpoint.
    requests.post(f"{API_BASE}/api/expertise/issues/assign", json=assign_payload)
    
    # Check assigned status
    res = requests.get(f"{API_BASE}/api/expertise/issues/{issue_id}")
    issue = res.json()
    print(f"Assigned issue status: {issue['status']}, Assigned to: {issue['assignedTo']}")

    # 3. Accept the mission
    params = {"developerEmail": "alex@company.com"}
    res = requests.post(f"{API_BASE}/api/expertise/issues/{issue_id}/accept", params=params)
    print(f"Accept Response Code: {res.status_code}")
    
    # 4. Verify final status
    res = requests.get(f"{API_BASE}/api/expertise/issues/{issue_id}")
    issue = res.json()
    print(f"Final issue status: {issue['status']}")
    
    # 5. Verify in Alex's profile (Wait a bit for DB sync)
    time.sleep(1)
    res = requests.get(f"{API_BASE}/api/expertise/developers/alex@company.com/detail")
    print(f"Profile Fetch Status: {res.status_code}")
    if res.status_code != 200:
        print(f"Error Response: {res.text}")
        print("\nVERIFICATION FAILED")
        return

    profile_data = res.json()
    if 'pendingIssuesByCategory' not in profile_data:
        print(f"Keys in profile_data: {list(profile_data.keys())}")
        print("\nVERIFICATION FAILED (Key mismatch)")
        return

    pending = profile_data['pendingIssuesByCategory'].get(issue['category'], [])
    found = False
    for p in pending:
        if p['id'] == issue_id:
            print(f"Status in Developer Profile: {p['status']}")
            found = True
            break
    
    if issue['status'] == 'in_progress' and found:
        print("\nVERIFICATION SUCCESSFUL")
    else:
        print(f"Final status: {issue['status']}, Found in profile: {found}")
        print("\nVERIFICATION FAILED")

if __name__ == "__main__":
    test_accept_flow()
