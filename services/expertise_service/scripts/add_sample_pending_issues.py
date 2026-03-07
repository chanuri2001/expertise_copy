"""
Script to add sample pending issues to developer profiles.
Run this after populate_sample_profiles.py to test the pending issues feature.

Usage:
    python services\expertise_service\scripts\add_sample_pending_issues.py
"""

import sys
import os
from datetime import datetime, timedelta

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from services.expertise_service.core.schemas import PendingIssue, AssignIssueRequest
from services.expertise_service.core.service import assign_issue_to_developer


def add_sample_pending_issues():
    """Add sample pending issues to developers."""
    
    issues = [
        # Charlie Brown - Authentication expert
        AssignIssueRequest(
            developerEmail="charlie@example.com",
            issue=PendingIssue(
                id="AUTH-001",
                title="Fix OAuth token expiration issue",
                description="Users are experiencing token expiration errors after 1 hour. Need to implement refresh token mechanism.",
                category="Authentication",
                status="in_progress",
                priority="high",
                createdAt=datetime.now().isoformat(),
                dueDate=(datetime.now() + timedelta(days=3)).isoformat()
            )
        ),
        AssignIssueRequest(
            developerEmail="charlie@example.com",
            issue=PendingIssue(
                id="AUTH-002",
                title="Implement multi-factor authentication",
                description="Add MFA support for user accounts to enhance security.",
                category="Authentication",
                status="pending",
                priority="medium",
                createdAt=datetime.now().isoformat(),
                dueDate=(datetime.now() + timedelta(days=7)).isoformat()
            )
        ),
        AssignIssueRequest(
            developerEmail="charlie@example.com",
            issue=PendingIssue(
                id="SEC-001",
                title="Security audit for API endpoints",
                description="Conduct security review of all API endpoints for potential vulnerabilities.",
                category="Security",
                status="pending",
                priority="critical",
                createdAt=datetime.now().isoformat(),
                dueDate=(datetime.now() + timedelta(days=5)).isoformat()
            )
        ),
        
        # Bob Smith - API & Database expert
        AssignIssueRequest(
            developerEmail="bob@example.com",
            issue=PendingIssue(
                id="API-001",
                title="Optimize user profile API endpoint",
                description="The /api/users/{id}/profile endpoint is slow. Need to optimize database queries and add caching.",
                category="API",
                status="in_progress",
                priority="high",
                createdAt=datetime.now().isoformat(),
                dueDate=(datetime.now() + timedelta(days=4)).isoformat()
            )
        ),
        AssignIssueRequest(
            developerEmail="bob@example.com",
            issue=PendingIssue(
                id="DB-001",
                title="Database migration for user table",
                description="Add new columns to user table: last_login, email_verified. Create migration script.",
                category="Database",
                status="pending",
                priority="medium",
                createdAt=datetime.now().isoformat(),
                dueDate=(datetime.now() + timedelta(days=6)).isoformat()
            )
        ),
        
        # Diana Prince - UI & Performance expert
        AssignIssueRequest(
            developerEmail="diana@example.com",
            issue=PendingIssue(
                id="UI-001",
                title="Redesign dashboard layout",
                description="Improve user experience with new responsive dashboard design. Add dark mode support.",
                category="UI",
                status="pending",
                priority="medium",
                createdAt=datetime.now().isoformat(),
                dueDate=(datetime.now() + timedelta(days=10)).isoformat()
            )
        ),
        AssignIssueRequest(
            developerEmail="diana@example.com",
            issue=PendingIssue(
                id="PERF-001",
                title="Optimize page load time",
                description="Homepage takes 5+ seconds to load. Need to implement lazy loading and code splitting.",
                category="Performance",
                status="in_progress",
                priority="high",
                createdAt=datetime.now().isoformat(),
                dueDate=(datetime.now() + timedelta(days=5)).isoformat()
            )
        ),
        
        # Alice Perera - Documentation & UI expert
        AssignIssueRequest(
            developerEmail="alice@example.com",
            issue=PendingIssue(
                id="DOC-001",
                title="Update API documentation",
                description="Document all new endpoints added in v2.0. Include request/response examples.",
                category="Documentation",
                status="pending",
                priority="low",
                createdAt=datetime.now().isoformat(),
                dueDate=(datetime.now() + timedelta(days=14)).isoformat()
            )
        ),
        AssignIssueRequest(
            developerEmail="alice@example.com",
            issue=PendingIssue(
                id="UI-002",
                title="Fix mobile responsive issues",
                description="Several pages break on mobile devices. Need to fix CSS media queries.",
                category="UI",
                status="pending",
                priority="medium",
                createdAt=datetime.now().isoformat(),
                dueDate=(datetime.now() + timedelta(days=7)).isoformat()
            )
        ),
        
        # Edward Norton - DevOps & Testing expert
        AssignIssueRequest(
            developerEmail="edward@example.com",
            issue=PendingIssue(
                id="DEVOPS-001",
                title="Set up CI/CD pipeline",
                description="Configure GitHub Actions for automated testing and deployment.",
                category="DevOps",
                status="in_progress",
                priority="high",
                createdAt=datetime.now().isoformat(),
                dueDate=(datetime.now() + timedelta(days=4)).isoformat()
            )
        ),
        AssignIssueRequest(
            developerEmail="edward@example.com",
            issue=PendingIssue(
                id="TEST-001",
                title="Add unit tests for authentication module",
                description="Increase test coverage for auth module to 90%. Currently at 65%.",
                category="Testing",
                status="pending",
                priority="medium",
                createdAt=datetime.now().isoformat(),
                dueDate=(datetime.now() + timedelta(days=8)).isoformat()
            )
        ),
    ]
    
    print("Adding sample pending issues to developer profiles...")
    print("-" * 60)
    
    success_count = 0
    for issue_req in issues:
        try:
            result = assign_issue_to_developer(issue_req)
            print(f"[OK] Assigned '{issue_req.issue.title}' to {result.name} ({issue_req.issue.category})")
            success_count += 1
        except Exception as e:
            print(f"[ERROR] Failed to assign '{issue_req.issue.title}': {e}")
    
    print("-" * 60)
    print(f"Successfully assigned {success_count} pending issues!")
    print("\nYou can now view pending issues in developer profiles.")


if __name__ == "__main__":
    add_sample_pending_issues()

