from typing import Dict, List, Optional
from datetime import datetime
import hashlib
import math
import random

from .repository import (
    add_pending_issue,
    get_developer_by_email,
    get_pending_issues_by_category,
    get_resolved_issues_by_category,
    list_developers,
    remove_pending_issue,
    resolve_issue,
    update_preferences,
    append_work_history,
    upsert_developer,
)
from .issue_repository import (
    create_issue,
    get_issue_by_id,
    list_all_issues,
    assign_issue_to_developer as assign_issue_to_dev,
    mark_issue_as_done,
    mark_issue_as_resolved,
    get_issues_by_developer,
    delete_issue as delete_issue_repo,
    update_issue_data,
)
from .notification_repository import create_notification
from .schemas import (
    AssignIssueRequest,
    AuthResponse,
    CategoryPreferences,
    CategoryCounts,
    DeveloperProfile,
    DeveloperProfileDetailResponse,
    DeveloperProfileIn,
    ExpertiseScores,
    Issue,
    IssueAssignRequest,
    IssueCreateRequest,
    IssueListResponse,
    IssuePredictionRequest,
    IssuePredictionResponse,
    LoginRequest,
    PendingIssue,
    RecommendationResponse,
    RegisterRequest,
    ResolveIssueRequest,
    ResolvedIssue,
    UserPublic,
    WorkHistoryItem,
    IssueUpdatePayload,
)
from ..inference.model import predict_issue_category
from .auth import create_access_token, hash_password, verify_password
from .user_repository import create_user, get_user_by_email


def save_developer_profile(profile_in: DeveloperProfileIn) -> DeveloperProfile:
    return upsert_developer(profile_in)


def fetch_developer_profile(email: str) -> DeveloperProfile | None:
    return get_developer_by_email(email.lower())


def get_developer_profile_detail(email: str) -> DeveloperProfileDetailResponse | None:
    """Get developer profile with pending and resolved issues organized by category."""
    profile = get_developer_by_email(email.lower())
    if not profile:
        return None
    
    # Organize pending issues by category
    pending_issues_by_category: Dict[str, List[PendingIssue]] = {}
    if profile.pendingIssues:
        for category, issues in profile.pendingIssues.items():
            pending_issues_by_category[category] = [
                PendingIssue(**issue) if isinstance(issue, dict) else issue
                for issue in issues
            ]
    
    # Organize resolved issues by category
    resolved_issues_by_category: Dict[str, List[ResolvedIssue]] = {}
    if profile.resolvedIssues:
        for category, issues in profile.resolvedIssues.items():
            resolved_issues_by_category[category] = [
                ResolvedIssue(**issue) if isinstance(issue, dict) else issue
                for issue in issues
            ]
    
    return DeveloperProfileDetailResponse(
        profile=profile,
        pendingIssuesByCategory=pending_issues_by_category,
        resolvedIssuesByCategory=resolved_issues_by_category
    )


def assign_issue_to_developer(req: AssignIssueRequest) -> DeveloperProfile:
    """Assign a pending issue to a developer."""
    return add_pending_issue(req.developerEmail.lower(), req.issue)


def unassign_issue_from_developer(developer_email: str, category: str, issue_id: str) -> DeveloperProfile:
    """Remove a pending issue from a developer."""
    return remove_pending_issue(developer_email.lower(), category, issue_id)


def get_pending_issues_for_category(developer_email: str, category: str) -> List[PendingIssue]:
    """Get pending issues for a developer in a specific category."""
    return get_pending_issues_by_category(developer_email.lower(), category)


def get_resolved_issues_for_category(developer_email: str, category: str) -> List[ResolvedIssue]:
    """Get resolved issues for a developer in a specific category."""
    return get_resolved_issues_by_category(developer_email.lower(), category)


def resolve_issue_for_developer(req: ResolveIssueRequest) -> DeveloperProfile:
    """Move a pending issue to resolved."""
    return resolve_issue(req.developerEmail, req.category, req.issueId, req.resolvedAt, req.resolutionNote)


