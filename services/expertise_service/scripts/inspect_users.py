
import pymongo
import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env from the service directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

print("--- ATLAS (expertise db) ---")
try:
    client_atlas = pymongo.MongoClient(os.getenv("MONGODB_URI"))
    db_atlas = client_atlas[os.getenv("MONGODB_DB_NAME")]
    users_atlas = list(db_atlas.users.find({}, {"email": 1, "name": 1, "role": 1}))
    for u in users_atlas:
        print(f"Email: {u['email']} | Name: {u['name']} | Role: {u['role']}")
except Exception as e:
    print(f"Atlas error: {e}")

print("\n--- LOCALHOST (agilesense_ai db) ---")
try:
    client_local = pymongo.MongoClient("mongodb://localhost:27017")
    db_local = client_local["agilesense_ai"]
    users_local = list(db_local.users.find({}, {"email": 1, "name": 1, "role": 1}))
    for u in users_local:
        print(f"Email: {u['email']} | Name: {u['name']} | Role: {u['role']}")
except Exception as e:
    print(f"Local error: {e}")
