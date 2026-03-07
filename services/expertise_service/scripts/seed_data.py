
import requests
import json
from datetime import datetime, timedelta

API_BASE = "http://localhost:8000"

def seed_developer_data():
    developers = [
        {
            "email": "harini@gmail.com",
            "name": "Harini",
            "expertise": {"API": 0.9, "Database": 0.7, "UI": 0.3,"Authentication": 0, "DevOps": 0, "Documentation": 0.5, "Performance": 0.6, "Security": 0.8, "Testing": 0.7},
            "jiraIssuesSolved": {"API": 12, "Database": 8, "UI": 2,"Authentication": 0, "DevOps": 0, "Documentation": 25, "Performance": 66, "Security": 48, "Testing": 17},
            "githubCommits": {"API": 45, "Database": 20, "UI": 5,"Authentication": 9, "DevOps": 7, "Documentation": 55, "Performance": 46, "Security": 38, "Testing": 27},
            "preferences": {"API": 1.0, "Database": 0.8, "UI": 0.2, "Authentication": 0.9, "DevOps": 0.7, "Documentation": 0.5, "Performance": 0.6, "Security": 0.8, "Testing": 0.7},
            "workHistory": [
                {"source": "jira", "text": "Optimized REST API pagination for user lists", "category": "API", "createdAt": (datetime.now() - timedelta(days=10)).isoformat()},
                {"source": "github", "text": "Refactored MongoDB connection pooling logic", "category": "Database", "createdAt": (datetime.now() - timedelta(days=5)).isoformat()}
            ],
            "pendingIssues": {
                "API": [
                    {"id": "ISSUE-PRE-1", "title": "API bug in login", "description": "Login fails sometimes", "category": "API", "status": "pending"}
                ]
            }
        },
        {
            "email": "mark@gmail.com",
            "name": "mark",
            "expertise": {"API": 0.9, "Database": 0.7, "UI": 0.3},
            "jiraIssuesSolved": {"API": 12, "Database": 8, "UI": 2,"Authentication": 10,"Authentication": 9, "DevOps": 7, "Documentation": 5, "Performance": 6, "Security": 20, "Testing": 15.},
            "githubCommits": {"API": 45, "Database": 20, "UI": 5,"Authentication": 49, "DevOps": 57, "Documentation": 35, "Performance": 16, "Security": 38, "Testing": 47},
            "preferences": {"API": 1.0, "Database": 0.8, "UI": 0.2, "Authentication": 0.9, "DevOps": 0.7, "Documentation": 0.5, "Performance": 0.6, "Security": 0.8, "Testing": 0.7},
            "workHistory": [
                {"source": "jira", "text": "Optimized REST API pagination for user lists", "category": "API", "createdAt": (datetime.now() - timedelta(days=10)).isoformat()},
                {"source": "github", "text": "Refactored MongoDB connection pooling logic", "category": "Database", "createdAt": (datetime.now() - timedelta(days=5)).isoformat()}
            ],
            "pendingIssues": {
                "API": [
                    {"id": "ISSUE-PRE-1", "title": "API bug in login", "description": "Login fails sometimes", "category": "API", "status": "pending"}
                ]
            }
        },
        {
            "email": "alex@gmail.com",
            "name": "Alex",
            "expertise": {"UI": 0.85, "API": 0.4, "Database": 0.2,"Authentication": 0.9, "DevOps": 0.7, "Documentation": 0.5, "Performance": 0.6, "Security": 0.1, "Testing": 0.1},
            "jiraIssuesSolved": {"UI": 15, "API": 3, "Database": 1,"Authentication": 19, "DevOps": 7, "Documentation": 25, "Performance": 6, "Security": 0, "Testing": 0},
            "githubCommits": {"UI": 60, "API": 10, "Database": 20,"Authentication": 30, "DevOps": 70, "Documentation": 50, "Performance": 6, "Security": 8, "Testing": 7},
            "preferences": {"UI": 0.9, "API": 0.5, "Database": 0.1, "Authentication": 0.3, "DevOps": 0.2, "Documentation": 0.8, "Performance": 0.4, "Security": 0.3, "Testing": 0.5},
            "workHistory": [
                {"source": "jira", "text": "Implemented new glassmorphism dashboard theme", "category": "UI", "createdAt": (datetime.now() - timedelta(days=2)).isoformat()},
                {"source": "github", "text": "Fixed responsive navigation bug on mobile", "category": "UI", "createdAt": (datetime.now() - timedelta(days=1)).isoformat()}
            ]
        },
        {
            "email": "tom@gmail.com",
            "name": "Tom",
            "expertise": {"UI": 0.1, "API": 0.1, "Database": 0.1,"Authentication": 0.9, "DevOps": 0.7, "Documentation": 0.1, "Performance": 0.1, "Security": 0.8, "Testing": 0.7},
            "jiraIssuesSolved": {"UI": 10, "API": 20, "Database": 12 , "Authentication": 9, "DevOps": 7, "Documentation": 0, "Performance": 10, "Security": 8, "Testing": 7},
            "githubCommits": {"UI": 70, "API": 75, "Database": 20,"Authentication": 29, "DevOps": 37, "Documentation": 15, "Performance": 16, "Security": 38, "Testing": 47},
            "preferences": {"UI": 1.0, "API": 0.1, "Database": 0.1, "Authentication": 0.1, "DevOps": 0.1, "Documentation": 0.1, "Performance": 0.1, "Security": 0.1, "Testing": 0.1},
            "workHistory": []
        }
    ]

    print("Seeding Developer Data...")
    
    # First ensure these users are registered (so they exist in the 'users' collection too)
    for dev in developers:
        reg_payload = {
            "email": dev["email"],
            "name": dev["name"],
            "password": "password123",
            "role": "manager" if "Admin" in dev["name"] else "developer"
        }
        requests.post(f"{API_BASE}/api/auth/register", json=reg_payload)
        
        # Now update/create the developer profile directly via the expertise endpoints
        profile_payload = {
            "email": dev["email"],
            "name": dev["name"],
            "expertise": dev["expertise"],
            "jiraIssuesSolved": dev["jiraIssuesSolved"],
            "githubCommits": dev["githubCommits"],
            "preferences": dev.get("preferences", {}),
            "workHistory": dev.get("workHistory", []),
            "pendingIssues": dev.get("pendingIssues", {})
        }
        
        print(f"Updating profile for: {dev['email']}")
        resp = requests.post(f"{API_BASE}/api/expertise/developers", json=profile_payload)
        if resp.status_code == 200:
            print(f"Successfully seeded {dev['email']}")
        else:
            print(f"Failed to seed {dev['email']}: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    seed_developer_data()
