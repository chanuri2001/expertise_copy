from typing import List, Optional
from pymongo import MongoClient
import uuid
from datetime import datetime
from .schemas import Notification
from .config import config

from .db import db_conn

def _get_collection():
    return db_conn.get_collection("notifications")

def create_notification(user_email: str, title: str, message: str, type: str, related_issue_id: Optional[str] = None) -> Notification:
    col = _get_collection()
    notif = Notification(
        id=str(uuid.uuid4()),
        userEmail=user_email,
        title=title,
        message=message,
        type=type,
        relatedIssueId=related_issue_id,
        createdAt=datetime.now().isoformat(),
        read=False
    )
    col.insert_one(notif.model_dump())
    return notif

def get_user_notifications(user_email: str, unread_only: bool = False) -> List[Notification]:
    col = _get_collection()
    query = {"userEmail": user_email}
    if unread_only:
        query["read"] = False
        
    cursor = col.find(query).sort("createdAt", -1).limit(50)
    return [Notification(**doc) for doc in cursor]

def mark_notification_read(notification_id: str) -> bool:
    col = _get_collection()
    result = col.update_one({"id": notification_id}, {"$set": {"read": True}})
    return result.modified_count > 0