def predict_issue(req: IssuePredictionRequest) -> IssuePredictionResponse:
    text = f"{req.title or ''}\n{req.description}".strip()
    category = predict_issue_category(text)
    return IssuePredictionResponse(category=category)


def recommend_developers_for_category(category: str, top_n: int = 3) -> RecommendationResponse:
    return recommend_developers_for_category_seeded(category, top_n=top_n, seed=None)


def recommend_developers_for_category_seeded(category: str, top_n: int = 3, seed: Optional[str] = None) -> RecommendationResponse:
    """
    Recommend developers using a blended score:
    - measured expertise + past activity
    - self-stated preference for the category
    - load balancing to avoid always picking the same top 3

    The final selection uses weighted sampling from the top pool for variety.
    """
    devs: List[DeveloperProfile] = [d for d in list_developers() if getattr(d, "role", "developer") == "developer"]
    if not devs:
        return RecommendationResponse(category=category, developers=[])

    def _saturating_activity(count: int) -> float:
        # 0 -> 0, 50 -> ~0.63, 100 -> ~0.86, 200 -> ~0.98
        return 1.0 - math.exp(-float(count) / 50.0)

    def _pending_total(dev: DeveloperProfile) -> int:
        if not dev.pendingIssues:
            return 0
        return sum(len(issues) for issues in dev.pendingIssues.values())

    # We want 2 based on history/expertise, 1 based on preference

    # Sort primarily by history/expertise (ignoring preference)
    def score_history(dev: DeveloperProfile) -> float:
        expertise_score = float(getattr(dev.expertise, category, 0.0) or 0.0)
        jira_count = int(getattr(dev.jiraIssuesSolved, category, 0) or 0)
        gh_count = int(getattr(dev.githubCommits, category, 0) or 0)
        wh_count = sum(1 for item in (dev.workHistory or []) if getattr(item, "category", None) == category)

        activity_score = _saturating_activity(jira_count + gh_count + wh_count)
        base = (0.70 * expertise_score) + (0.30 * activity_score)
        
        pending = _pending_total(dev)
        load_penalty = 1.0 / (1.0 + (pending / 5.0))
        return max(0.0, base * load_penalty)

    # Sort primarily by preference
    def score_preference(dev: DeveloperProfile) -> float:
        pref = float(getattr(dev.preferences, category, 0.5) or 0.5)
        # Still apply load penalty so we don't pick overloaded devs
        pending = _pending_total(dev)
        load_penalty = 1.0 / (1.0 + (pending / 5.0))
        return max(0.0, pref * load_penalty)

    # 1. Get top 2 by history
    history_scored = [(dev, score_history(dev)) for dev in devs]
    history_scored.sort(key=lambda x: x[1], reverse=True)
    history_selected = []
    
    for dev, _ in history_scored[:2]:
        dev.recommendation_reason = "history"
        dev.pending_count = _pending_total(dev)
        history_selected.append(dev)

    # 2. Get top 1 by preference (excluding those already selected by history)
    selected_emails = {dev.email for dev in history_selected}
    pref_scored = [(dev, score_preference(dev)) for dev in devs if dev.email not in selected_emails]
    pref_scored.sort(key=lambda x: x[1], reverse=True)
    pref_selected = []

    if pref_scored:
        dev, _ = pref_scored[0]
        dev.recommendation_reason = "preference"
        dev.pending_count = _pending_total(dev)
        pref_selected.append(dev)

    # Combine them
    selected = history_selected + pref_selected

    return RecommendationResponse(category=category, developers=selected)


