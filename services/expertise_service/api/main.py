import os
from pathlib import Path
from typing import List, Optional
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# Load .env file if it exists (for local development)
try:
    from dotenv import load_dotenv
    # Try to load .env from service directory
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    # python-dotenv not installed, skip
    pass

from ..core.schemas import (
    AssignIssueRequest,
    AuthResponse,
    CategoryPreferences,
    DeveloperProfile,
    DeveloperProfileDetailResponse,
    DeveloperProfileIn,
    ExpertiseScores,
    CategoryCounts,
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
    WorkHistoryItem,
    Notification,
    IssueUpdatePayload,
)
from ..core import service
from ..core.notification_repository import get_user_notifications, mark_notification_read
from ..core.config import config
from ..core.auth import get_current_user
from ..core.schemas import UserPublic

# Validate configuration on startup
config.validate()

app = FastAPI(
    title="Expertise Recommendation Service",
    version=config.SERVICE_VERSION,
)

@app.get("/api/expertise/health")
def health_check():
    return {"status": "ok", "message": "Expertise service is reachable"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_manager(user: UserPublic = Depends(get_current_user)) -> UserPublic:
    """Allow access only for project managers."""
    if user.role != "manager":
        raise HTTPException(status_code=403, detail="Only project managers can access this resource")
    return user


@app.post("/api/expertise/predict", response_model=IssuePredictionResponse)
def predict_issue_category_endpoint(payload: IssuePredictionRequest) -> IssuePredictionResponse:
    return service.predict_issue(payload)


@app.post("/api/auth/register", response_model=AuthResponse)
def register_endpoint(payload: RegisterRequest) -> AuthResponse:
    try:
        return service.register_user(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/auth/login", response_model=AuthResponse)
def login_endpoint(payload: LoginRequest) -> AuthResponse:
    try:
        return service.login_user(payload)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.get("/api/auth/me")
def me_endpoint(user=Depends(get_current_user)):
    return user


@app.post("/api/expertise/issues", response_model=Issue)
def create_issue_endpoint(payload: IssueCreateRequest) -> Issue:
    """Create a new issue with category prediction and expert recommendations."""
    return service.create_and_predict_issue(payload)


@app.get("/api/expertise/issues", response_model=IssueListResponse)
def list_issues_endpoint(
    status: str = Query(None, description="Filter by status: pending, assigned, in_progress, done, resolved"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: UserPublic = Depends(require_manager),
) -> IssueListResponse:
    """List all issues with pagination and filtering."""
    try:
        return service.get_all_issues(status=status, page=page, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/expertise/issues/{issue_id}", response_model=Issue)
def update_issue_endpoint(
    issue_id: str,
    payload: IssueUpdatePayload,
    user: UserPublic = Depends(require_manager),
) -> Issue:
    """Update issue details from PM dashboard."""
    updated = service.update_issue(issue_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Issue not found")
    return updated


@app.delete("/api/expertise/issues/{issue_id}")
def delete_issue_endpoint(
    issue_id: str,
    user: UserPublic = Depends(require_manager),
):
    """Delete an issue from PM dashboard."""
    success = service.delete_issue(issue_id)
    if not success:
        raise HTTPException(status_code=404, detail="Issue not found")
    return {"status": "success", "message": f"Issue {issue_id} deleted"}


@app.get("/api/expertise/issues/{issue_id}", response_model=Issue)
def get_issue_endpoint(issue_id: str) -> Issue:
    """Get issue by ID."""
    print(f"DEBUG [API]: Receiving request for issue_id: '{issue_id}'")
    from ..core.issue_repository import get_issue_by_id
    issue = get_issue_by_id(issue_id)
    if not issue:
        print(f"DEBUG [API]: Issue '{issue_id}' not found in DB.")
        raise HTTPException(status_code=404, detail="Issue not found")
    
    print(f"DEBUG [API]: Issue found successfully: {issue.id}")
    return issue


@app.post("/api/expertise/issues/assign", response_model=Issue)
def assign_issue_from_dashboard_endpoint(
    payload: IssueAssignRequest,
    user: UserPublic = Depends(require_manager),
) -> Issue:
    """Assign issue to developer from Project Manager dashboard."""
    return service.assign_issue_from_dashboard(payload)


@app.post("/api/expertise/issues/{issue_id}/complete", response_model=Issue)
def complete_issue_endpoint(
    issue_id: str,
    developerEmail: str = Query(..., description="Email of developer completing the issue"),
    resolutionNote: Optional[str] = Query(None, description="Note from developer about how the issue was resolved")
) -> Issue:
    """Mark issue as done/resolved by expert."""
    return service.mark_issue_complete(issue_id, developerEmail, resolutionNote)


@app.get("/api/expertise/developers/{email}/issues", response_model=List[Issue])
def get_developer_issues_endpoint(email: str) -> List[Issue]:
    """Get all issues assigned to a developer."""
    return service.get_developer_issues(email)


@app.post("/api/expertise/developers", response_model=DeveloperProfile)
def upsert_developer_profile_endpoint(payload: DeveloperProfileIn) -> DeveloperProfile:
    return service.save_developer_profile(payload)


@app.get("/api/expertise/config")
def get_config_endpoint():
    """Get system configuration including categories."""
    return service.get_system_config()


@app.get("/api/expertise/developers/{email}", response_model=DeveloperProfile)
def get_developer_profile_endpoint(email: str) -> DeveloperProfile:
    dev = service.fetch_developer_profile(email)
    if not dev:
        raise HTTPException(status_code=404, detail="Developer not found")
    return dev


@app.get("/api/expertise/developers/{email}/detail", response_model=DeveloperProfileDetailResponse)
def get_developer_profile_detail_endpoint(email: str) -> DeveloperProfileDetailResponse:
    """Get developer profile with pending issues organized by category."""
    detail = service.get_developer_profile_detail(email)
    if not detail:
        raise HTTPException(status_code=404, detail="Developer not found")
    return detail


@app.get("/api/expertise/developers/{email}/pending-issues/{category}", response_model=list[PendingIssue])
def get_pending_issues_by_category_endpoint(
    email: str,
    category: str,
) -> list[PendingIssue]:
    """Get pending issues for a developer in a specific category."""
    dev = service.fetch_developer_profile(email)
    if not dev:
        raise HTTPException(status_code=404, detail="Developer not found")
    return service.get_pending_issues_for_category(email, category)


@app.get("/api/expertise/developers/{email}/resolved-issues/{category}", response_model=list[ResolvedIssue])
def get_resolved_issues_by_category_endpoint(
    email: str,
    category: str,
) -> list[ResolvedIssue]:
    """Get resolved issues for a developer in a specific category."""
    dev = service.fetch_developer_profile(email)
    if not dev:
        raise HTTPException(status_code=404, detail="Developer not found")
    return service.get_resolved_issues_for_category(email, category)


@app.post("/api/expertise/assign-issue", response_model=DeveloperProfile)
def assign_issue_endpoint(
    payload: AssignIssueRequest,
    user: UserPublic = Depends(require_manager),
) -> DeveloperProfile:
    """Assign a pending issue to a developer."""
    try:
        return service.assign_issue_to_developer(payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.delete("/api/expertise/developers/{email}/pending-issues/{category}/{issue_id}", response_model=DeveloperProfile)
def unassign_issue_endpoint(
    email: str,
    category: str,
    issue_id: str,
) -> DeveloperProfile:
    """Remove a pending issue from a developer."""
    try:
        return service.unassign_issue_from_developer(email, category, issue_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/expertise/resolve-issue", response_model=DeveloperProfile)
def resolve_issue_endpoint(payload: ResolveIssueRequest) -> DeveloperProfile:
    """Mark a pending issue as resolved."""
    try:
        return service.resolve_issue_for_developer(payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/expertise/create-submitter-profile", response_model=DeveloperProfile)
def create_submitter_profile_endpoint(
    email: str = Query(..., description="Email of the issue submitter"),
    name: str = Query(..., description="Name of the issue submitter"),
) -> DeveloperProfile:
    """Create or get a developer profile for the issue submitter."""
    # Check if profile exists
    existing = service.fetch_developer_profile(email)
    if existing:
        return existing
    
    # Create a new profile with default values
    new_profile = DeveloperProfileIn(
        email=email,
        name=name,
        expertise=ExpertiseScores(),  # All zeros initially
        jiraIssuesSolved=CategoryCounts(),  # All zeros initially
        githubCommits=CategoryCounts(),  # All zeros initially
    )
    return service.save_developer_profile(new_profile)


@app.get("/api/expertise/recommend", response_model=RecommendationResponse)
def recommend_developers_endpoint(
    category: str = Query(..., description="Issue category predicted by the model"),
    top_n: int = Query(3, ge=1, le=20),
    seed: Optional[str] = Query(None, description="Optional seed for diversity (issue id/title/etc)"),
) -> RecommendationResponse:
    return service.recommend_developers_for_category_seeded(category, top_n, seed=seed)


@app.get("/api/expertise/me/profile", response_model=DeveloperProfile)
def get_my_profile_endpoint(user=Depends(get_current_user)) -> DeveloperProfile:
    dev = service.fetch_developer_profile(user.email)
    if not dev:
        raise HTTPException(status_code=404, detail="Developer profile not found")
    return dev


@app.put("/api/expertise/me/preferences", response_model=DeveloperProfile)
def update_my_preferences_endpoint(
    payload: CategoryPreferences,
    user=Depends(get_current_user),
) -> DeveloperProfile:
    return service.set_my_preferences(user.email, payload)


@app.post("/api/expertise/me/work-history", response_model=DeveloperProfile)
def add_my_work_history_endpoint(
    payload: WorkHistoryItem,
    user=Depends(get_current_user),
) -> DeveloperProfile:
    return service.add_my_work_history(user.email, payload)


@app.get("/api/expertise/notifications", response_model=List[Notification])
def get_notifications_endpoint(
    unread_only: bool = Query(False, description="Filter for unread notifications only"),
    user=Depends(get_current_user)
) -> List[Notification]:
    """Get notifications for the current user."""
    return get_user_notifications(user.email, unread_only)


@app.put("/api/expertise/notifications/{notification_id}/read")
def mark_notification_read_endpoint(
    notification_id: str,
    user=Depends(get_current_user)
):
    """Mark a notification as read."""
    success = mark_notification_read(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "message": "AgileSense-AI Expertise Recommendation API is running!",
        "docs": "/docs"
    }


# To run locally:
# uvicorn services.expertise_service.api.main:app --reload


