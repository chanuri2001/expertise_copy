import pymongo
import os
from pathlib import Path

# Load .env manually
env_path = Path("c:/Users/Chanuri Amarasinghe/Desktop/expertise_recommend/AgileSense-AI/services/expertise_service/.env")
with open(env_path) as f:
    for line in f:
        if "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value

uri = os.getenv("MONGODB_URI")
db_name = os.getenv("MONGODB_DB_NAME")

try:
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
    db = client[db_name]
    
    user = db["users"].find_one({"email": "natty@gmail.com"})
    if user:
        print(f"User NATTY found: Role={user.get('role')}, Name={user.get('name')}")
    else:
        print("User NATTY NOT FOUND in database!")
    
    print("\nAll users:")
    for u in db["users"].find():
        print(f"- {u.get('email')} ({u.get('role')})")
    
except Exception as e:
    print(f"Error: {e}")
