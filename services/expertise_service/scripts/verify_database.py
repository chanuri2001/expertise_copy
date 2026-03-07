"""
Script to verify if data is saved in MongoDB.
Run this to check if the database connection works and if data exists.

Usage:
    python services/expertise_service/scripts/verify_database.py
"""

import sys
import os
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from services.expertise_service.core.config import config
from services.expertise_service.core.repository import (
    list_developers,
    get_developer_by_email,
)
from pymongo import MongoClient
from services.expertise_service.core.config import config

def verify_database():
    """Verify MongoDB connection and data."""
    print("=" * 60)
    print("MongoDB Database Verification")
    print("=" * 60)
    print()
    
    # 1. Check Configuration
    print("1. Configuration Check")
    print("-" * 60)
    print(f"   MongoDB URI: {config.MONGODB_URI}")
    print(f"   Database Name: {config.MONGODB_DB_NAME}")
    print(f"   Collection Name: {config.MONGODB_COLLECTION_NAME}")
    print()
    
    # 2. Test Connection
    print("2. Connection Test")
    print("-" * 60)
    try:
        client = MongoClient(config.MONGODB_URI)
        # Try to ping the database
        client.admin.command('ping')
        print("   ✓ MongoDB connection successful!")
        db = client[config.MONGODB_DB_NAME]
        collection = db[config.MONGODB_COLLECTION_NAME]
    except Exception as e:
        print(f"   ✗ MongoDB connection failed: {e}")
        print()
        print("   Troubleshooting:")
        print("   - Is MongoDB running? (check with: mongosh or docker-compose ps)")
        print("   - Is MONGODB_URI correct in .env file?")
        print("   - For Docker: Is container running? (docker-compose ps)")
        return False
    print()
    
    # 3. Check Database Exists
    print("3. Database Check")
    print("-" * 60)
    try:
        db_names = client.list_database_names()
        if config.MONGODB_DB_NAME in db_names:
            print(f"   ✓ Database '{config.MONGODB_DB_NAME}' exists")
        else:
            print(f"   ⚠ Database '{config.MONGODB_DB_NAME}' not found")
            print("   (This is OK - database will be created on first insert)")
    except Exception as e:
        print(f"   ✗ Error checking database: {e}")
    print()
    
    # 4. Check Collection Exists
    print("4. Collection Check")
    print("-" * 60)
    try:
        collections = db.list_collection_names()
        if config.MONGODB_COLLECTION_NAME in collections:
            print(f"   ✓ Collection '{config.MONGODB_COLLECTION_NAME}' exists")
        else:
            print(f"   ⚠ Collection '{config.MONGODB_COLLECTION_NAME}' not found")
            print("   (This is OK - collection will be created on first insert)")
    except Exception as e:
        print(f"   ✗ Error checking collection: {e}")
    print()
    
    # 5. Count Documents
    print("5. Data Count")
    print("-" * 60)
    try:
        count = collection.count_documents({})
        print(f"   Total documents in collection: {count}")
        if count > 0:
            print("   ✓ Data is saved in MongoDB!")
        else:
            print("   ⚠ No documents found in collection")
            print("   Run populate_sample_profiles.py to add sample data")
    except Exception as e:
        print(f"   ✗ Error counting documents: {e}")
    print()
    
    # 6. List All Developers
    print("6. Developer Profiles")
    print("-" * 60)
    try:
        developers = list_developers()
        if developers:
            print(f"   Found {len(developers)} developer profile(s):")
            for dev in developers:
                pending_count = sum(
                    len(issues) if issues else 0
                    for issues in (dev.pendingIssues or {}).values()
                )
                resolved_count = sum(
                    len(issues) if issues else 0
                    for issues in (dev.resolvedIssues or {}).values()
                )
                print(f"   - {dev.name} ({dev.email})")
                print(f"     Pending issues: {pending_count}, Resolved issues: {resolved_count}")
        else:
            print("   No developer profiles found")
            print("   Run: python services/expertise_service/scripts/populate_sample_profiles.py")
    except Exception as e:
        print(f"   ✗ Error listing developers: {e}")
    print()
    
    # 7. Sample Document
    print("7. Sample Document")
    print("-" * 60)
    try:
        sample = collection.find_one()
        if sample:
            print("   Sample document structure:")
            print(f"   - Email: {sample.get('email', 'N/A')}")
            print(f"   - Name: {sample.get('name', 'N/A')}")
            print(f"   - Has expertise: {bool(sample.get('expertise'))}")
            print(f"   - Has pendingIssues: {bool(sample.get('pendingIssues'))}")
            print(f"   - Has resolvedIssues: {bool(sample.get('resolvedIssues'))}")
        else:
            print("   No documents found to sample")
    except Exception as e:
        print(f"   ✗ Error getting sample: {e}")
    print()
    
    print("=" * 60)
    print("Verification Complete!")
    print("=" * 60)
    
    return True


if __name__ == "__main__":
    try:
        verify_database()
    except KeyboardInterrupt:
        print("\n\nVerification cancelled by user.")
    except Exception as e:
        print(f"\n\nError during verification: {e}")
        import traceback
        traceback.print_exc()

