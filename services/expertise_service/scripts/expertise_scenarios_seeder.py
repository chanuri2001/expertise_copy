
from pymongo import MongoClient
from datetime import datetime, timedelta
import random
import uuid

# Configuration
from dotenv import load_dotenv
import os
from pathlib import Path

# Load .env from the service directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB_NAME", "expertise")

print(f"[*] Connecting to: {MONGODB_URI.split('@')[-1] if '@' in MONGODB_URI else MONGODB_URI}")
print(f"[*] Target Database: {DB_NAME}")

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

import bcrypt

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    hashed = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt())
    return hashed.decode('utf-8')

# Password: password123
PWD_HASH = get_password_hash("password123")

CATEGORIES = ["API", "Authentication", "Database", "DevOps", "Documentation", 
              "General Logic", "Performance", "Security", "Testing", "UI"]

def clear_collections():
    print("[*] Clearing old data for a clean demonstration...")
    db.users.delete_many({})
    db.developer_profiles.delete_many({})
    db.issues.delete_many({})
    db.notifications.delete_many({})

def create_user_and_profile(name, email, expertise_vals, workload_items=None, status="Active", preferences=None):
    # expertise_vals can be a dict like {"UI": 0.95, "Database": 0.85}
    
    # 1. Create User
    user = {
        "email": email,
        "name": name,
        "passwordHash": PWD_HASH,
        "role": "developer",
        "createdAt": datetime.now().isoformat()
    }
    db.users.insert_one(user)

    # 2. Create Profile
    expertise_map = {cat: 0.1 for cat in CATEGORIES}
    if isinstance(expertise_vals, dict):
        for cat, val in expertise_vals.items():
            expertise_map[cat] = val
    else:
        expertise_map["UI"] = expertise_vals
    
    # Process pending issues for workload
    pending_issues = {"UI": []}
    if workload_items:
        for weight, title in workload_items:
            issue_id = f"WORK-{uuid.uuid4().hex[:4].upper()}"
            priority = "low"
            if weight == 5.0: priority = "critical"
            elif weight == 3.0: priority = "high"
            
            p_issue = {
                "id": issue_id,
                "title": title,
                "description": f"Ongoing work for {title}",
                "category": "UI",
                "status": "assigned",
                "priority": priority,
                "submittedBy": "natty@gmail.com",
                "submittedByName": "Project Manager Natty",
                "assignedTo": email,
                "assignedToName": name,
                "createdAt": (datetime.now() - timedelta(days=random.randint(1, 5))).isoformat()
            }
            pending_issues["UI"].append(p_issue)
            db.issues.insert_one(p_issue)

    profile = {
        "email": email,
        "name": name,
        "role": "developer",
        "status": status,
        "expertise": expertise_map,
        "preferences": preferences or {cat: 0.5 for cat in CATEGORIES},
        "jiraIssuesSolved": {"UI": random.randint(10, 30)},
        "githubCommits": {"UI": random.randint(20, 50)},
        "pendingIssues": pending_issues,
        "resolvedIssues": {},
        "efficiency": 0.95,
        "workHistory": []
    }
    db.developer_profiles.insert_one(profile)
    skill_str = str(expertise_vals) if isinstance(expertise_vals, dict) else f"UI: {expertise_vals}"
    print(f" [OK] Created Specialist: {name} ({skill_str}, Status: {status}, Load: {len(workload_items) if workload_items else 0})")

def seed_scenarios():
    clear_collections()
    
    print("\n[*] Seeding Demonstration Scenarios...")

    # SCENARIO 1: The Overloaded Expert
    # Alex is a genius in UI and Database.
    create_user_and_profile(
        "Expert Alex", "alex@gmail.com", {"UI": 0.95, "Database": 0.88}, 
        workload_items=[(5.0, "Critical Bug Fix"), (5.0, "System Crash UI")]
    )

    # SCENARIO 2: The Available Pro
    # Sarah is solid in UI and API.
    create_user_and_profile(
        "Ready Sarah", "sarah@gmail.com", {"UI": 0.78, "Database": 0.72, "API": 0.85}, 
        workload_items=[]
    )

    # SCENARIO 3: The Busy Pro
    # Elena is a Security/DB specialist but 'Busy'.
    create_user_and_profile(
        "Busy Elena", "elena@gmail.com", {"UI": 0.85, "Database": 0.92, "Security": 0.88}, 
        workload_items=[], status="Busy"
    )

    # SCENARIO 4: The Enthusiastic Grower (The 3rd Recommendation)
    # Malith loves UI and Documentation.
    create_user_and_profile(
        "Grower Malith", "malith@gmail.com", {"UI": 0.35, "Documentation": 0.45}, 
        workload_items=[], 
        preferences={cat: (1.0 if cat=="UI" else 0.8 if cat=="Documentation" else 0.1) for cat in CATEGORIES}
    )

    # SCENARIO 5: The Ghost Expert
    # John is the best in the world but is 'Off Duty'.
    create_user_and_profile(
        "Off-Duty John", "john@gmail.com", {"UI": 1.0, "Database": 1.0, "API": 1.0}, 
        workload_items=[], status="Off Duty"
    )

    # SCENARIO 6: The Project Manager
    # Natty oversees the team and assigns work.
    db.users.insert_one({
        "email": "natty@gmail.com",
        "name": "Project Manager Natty",
        "passwordHash": PWD_HASH,
        "role": "manager",
        "createdAt": datetime.now().isoformat()
    })
    print(" [OK] Created Project Manager: Natty (natty@gmail.com)")

    # SCENARIO 7: New Pending Issues (To show prediction/assignment)
    pending_tasks = [
        ("UI Layout Refactor", "UI"),
        ("Login Page Security Update", "Authentication"),
        ("Database Query Optimization", "Database"),
        ("New Feature Documentation", "Documentation")
    ]
    for title, cat in pending_tasks:
        db.issues.insert_one({
            "id": f"TASK-{uuid.uuid4().hex[:4].upper()}",
            "title": title,
            "description": f"New requirement: {title}",
            "category": cat,
            "status": "pending",
            "priority": random.choice(["low", "medium", "high"]),
            "submittedBy": "natty@gmail.com",
            "submittedByName": "Project Manager Natty",
            "createdAt": (datetime.now() - timedelta(hours=random.randint(1, 24))).isoformat()
        })
    print(f" [OK] Created {len(pending_tasks)} new pending issues for prediction demo.")

    # Add some generic users to fill the team to 12
    names = ["Liam", "Noah", "Oliver", "Elijah", "James", "William", "Sophia"]
    for i, name in enumerate(names):
        email = f"{name.lower()}@tech.com"
        create_user_and_profile(name, email, round(random.uniform(0.1, 0.6), 2))

    print("\n[SUCCESS] Scenarios are ready. Go to the dashboard and test a 'UI' issue!")

if __name__ == "__main__":
    seed_scenarios()
