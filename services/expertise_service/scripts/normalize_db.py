import pymongo
from dotenv import load_dotenv
import os

# Load .env
load_dotenv('services/expertise_service/.env')
uri = os.getenv("MONGODB_URI")
db_name = os.getenv("MONGODB_DB_NAME", "agilesense_ai")

client = pymongo.MongoClient(uri)
db = client[db_name]

def normalize_collection(name):
    print(f"Normalizing collection: {name}...")
    col = db[name]
    count = 0
    for doc in col.find():
        original_email = doc.get('email')
        if original_email and original_email != original_email.lower():
            new_email = original_email.lower()
            # Check if lowercased already exists (collision)
            if col.find_one({'email': new_email}) and name == 'users':
                print(f"  WARNING: Collision for {new_email}, skipping update.")
                continue
            
            col.update_one({'_id': doc['_id']}, {'$set': {'email': new_email}})
            count += 1
            print(f"  Updated: {original_email} -> {new_email}")
            
    print(f"  Fixed {count} documents in {name}.")

if __name__ == "__main__":
    normalize_collection('users')
    normalize_collection('developers')
    print("Normalization complete.")
