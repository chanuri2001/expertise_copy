import pymongo
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from services.expertise_service.core.auth import hash_password, verify_password

# Load .env manually
env_path = Path("c:/Users/Chanuri Amarasinghe/Desktop/expertise_recommend/AgileSense-AI/services/expertise_service/.env")
env = {}
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            if "=" in line:
                key, value = line.strip().split("=", 1)
                env[key] = value

uri = env.get("MONGODB_URI")
db_name = env.get("MONGODB_DB_NAME")

client = pymongo.MongoClient(uri)
db = client[db_name]

print(f"Checking Alex's password hash...")
alex = db["users"].find_one({"email": "alex@gmail.com"})
if alex:
    h = alex.get('passwordHash')
    print(f"Stored Hash: {h}")
    # Check if it matches 'password123'
    if verify_password("password123", h):
        print("MATCH: password123 is the correct password.")
    else:
        print("MISMATCH: password123 is NOT the correct password.")
        # Let's fix it!
        new_hash = hash_password("password123")
        db["users"].update_one({"email": "alex@gmail.com"}, {"$set": {"passwordHash": new_hash}})
        print("FIXED: Set password for alex@gmail.com to 'password123'")
else:
    print("Alex NOT FOUND")