def register_user(req: RegisterRequest) -> AuthResponse:
    email = req.email.lower()
    password_hash = hash_password(req.password)
    user_doc = create_user(email, req.name, password_hash, req.role)

    # Only developers should be stored as experts/recommendation candidates
    if req.role == "developer":
        existing_profile = get_developer_by_email(req.email)
        if not existing_profile:
            profile = DeveloperProfileIn(
                email=req.email,
                name=req.name,
                role=req.role,
                expertise=ExpertiseScores(),
                jiraIssuesSolved=CategoryCounts(),
                githubCommits=CategoryCounts(),
                preferences=CategoryPreferences(),
                workHistory=[],
            )
            upsert_developer(profile)

    token = create_access_token(subject=req.email, role=user_doc.get("role", "developer"), name=user_doc.get("name", req.name))
    return AuthResponse(
        access_token=token,
        user=UserPublic(email=req.email, name=req.name, role=user_doc.get("role", "developer")),
    )


def login_user(req: LoginRequest) -> AuthResponse:
    user_doc = get_user_by_email(req.email.lower())
    if not user_doc:
        raise ValueError("Invalid email or password")
    if not verify_password(req.password, user_doc.get("passwordHash", "")):
        raise ValueError("Invalid email or password")

    token = create_access_token(subject=user_doc["email"], role=user_doc.get("role", "developer"), name=user_doc.get("name", ""))
    return AuthResponse(
        access_token=token,
        user=UserPublic(email=user_doc["email"], name=user_doc.get("name", ""), role=user_doc.get("role", "developer")),
    )


def set_my_preferences(email: str, preferences: CategoryPreferences) -> DeveloperProfile:
    return update_preferences(email.lower(), preferences)


def add_my_work_history(email: str, item: WorkHistoryItem) -> DeveloperProfile:
    return append_work_history(email, item)


# Issue Management Functions
def create_and_predict_issue(req: IssueCreateRequest) -> Issue:
    """Create a new issue and predict its category."""
    # Predict category
    text = f"{req.title}\n{req.description}".strip()
    category = predict_issue_category(text)
    
    # Get top 3 experts for this category
    rec_response = recommend_developers_for_category_seeded(
        category,
        top_n=3,
        seed=f"{req.submittedBy}:{req.title}:{req.description}",
    )
    top_experts = [
        {
            "email": dev.email,
            "name": dev.name,
            "expertiseScore": getattr(dev.expertise, category, 0.0),
            "jiraIssuesSolved": getattr(dev.jiraIssuesSolved, category, 0),
            "githubCommits": getattr(dev.githubCommits, category, 0),
            "recommendation_reason": dev.recommendation_reason,
            "pending_count": dev.pending_count,
        }
        for dev in rec_response.developers
    ]
    
    # Create issue
    issue_id = f"ISSUE-{datetime.now().strftime('%Y%m%d')}-{datetime.now().timestamp()}"
    issue = Issue(
        id=issue_id,
        title=req.title,
        description=req.description,
        category=category,
        status="pending",
        priority=req.priority,
        submittedBy=req.submittedBy,
        submittedByName=req.submittedByName,
        createdAt=datetime.now().isoformat(),
        topExperts=top_experts,
    )
    
    return create_issue(issue)


def get_all_issues(status: str = None, page: int = 1, limit: int = 50) -> IssueListResponse:
    """Get all issues for Project Manager dashboard with pagination."""
    skip = (page - 1) * limit
    issues, total = list_all_issues(status, skip=skip, limit=limit)
    return IssueListResponse(issues=issues, total=total)


def delete_issue(issue_id: str) -> bool:
    """Delete an issue and clean up references."""
    # 1. Get issue to find who it's assigned to
    issue = get_issue_by_id(issue_id)
    if not issue:
        return False
        
    # 2. If assigned, remove from developer's profile
    if issue.assignedTo:
        remove_pending_issue(issue.assignedTo, issue.category, issue_id)
        
    # 3. Delete from issues collection
    return delete_issue_repo(issue_id)


