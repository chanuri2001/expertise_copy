"""
Repository for managing issues in MongoDB.
Issues are stored separately from developer profiles.
"""
from typing import List, Optional
from datetime import datetime
from pymongo import MongoClient
from pymongo.collection import Collection

from .config import config
from .schemas import Issue


from .db import db_conn

def _get_issues_collection() -> Collection:
    """Get MongoDB collection for issues."""
    return db_conn.get_collection("issues")


def create_issue(issue: Issue) -> Issue:
    """Create a new issue."""
    col = _get_issues_collection()
    doc = issue.model_dump()
    result = col.insert_one(doc)
    stored = col.find_one({"_id": result.inserted_id})
    return Issue(**stored)


def get_issue_by_id(issue_id: str) -> Optional[Issue]:
    """Get issue by ID."""
    col = _get_issues_collection()
    doc = col.find_one({"id": issue_id})
    if not doc:
        return None
    return Issue(**doc)


def list_all_issues(status: Optional[str] = None, skip: int = 0, limit: int = 50) -> (List[Issue], int):
    """List all issues with pagination, optionally filtered by status."""
    col = _get_issues_collection()
    query = {} if not status else {"status": status}
    
    total = col.count_documents(query)
    
    issues = []
    for doc in col.find(query).sort("createdAt", -1).skip(skip).limit(limit):
        issues.append(Issue(**doc))
    return issues, total


def delete_issue(issue_id: str) -> bool:
    """Delete an issue by ID."""
    col = _get_issues_collection()
    result = col.delete_one({"id": issue_id})
    return result.deleted_count > 0


def update_issue_data(issue_id: str, update_data: dict) -> Optional[Issue]:
    """Update issue details (title, description, etc.)."""
    col = _get_issues_collection()
    col.update_one({"id": issue_id}, {"$set": update_data})
    doc = col.find_one({"id": issue_id})
    if not doc:
        return None
    return Issue(**doc)


def update_issue_status(issue_id: str, status: str, assigned_to: Optional[str] = None, assigned_to_name: Optional[str] = None, resolution_note: Optional[str] = None) -> Issue:
    """Update issue status."""
    col = _get_issues_collection()
    update_data = {"status": status}
    
    if status == "assigned" and assigned_to:
        update_data["assignedTo"] = assigned_to
        update_data["assignedToName"] = assigned_to_name
        update_data["assignedAt"] = datetime.now().isoformat()
    elif status == "resolved":
        update_data["resolvedAt"] = datetime.now().isoformat()
        if resolution_note:
            update_data["resolutionNote"] = resolution_note
    
    col.update_one({"id": issue_id}, {"$set": update_data})
    doc = col.find_one({"id": issue_id})
    return Issue(**doc)


def assign_issue_to_developer(issue_id: str, developer_email: str, developer_name: str) -> Issue:
    """Assign issue to a developer."""
    return update_issue_status(issue_id, "assigned", developer_email, developer_name)


def mark_issue_as_done(issue_id: str) -> Issue:
    """Mark issue as done (expert completed work)."""
    return update_issue_status(issue_id, "done")


def mark_issue_as_resolved(issue_id: str, resolution_note: Optional[str] = None) -> Issue:
    """Mark issue as resolved (final status)."""
    return update_issue_status(issue_id, "resolved", resolution_note=resolution_note)


def get_issues_by_developer(developer_email: str) -> List[Issue]:
    """Get all issues assigned to a developer."""
    col = _get_issues_collection()
    issues = []
    for doc in col.find({"assignedTo": developer_email}).sort("createdAt", -1):
        issues.append(Issue(**doc))
    return issues

