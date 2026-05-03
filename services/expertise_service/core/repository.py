import os
from typing import Dict, List, Optional

from pymongo import MongoClient
from pymongo.collection import Collection

from .schemas import CategoryPreferences, DeveloperProfile, DeveloperProfileIn, PendingIssue, ResolvedIssue, WorkHistoryItem
from .config import config
from datetime import datetime


from .db import db_conn

def _get_collection() -> Collection:
    """Get MongoDB collection from configuration."""
    return db_conn.get_collection(config.MONGODB_COLLECTION_NAME)


def upsert_developer(profile_in: DeveloperProfileIn) -> DeveloperProfile:
    col = _get_collection()
    doc = profile_in.model_dump(exclude_none=True)
    doc["email"] = doc["email"].lower()
    # Ensure pendingIssues and resolvedIssues are initialized if not provided
    if "pendingIssues" not in doc or doc["pendingIssues"] is None:
        doc["pendingIssues"] = {}
    if "resolvedIssues" not in doc or doc["resolvedIssues"] is None:
        doc["resolvedIssues"] = {}
    if "preferences" not in doc or doc["preferences"] is None:
        doc["preferences"] = CategoryPreferences().model_dump()
    if "workHistory" not in doc or doc["workHistory"] is None:
        doc["workHistory"] = []
    if "role" not in doc or doc["role"] is None:
        doc["role"] = "developer"
    if "status" not in doc or doc["status"] is None:
        doc["status"] = "Active"
    if "efficiency" not in doc or doc["efficiency"] is None:
        doc["efficiency"] = 0.94
    if "earnedBadges" not in doc or doc["earnedBadges"] is None:
        doc["earnedBadges"] = []
    result = col.update_one({"email": doc["email"]}, {"$set": doc}, upsert=True)
    stored = col.find_one({"email": doc["email"]})
    return DeveloperProfile(id=str(stored["_id"]), **stored)


def get_developer_by_email(email: str) -> Optional[DeveloperProfile]:
    email = email.lower()
    col = _get_collection()
    doc = col.find_one({"email": email})
    if not doc:
        return None
    # Ensure pendingIssues and resolvedIssues are initialized
    if "pendingIssues" not in doc or doc["pendingIssues"] is None:
        doc["pendingIssues"] = {}
    if "resolvedIssues" not in doc or doc["resolvedIssues"] is None:
        doc["resolvedIssues"] = {}
    if "preferences" not in doc or doc["preferences"] is None:
        doc["preferences"] = CategoryPreferences().model_dump()
    if "workHistory" not in doc or doc["workHistory"] is None:
        doc["workHistory"] = []
    if "role" not in doc or doc["role"] is None:
        doc["role"] = "developer"
    if "status" not in doc or doc["status"] is None:
        doc["status"] = "Active"
    if "efficiency" not in doc or doc["efficiency"] is None:
        doc["efficiency"] = 0.94
    if "earnedBadges" not in doc or doc["earnedBadges"] is None:
        doc["earnedBadges"] = []
    return DeveloperProfile(id=str(doc["_id"]), **doc)


def list_developers() -> List[DeveloperProfile]:
    col = _get_collection()
    devs: List[DeveloperProfile] = []
    for doc in col.find():
        # Ensure pendingIssues and resolvedIssues are initialized
        if "pendingIssues" not in doc or doc["pendingIssues"] is None:
            doc["pendingIssues"] = {}
        if "resolvedIssues" not in doc or doc["resolvedIssues"] is None:
            doc["resolvedIssues"] = {}
        if "preferences" not in doc or doc["preferences"] is None:
            doc["preferences"] = CategoryPreferences().model_dump()
        if "workHistory" not in doc or doc["workHistory"] is None:
            doc["workHistory"] = []
        if "role" not in doc or doc["role"] is None:
            doc["role"] = "developer"
        if "status" not in doc or doc["status"] is None:
            doc["status"] = "Active"
        if "efficiency" not in doc or doc["efficiency"] is None:
            doc["efficiency"] = 0.94
        if "earnedBadges" not in doc or doc["earnedBadges"] is None:
            doc["earnedBadges"] = []
        devs.append(DeveloperProfile(id=str(doc["_id"]), **doc))
    return devs


def update_preferences(developer_email: str, preferences: CategoryPreferences) -> DeveloperProfile:
    developer_email = developer_email.lower()
    col = _get_collection()
    col.update_one({"email": developer_email}, {"$set": {"preferences": preferences.model_dump()}})
    doc = col.find_one({"email": developer_email})
    if not doc:
        raise ValueError(f"Developer with email {developer_email} not found")
    # normalize new fields
    if "pendingIssues" not in doc or doc["pendingIssues"] is None:
        doc["pendingIssues"] = {}
    if "resolvedIssues" not in doc or doc["resolvedIssues"] is None:
        doc["resolvedIssues"] = {}
    if "workHistory" not in doc or doc["workHistory"] is None:
        doc["workHistory"] = []
    if "earnedBadges" not in doc or doc["earnedBadges"] is None:
        doc["earnedBadges"] = []
    return DeveloperProfile(id=str(doc["_id"]), **doc)