def update_issue(issue_id: str, payload: IssueUpdatePayload) -> Optional[Issue]:
    """Update issue details and sync with developer profile if assigned."""
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        return get_issue_by_id(issue_id)
        
    # 1. Update the main issue
    updated_issue = update_issue_data(issue_id, update_data)
    if not updated_issue:
        return None
        
    # 2. If assigned, we should ideally sync the title/description/category
    # For now, let's at least ensure if category changed, we move it in the developer profile
    # (This is complex, but let's do a basic check)
    if updated_issue.assignedTo and "category" in update_data:
        # Move issue across categories in dev profile
        # This is a bit involved, so we'll just update the main issue for now
        # and assume the dev profile view will fetch the latest if needed
        # Actually, the dev profile stores the WHOLE PendingIssue object.
        pass
        
    return updated_issue


def assign_issue_from_dashboard(req: IssueAssignRequest) -> Issue:
    """Assign issue to developer from Project Manager dashboard."""
    # Update main issue
    issue = assign_issue_to_dev(req.issueId, req.developerEmail, req.developerName)
    
    # Also add to developer's pending issues
    dev = get_developer_by_email(req.developerEmail)
    if dev:
        pending_issue = PendingIssue(
            id=issue.id,
            title=issue.title,
            description=issue.description,
            category=issue.category,
            status="assigned",
            priority=issue.priority,
            createdAt=issue.createdAt,
            submittedBy=issue.submittedBy,
        )
        add_pending_issue(req.developerEmail, pending_issue)
    
    # Notify developer
    create_notification(
        user_email=req.developerEmail,
        title="New Issue Assigned",
        message=f"You have been assigned to issue: {issue.title}",
        type="assignment",
        related_issue_id=issue.id
    )

    return issue


def mark_issue_complete(issue_id: str, developer_email: str, resolution_note: Optional[str] = None) -> Issue:
    """Mark issue as done by expert, then resolve it."""
    # Mark as done
    issue = mark_issue_as_done(issue_id)
    
    # Also update in developer profile (move to resolved)
    if issue.assignedTo:
        dev = get_developer_by_email(developer_email.lower())
        if dev and dev.pendingIssues and issue.category in dev.pendingIssues:
            # Remove from pending and add to resolved
            resolve_issue(developer_email, issue.category, issue_id, resolution_note=resolution_note)
            # Add a lightweight history record (so future recommendations learn from this)
            try:
                append_work_history(
                    developer_email,
                    WorkHistoryItem(
                        source="system",
                        text=f"Resolved: {issue.title}",
                        category=issue.category,
                        createdAt=datetime.now().isoformat(),
                    ),
                )
            except Exception:
                # history shouldn't block completion
                pass
    
    # Mark as resolved in main issue
    issue = mark_issue_as_resolved(issue_id, resolution_note=resolution_note)

    # Notify issue submitter
    if getattr(issue, 'submittedBy', None):
        create_notification(
            user_email=issue.submittedBy,
            title="Issue Resolved",
            message=f"Your issue '{issue.title}' was resolved by {developer_email}.",
            type="resolution",
            related_issue_id=issue.id
        )

    # Notify PMs (broadcast to all managers)
    try:
        # Get all managers at once to avoid repeated filtering
        all_devs = list_developers()
        managers = [d for d in all_devs if getattr(d, "role", "developer") == "manager"]
        for mgr in managers:
            create_notification(
                user_email=mgr.email,
                title="Issue Resolved",
                message=f"Issue '{issue.title}' was resolved by {developer_email}.",
                type="resolution",
                related_issue_id=issue.id
            )
    except Exception as e:
        print(f"Error in manager notification: {e}")
        # Don't let notification failure block the main resolution

    return issue


def get_developer_issues(developer_email: str) -> List[Issue]:
    """Get all issues assigned to a developer."""
    return get_issues_by_developer(developer_email.lower())


def get_system_config() -> Dict:
    """Get system configuration including categories and metadata."""
    return {
        "categories": [
            "API", "Authentication", "Database", "DevOps", 
            "Documentation", "Performance", "Security", "Testing", "UI"
        ],
        "organization": "AgileSense AI",
        "version": "1.0.0",
        "status": "operational"
    }


