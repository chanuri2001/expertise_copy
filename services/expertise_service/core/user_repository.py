from __future__ import annotations

from datetime import datetime
from typing import Optional

from pymongo import MongoClient
from pymongo.collection import Collection

from .config import config


from .db import db_conn


def _get_users_collection() -> Collection:
    """Get MongoDB collection for users."""
    return db_conn.get_collection(config.USERS_COLLECTION_NAME)


def create_user(email: str, name: str, password_hash: str, role: str = "developer") -> dict:
    email = email.lower()
    col = _get_users_collection()
    existing = col.find_one({"email": email})
    if existing:
        raise ValueError("User already exists")

    doc = {
        "email": email,
        "name": name,
        "passwordHash": password_hash,
        "role": role,
        "createdAt": datetime.now().isoformat(),
    }
    result = col.insert_one(doc)
    stored = col.find_one({"_id": result.inserted_id})
    return stored


def get_user_by_email(email: str) -> Optional[dict]:
    email = email.lower().strip()
    return db_conn.get_collection("users").find_one({"email": email})