def append_work_history(developer_email: str, item: WorkHistoryItem) -> DeveloperProfile:
    developer_email = developer_email.lower()
    col = _get_collection()
    doc = col.find_one({"email": developer_email})
    if not doc:
        raise ValueError(f"Developer with email {developer_email} not found")

    if "workHistory" not in doc or doc["workHistory"] is None:
        doc["workHistory"] = []

    item_dict = item.model_dump()
    if not item_dict.get("createdAt"):
        item_dict["createdAt"] = datetime.now().isoformat()

    doc["workHistory"].append(item_dict)
    col.update_one({"email": developer_email}, {"$set": {"workHistory": doc["workHistory"]}})

    updated_doc = col.find_one({"email": developer_email})
    return DeveloperProfile(id=str(updated_doc["_id"]), **updated_doc)


def add_pending_issue(developer_email: str, issue: PendingIssue) -> DeveloperProfile:
    """Add a pending issue to a developer's profile for a specific category."""
    developer_email = developer_email.lower()
    col = _get_collection()
    doc = col.find_one({"email": developer_email})
    if not doc:
        raise ValueError(f"Developer with email {developer_email} not found")
    
    # Initialize pendingIssues if not present
    if "pendingIssues" not in doc or doc["pendingIssues"] is None:
        doc["pendingIssues"] = {}
    
    category = issue.category
    if category not in doc["pendingIssues"]:
        doc["pendingIssues"][category] = []
    
    # Add the issue if it doesn't already exist (by id)
    issue_dict = issue.model_dump()
    existing_ids = [i.get("id") for i in doc["pendingIssues"][category]]
    if issue.id not in existing_ids:
        doc["pendingIssues"][category].append(issue_dict)
        col.update_one({"email": developer_email}, {"$set": {"pendingIssues": doc["pendingIssues"]}})
    
    updated_doc = col.find_one({"email": developer_email})
    return DeveloperProfile(id=str(updated_doc["_id"]), **updated_doc)


def get_pending_issues_by_category(developer_email: str, category: str) -> List[PendingIssue]:
    """Get all pending issues for a developer in a specific category."""
    doc = get_developer_by_email(developer_email)
    if not doc:
        return []
    
    if not doc.pendingIssues or category not in doc.pendingIssues:
        return []
    
    return [PendingIssue(**issue) for issue in doc.pendingIssues[category]]


def remove_pending_issue(developer_email: str, category: str, issue_id: str) -> DeveloperProfile:
    """Remove a pending issue from a developer's profile."""
    developer_email = developer_email.lower()
    col = _get_collection()
    doc = col.find_one({"email": developer_email})
    if not doc:
        raise ValueError(f"Developer with email {developer_email} not found")
    
    if "pendingIssues" not in doc or doc["pendingIssues"] is None:
        return DeveloperProfile(id=str(doc["_id"]), **doc)
    
    if category in doc["pendingIssues"]:
        doc["pendingIssues"][category] = [
            i for i in doc["pendingIssues"][category] if i.get("id") != issue_id
        ]
        col.update_one({"email": developer_email}, {"$set": {"pendingIssues": doc["pendingIssues"]}})
    
    updated_doc = col.find_one({"email": developer_email})
    return DeveloperProfile(id=str(updated_doc["_id"]), **updated_doc)

def update_pending_issue_status(developer_email: str, category: str, issue_id: str, status: str) -> DeveloperProfile:
    """Update the status of a pending issue in a developer's profile."""
    developer_email = developer_email.lower()
    col = _get_collection()
    doc = col.find_one({"email": developer_email})
    if not doc:
        raise ValueError(f"Developer with email {developer_email} not found")
    
    if "pendingIssues" not in doc or doc["pendingIssues"] is None:
        return DeveloperProfile(id=str(doc["_id"]), **doc)
    
    if category in doc["pendingIssues"]:
        for issue in doc["pendingIssues"][category]:
            if issue.get("id") == issue_id:
                issue["status"] = status
                break
        col.update_one({"email": developer_email}, {"$set": {"pendingIssues": doc["pendingIssues"]}})
    
    updated_doc = col.find_one({"email": developer_email})
    return DeveloperProfile(id=str(updated_doc["_id"]), **updated_doc)


