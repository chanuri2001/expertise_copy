import pymongo
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))
from services.expertise_service.core.config import config

def check_and_fix_natty():
    client = pymongo.MongoClient(config.MONGODB_URI)
    db = client[config.MONGODB_DB_NAME]
    
    email = "natty@gmail.com"
    
    # 1. Check User Collection
    user = db["users"].find_one({"email": email})
    print(f"User collection check for {email}:")
    if user:
        print(f" Current Role: {user.get('role')}")
        if user.get('role') != 'manager':
            db["users"].update_one({"email": email}, {"$set": {"role": "manager"}})
            print(f" UPDATED role to 'manager'")
    else:
        print(" User not found in 'users' collection.")

    # 2. Check Developer Profiles
    # Managers usually shouldn't be in developer_profiles OR should have role='manager' there too
    dev = db["developer_profiles"].find_one({"email": email})
    print(f"\nDeveloper Profiles collection check for {email}:")
    if dev:
        print(f" Profile exists. Role in profile: {dev.get('role')}")
        if dev.get('role') != 'manager':
            db["developer_profiles"].update_one({"email": email}, {"$set": {"role": "manager"}})
            print(f" UPDATED role in profile to 'manager'")
    else:
        print(" No profile found in 'developer_profiles' (Correct for a PM).")

if __name__ == "__main__":
    check_and_fix_natty()
