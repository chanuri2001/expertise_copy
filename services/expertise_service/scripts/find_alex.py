import pymongo
import os
from pathlib import Path

# Load .env manually
env_path = Path("c:/Users/Chanuri Amarasinghe/Desktop/expertise_recommend/AgileSense-AI/services/expertise_service/.env")
env = {}
with open(env_path) as f:
    for line in f:
        if "=" in line:
            key, value = line.strip().split("=", 1)
            env[key] = value

uri = env.get("MONGODB_URI")
db_name = env.get("MONGODB_DB_NAME")

client = pymongo.MongoClient(uri)
db = client[db_name]

print(f"Checking users in collection: {db_name}.users")
alex = db["users"].find_one({"email": "alex@gmail.com"})
if alex:
    print(f"Alex found: {alex.get('email')} ({alex.get('role')})")
    print(f"Password hash exists: {bool(alex.get('passwordHash'))}")
else:
    print("Alex NOT FOUND in users collection!")

print("\nAll emails in users collection:")
for u in db["users"].find():
    print(f"- {u.get('email')}")
