
import requests
import json
from datetime import datetime, timedelta

# Note: Using port 8005 as configured in the recent fix
API_BASE = "http://localhost:8005"

def add_custom_developers():
    developers = [
        {
            "email": "sarah@gmail.com",
            "name": "Sarah",
            "expertise": {
                "API": 0.95, "Authentication": 0.8, "Database": 0.9, 
                "DevOps": 0.6, "Documentation": 0.7, "Performance": 0.85, 
                "Security": 0.75, "Testing": 0.8, "UI": 0.2
            },
            "jiraIssuesSolved": {
                "API": 25, "Authentication": 10, "Database": 30, 
                "DevOps": 5, "Documentation": 15, "Performance": 20, 
                "Security": 12, "Testing": 18, "UI": 2
            },
            "githubCommits": {
                "API": 120, "Authentication": 40, "Database": 150, 
                "DevOps": 30, "Documentation": 60, "Performance": 80, 
                "Security": 45, "Testing": 70, "UI": 10
            },
            "githubPRs": {
                "API": 15, "Authentication": 5, "Database": 12, 
                "DevOps": 2, "Documentation": 8, "Performance": 6, 
                "Security": 4, "Testing": 10, "UI": 1
            },
            "githubReviews": {
                "API": 25, "Authentication": 10, "Database": 20, 
                "DevOps": 5, "Documentation": 12, "Performance": 15, 
                "Security": 8, "Testing": 14, "UI": 2
            },
            "preferences": {
                "API": 1.0, "Authentication": 0.7, "Database": 0.9, 
                "DevOps": 0.4, "Documentation": 0.5, "Performance": 0.8, 
                "Security": 0.6, "Testing": 0.5, "UI": 0.1
            },
            "workHistory": [
                {"source": "jira", "text": "Implemented advanced caching for SQL queries", "category": "Database", "createdAt": (datetime.now() - timedelta(days=20)).isoformat()},
                {"source": "github", "text": "Migrated auth system to OAuth2", "category": "Authentication", "createdAt": (datetime.now() - timedelta(days=15)).isoformat()},
                {"source": "manual", "text": "Designed high-throughput API gateway", "category": "API", "createdAt": (datetime.now() - timedelta(days=5)).isoformat()}
            ],
            "resolvedIssues": {
                "API": [
                    {
                        "id": "RES-101", "title": "API Rate Limiting", "description": "Added rate limiting to public endpoints", 
                        "category": "API", "priority": "high", "createdAt": (datetime.now() - timedelta(days=30)).isoformat(),
                        "resolvedAt": (datetime.now() - timedelta(days=28)).isoformat(), "resolutionNote": "Used Redis for state management."
                    }
                ],
                "Database": [
                    {
                        "id": "RES-102", "title": "Slow Query Optimization", "description": "Optimized transaction history lookup", 
                        "category": "Database", "priority": "critical", "createdAt": (datetime.now() - timedelta(days=12)).isoformat(),
                        "resolvedAt": (datetime.now() - timedelta(days=11)).isoformat(), "resolutionNote": "Added compound index on userId and date."
                    }
                ]
            }
        },
        {
            "email": "kevin@gmail.com",
            "name": "Kevin",
            "expertise": {
                "API": 0.3, "Authentication": 0.2, "Database": 0.1, 
                "DevOps": 0.3, "Documentation": 0.8, "Performance": 0.5, 
                "Security": 0.2, "Testing": 0.6, "UI": 0.98
            },
            "jiraIssuesSolved": {
                "API": 5, "Authentication": 2, "Database": 1, 
                "DevOps": 4, "Documentation": 20, "Performance": 15, 
                "Security": 3, "Testing": 12, "UI": 55
            },
            "githubCommits": {
                "API": 15, "Authentication": 5, "Database": 2, 
                "DevOps": 10, "Documentation": 45, "Performance": 30, 
                "Security": 8, "Testing": 40, "UI": 280
            },
            "githubPRs": {
                "API": 2, "Authentication": 1, "Database": 0, 
                "DevOps": 1, "Documentation": 10, "Performance": 5, 
                "Security": 1, "Testing": 8, "UI": 45
            },
            "githubReviews": {
                "API": 1, "Authentication": 0, "Database": 0, 
                "DevOps": 2, "Documentation": 5, "Performance": 8, 
                "Security": 1, "Testing": 6, "UI": 30
            },
            "preferences": {
                "API": 0.2, "Authentication": 0.2, "Database": 0.1, 
                "DevOps": 0.3, "Documentation": 0.6, "Performance": 0.7, 
                "Security": 0.2, "Testing": 0.4, "UI": 1.0
            },
            "workHistory": [
                {"source": "jira", "text": "Built a reusable component library for the new UI", "category": "UI", "createdAt": (datetime.now() - timedelta(days=25)).isoformat()},
                {"source": "github", "text": "Implemented dark mode support across all modules", "category": "UI", "createdAt": (datetime.now() - timedelta(days=10)).isoformat()}
            ],
            "resolvedIssues": {
                "UI": [
                    {
                        "id": "RES-201", "title": "Responsive Layout Refactor", "description": "Fixed layout breaks on tablet view", 
                        "category": "UI", "priority": "medium", "createdAt": (datetime.now() - timedelta(days=5)).isoformat(),
                        "resolvedAt": (datetime.now() - timedelta(days=4)).isoformat(), "resolutionNote": "Converted fixed widths to grid layouts."
                    }
                ]
            }
        },
        {
            "email": "elena@gmail.com",
            "name": "Elena",
            "expertise": {
                "API": 0.6, "Authentication": 0.95, "Database": 0.4, 
                "DevOps": 0.7, "Documentation": 0.6, "Performance": 0.5, 
                "Security": 0.92, "Testing": 0.8, "UI": 0.3
            },
            "jiraIssuesSolved": {
                "API": 10, "Authentication": 40, "Database": 8, 
                "DevOps": 15, "Documentation": 12, "Performance": 10, 
                "Security": 35, "Testing": 25, "UI": 5
            },
            "githubCommits": {
                "API": 25, "Authentication": 180, "Database": 15, 
                "DevOps": 40, "Documentation": 30, "Performance": 20, 
                "Security": 150, "Testing": 80, "UI": 15
            },
            "githubPRs": {
                "API": 5, "Authentication": 25, "Database": 2, 
                "DevOps": 8, "Documentation": 6, "Performance": 4, 
                "Security": 20, "Testing": 12, "UI": 2
            },
            "githubReviews": {
                "API": 8, "Authentication": 45, "Database": 4, 
                "DevOps": 12, "Documentation": 8, "Performance": 6, 
                "Security": 35, "Testing": 15, "UI": 4
            },
            "githubPRs": {
                "API": 5, "Authentication": 25, "Database": 2, 
                "DevOps": 8, "Documentation": 6, "Performance": 4, 
                "Security": 20, "Testing": 12, "UI": 2
            },
            "githubReviews": {
                "API": 8, "Authentication": 45, "Database": 4, 
                "DevOps": 12, "Documentation": 8, "Performance": 6, 
                "Security": 35, "Testing": 15, "UI": 4
            },
            "preferences": {
                "API": 0.5, "Authentication": 1.0, "Database": 0.4, 
                "DevOps": 0.6, "Documentation": 0.5, "Performance": 0.4, 
                "Security": 1.0, "Testing": 0.7, "UI": 0.2
            },
            "workHistory": [
                {"source": "manual", "text": "Security audit of the entire authentication flow", "category": "Security", "createdAt": (datetime.now() - timedelta(days=40)).isoformat()},
                {"source": "github", "text": "Implemented JWT rotation and refresh token logic", "category": "Authentication", "createdAt": (datetime.now() - timedelta(days=12)).isoformat()}
            ],
            "resolvedIssues": {
                "Authentication": [
                    {
                        "id": "RES-301", "title": "JWT Vulnerability Fix", "description": "Fixed algorithm confusion vulnerability", 
                        "category": "Authentication", "priority": "critical", "createdAt": (datetime.now() - timedelta(days=60)).isoformat(),
                        "resolvedAt": (datetime.now() - timedelta(days=59)).isoformat(), "resolutionNote": "Enforced RS256 algorithm check."
                    }
                ]
            }
        },
        {
            "email": "alex@gmail.com",
            "name": "Alex",
            "expertise": {
                "API": 0.85, "Authentication": 0.5, "Database": 0.7, 
                "DevOps": 0.95, "Documentation": 0.6, "Performance": 0.9, 
                "Security": 0.6, "Testing": 0.75, "UI": 0.4
            },
            "jiraIssuesSolved": {
                "API": 20, "Authentication": 5, "Database": 15, 
                "DevOps": 45, "Documentation": 10, "Performance": 35, 
                "Security": 10, "Testing": 20, "UI": 8
            },
            "githubCommits": {
                "API": 80, "Authentication": 20, "Database": 60, 
                "DevOps": 250, "Documentation": 40, "Performance": 180, 
                "Security": 30, "Testing": 70, "UI": 25
            },
            "githubPRs": {
                "API": 10, "Authentication": 2, "Database": 8, 
                "DevOps": 35, "Documentation": 4, "Performance": 25, 
                "Security": 3, "Testing": 12, "UI": 3
            },
            "githubReviews": {
                "API": 15, "Authentication": 4, "Database": 10, 
                "DevOps": 50, "Documentation": 6, "Performance": 40, 
                "Security": 5, "Testing": 18, "UI": 5
            },
            "preferences": {
                "API": 0.8, "Authentication": 0.4, "Database": 0.6, 
                "DevOps": 1.0, "Documentation": 0.5, "Performance": 0.9, 
                "Security": 0.5, "Testing": 0.6, "UI": 0.3
            },
            "workHistory": [
                {"source": "github", "text": "Set up CI/CD pipeline for the whole project", "category": "DevOps", "createdAt": (datetime.now() - timedelta(days=30)).isoformat()},
                {"source": "manual", "text": "Optimized production database queries", "category": "Performance", "createdAt": (datetime.now() - timedelta(days=5)).isoformat()}
            ],
            "resolvedIssues": {
                "DevOps": [
                    {
                        "id": "RES-401", "title": "Pipeline Failure Debugging", "description": "Fixed intermittent CI failures", 
                        "category": "DevOps", "priority": "high", "createdAt": (datetime.now() - timedelta(days=3)).isoformat(),
                        "resolvedAt": (datetime.now() - timedelta(days=2)).isoformat(), "resolutionNote": "Added retry logic for flaky network calls."
                    }
                ]
            }
        }
    ]

    print(f"Connecting to API at {API_BASE}...")
    
    for dev in developers:
        print(f"\nProcessing: {dev['email']}")
        
        # 1. Register User (User Collection)
        reg_payload = {
            "email": dev["email"],
            "name": dev["name"],
            "password": "password123",
            "role": "developer"
        }
        reg_resp = requests.post(f"{API_BASE}/api/auth/register", json=reg_payload)
        if reg_resp.status_code in [200, 201]:
            print(f" - Registered user account")
        elif "already exists" in reg_resp.text.lower():
            print(f" - User account already exists, continuing...")
        else:
            print(f" - Warning: Failed to register user: {reg_resp.text}")

        # 2. Create/Update Profile (Developer Profiles Collection)
        profile_payload = {
            "email": dev["email"],
            "name": dev["name"],
            "expertise": dev["expertise"],
            "jiraIssuesSolved": dev["jiraIssuesSolved"],
            "githubCommits": dev["githubCommits"],
            "githubPRs": dev.get("githubPRs"),
            "githubReviews": dev.get("githubReviews"),
            "preferences": dev.get("preferences"),
            "workHistory": dev.get("workHistory", []),
            "resolvedIssues": dev.get("resolvedIssues", {})
        }
        
        prof_resp = requests.post(f"{API_BASE}/api/expertise/developers", json=profile_payload)
        if prof_resp.status_code == 200:
            print(f" - Successfully created/updated developer profile")
        else:
            print(f" - Error updating profile: {prof_resp.status_code} - {prof_resp.text}")

    print("\nSeeding complete!")

if __name__ == "__main__":
    add_custom_developers()
