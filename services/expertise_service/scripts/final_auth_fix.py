import pymongo
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from services.expertise_service.core.config import config
from services.expertise_service.core.auth import hash_password, verify_password

client = pymongo.MongoClient(config.MONGODB_URI)
db = client[config.MONGODB_DB_NAME]
col = db[config.USERS_COLLECTION_NAME]

print(f"Inspecting users in {config.MONGODB_DB_NAME}.{config.USERS_COLLECTION_NAME}")
for user in col.find():
    email = user.get("email")
    pwd_hash = user.get("passwordHash")
    print(f"User: {email}")
    print(f"  Hash length: {len(pwd_hash) if pwd_hash else 'NONE'}")
    if email == "alex@gmail.com":
        match = verify_password("password123", pwd_hash) if pwd_hash else False
        print(f"  Matches 'password123': {match}")
        if not match:
            new_hash = hash_password("password123")
            col.update_one({"email": "alex@gmail.com"}, {"$set": {"passwordHash": new_hash}})
            print(f"  UPDATED password to 'password123'")

print("\nSeeding other accounts just in case...")
accounts = ["harini@gmail.com", "mark@gmail.com", "tom@gmail.com", "natty@gmail.com"]
for acc in accounts:
    u = col.find_one({"email": acc})
    if u:
        new_hash = hash_password("password123")
        col.update_one({"email": acc}, {"$set": {"passwordHash": new_hash}})
        print(f"  Reset {acc} to 'password123'")