def resolve_issue(developer_email: str, category: str, issue_id: str, resolved_at: Optional[str] = None, resolution_note: Optional[str] = None) -> DeveloperProfile:
    """Move a pending issue to resolved issues."""
    developer_email = developer_email.lower()
    col = _get_collection()
    doc = col.find_one({"email": developer_email})
    if not doc:
        raise ValueError(f"Developer with email {developer_email} not found")
    
    # Initialize if needed
    if "pendingIssues" not in doc or doc["pendingIssues"] is None:
        doc["pendingIssues"] = {}
    if "resolvedIssues" not in doc or doc["resolvedIssues"] is None:
        doc["resolvedIssues"] = {}
    
    # Find and remove from pending
    pending_issue = None
    if category in doc["pendingIssues"]:
        for issue in doc["pendingIssues"][category]:
            if issue.get("id") == issue_id:
                pending_issue = issue
                break
        if pending_issue:
            doc["pendingIssues"][category] = [
                i for i in doc["pendingIssues"][category] if i.get("id") != issue_id
            ]
    
    if not pending_issue:
        # Check if it was already resolved (e.g. double click or retry)
        if category in doc["resolvedIssues"]:
            existing_resolved_ids = [i.get("id") for i in doc["resolvedIssues"][category]]
            if issue_id in existing_resolved_ids:
                return DeveloperProfile(id=str(doc["_id"]), **doc)
        
        # If deeply missing, fail gracefully rather than crashing everything
        print(f"Warning: Issue {issue_id} not found in pending issues for {developer_email}")
        return DeveloperProfile(id=str(doc["_id"]), **doc)
    
    # Add to resolved
    if category not in doc["resolvedIssues"]:
        doc["resolvedIssues"][category] = []
    
    resolved_issue = {
        "id": pending_issue["id"],
        "title": pending_issue["title"],
        "description": pending_issue["description"],
        "category": pending_issue["category"],
        "priority": pending_issue.get("priority", "medium"),
        "createdAt": pending_issue.get("createdAt"),
        "resolvedAt": resolved_at or datetime.now().isoformat(),
        "submittedBy": pending_issue.get("submittedBy"),
        "resolutionNote": resolution_note,
    }
    
    # Check if already exists
    existing_ids = [i.get("id") for i in doc["resolvedIssues"][category]]
    if issue_id not in existing_ids:
        doc["resolvedIssues"][category].append(resolved_issue)
    
    # Update both and increment solved count for the category
    col.update_one(
        {"email": developer_email},
        {
            "$set": {
                "pendingIssues": doc["pendingIssues"],
                "resolvedIssues": doc["resolvedIssues"]
            },
            "$inc": {f"jiraIssuesSolved.{category}": 1}
        }
    )
    
    updated_doc = col.find_one({"email": developer_email})
    return DeveloperProfile(id=str(updated_doc["_id"]), **updated_doc)


def get_resolved_issues_by_category(developer_email: str, category: str) -> List[ResolvedIssue]:
    """Get all resolved issues for a developer in a specific category."""
    doc = get_developer_by_email(developer_email)
    if not doc:
        return []
    
    if not doc.resolvedIssues or category not in doc.resolvedIssues:
        return []
    
    return [ResolvedIssue(**issue) for issue in doc.resolvedIssues[category]]


def increment_expertise_score(developer_email: str, category: str, increment: float = 0.02) -> tuple:
    """Increment expertise score for a category, capped at 1.0, and return (old_score, new_score)."""
    developer_email = developer_email.lower()
    col = _get_collection()
    
    # Get current score first
    doc = col.find_one({"email": developer_email})
    old_score = doc.get("expertise", {}).get(category, 0.0) if doc else 0.0
    
    # Calculate new score
    new_score = old_score + increment
    if new_score > 1.0:
        new_score = 1.0
        
    # Update directly
    col.update_one(
        {"email": developer_email},
        {"$set": {f"expertise.{category}": round(new_score, 4)}}
    )
    
    return round(old_score, 4), round(new_score, 4)


def add_badge_to_developer(developer_email: str, badge: str) -> DeveloperProfile:
    """Permanently adds a badge to the developer's profile."""
    developer_email = developer_email.lower()
    col = _get_collection()
    
    doc = col.find_one({"email": developer_email})
    if not doc:
        raise ValueError(f"Developer with email {developer_email} not found")
        
    # Atomic push to array ensuring no duplicates
    col.update_one(
        {"email": developer_email},
        {"$addToSet": {"earnedBadges": badge}}
    )
    
    updated_doc = col.find_one({"email": developer_email})
    if "earnedBadges" not in updated_doc or updated_doc["earnedBadges"] is None:
        updated_doc["earnedBadges"] = []
        
    return DeveloperProfile(id=str(updated_doc["_id"]), **updated_doc)


