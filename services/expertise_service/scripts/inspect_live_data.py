import pymongo
import os
import sys
from pathlib import Path

# Add project root to path to use existing config
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from services.expertise_service.core.config import config

def inspect_data():
    client = pymongo.MongoClient(config.MONGODB_URI)
    db = client[config.MONGODB_DB_NAME]
    
    print(f"--- DATABASE INSPECTOR ---")
    print(f"Database: {config.MONGODB_DB_NAME}")
    
    # 1. Inspect Users
    users_col = db[config.USERS_COLLECTION_NAME]
    print(f"\n[Collection: {config.USERS_COLLECTION_NAME}]")
    users = list(users_col.find({}, {"passwordHash": 0})) # Hide hashes for cleaner output
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f" - {u.get('email')} (Role: {u.get('role')}, Name: {u.get('name')})")
        
    # 2. Inspect Developer Profiles
    devs_col = db[config.MONGODB_COLLECTION_NAME]
    print(f"\n[Collection: {config.MONGODB_COLLECTION_NAME}]")
    devs = list(devs_col.find())
    print(f"Total Profiles: {len(devs)}")
    for d in devs:
        print(f" - Developer: {d.get('email')}")
        print(f"   Name: {d.get('name')}")
        expertise = d.get('expertise', {})
        commits = d.get('githubCommits', {})
        prs = d.get('githubPRs', {})
        reviews = d.get('githubReviews', {})
        
        print(f"   Expertise: API={expertise.get('API')}, Frontend={expertise.get('UI')}, DB={expertise.get('Database')}")
        print(f"   GitHub Logs: Commits={commits.get('API',0)}, PRs={prs.get('API',0)}, Reviews={reviews.get('API',0)} (for API)")
        
        pending = d.get('pendingIssues', {})
        total_pending = sum(len(issues) for issues in pending.values()) if isinstance(pending, dict) else 0
        print(f"   Pending Issues: {total_pending}")
    print(f"--------------------------")

if __name__ == "__main__":
    inspect_data()
