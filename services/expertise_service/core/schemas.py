from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, EmailStr


class ExpertiseScores(BaseModel):
    API: float = Field(0.0, ge=0.0, le=1.0)
    Authentication: float = Field(0.0, ge=0.0, le=1.0)
    Database: float = Field(0.0, ge=0.0, le=1.0)
    DevOps: float = Field(0.0, ge=0.0, le=1.0)
    Documentation: float = Field(0.0, ge=0.0, le=1.0)
    Performance: float = Field(0.0, ge=0.0, le=1.0)
    Security: float = Field(0.0, ge=0.0, le=1.0)
    Testing: float = Field(0.0, ge=0.0, le=1.0)
    UI: float = Field(0.0, ge=0.0, le=1.0)


class CategoryCounts(BaseModel):
    API: int = 0
    Authentication: int = 0
    Database: int = 0
    DevOps: int = 0
    Documentation: int = 0
    Performance: int = 0
    Security: int = 0
    Testing: int = 0
    UI: int = 0


class CategoryPreferences(BaseModel):
    """
    Developer self-stated preferences for categories.
    0.0 = dislikes/avoid, 1.0 = loves/seek out.
    """
    API: float = Field(0.5, ge=0.0, le=1.0)
    Authentication: float = Field(0.5, ge=0.0, le=1.0)
    Database: float = Field(0.5, ge=0.0, le=1.0)
    DevOps: float = Field(0.5, ge=0.0, le=1.0)
    Documentation: float = Field(0.5, ge=0.0, le=1.0)
    Performance: float = Field(0.5, ge=0.0, le=1.0)
    Security: float = Field(0.5, ge=0.0, le=1.0)
    Testing: float = Field(0.5, ge=0.0, le=1.0)
    UI: float = Field(0.5, ge=0.0, le=1.0)


class WorkHistoryItem(BaseModel):
    """
    A lightweight record of past work (Jira/GitHub/manual).
    This helps diversify and improve recommendations beyond static category counts.
    """
    source: str = Field(..., description="jira|github|manual|system")
    text: str
    category: str
    createdAt: Optional[str] = None


class PendingIssue(BaseModel):
    id: str
    title: str
    description: str
    category: str
    status: str = "pending"  # pending, in_progress, blocked
    priority: str = "medium"  # low, medium, high, critical
    createdAt: Optional[str] = None
    dueDate: Optional[str] = None
    submittedBy: Optional[str] = None  # Email of person who raised the issue


class ResolvedIssue(BaseModel):
    id: str
    title: str
    description: str
    category: str
    priority: str = "medium"
    createdAt: Optional[str] = None
    resolvedAt: Optional[str] = None
    submittedBy: Optional[str] = None
    resolutionNote: Optional[str] = None


class DeveloperProfileIn(BaseModel):
    email: EmailStr
    name: str
    role: str = "developer"  # developer | manager (managers are not recommended as experts)
    status: str = "Active"  # Active | Busy | Off Duty
    efficiency: float = 0.94  # 0.0 to 1.0
    expertise: ExpertiseScores
    jiraIssuesSolved: CategoryCounts
    githubCommits: CategoryCounts
    preferences: Optional[CategoryPreferences] = None
    workHistory: Optional[List[WorkHistoryItem]] = None
    pendingIssues: Optional[Dict[str, List[PendingIssue]]] = None
    resolvedIssues: Optional[Dict[str, List[ResolvedIssue]]] = None


class DeveloperProfile(DeveloperProfileIn):
    id: Optional[str] = None
    recommendation_reason: Optional[str] = None
    pending_count: Optional[int] = None


class UserPublic(BaseModel):
    email: EmailStr
    name: str
    role: str = "developer"  # developer | manager


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str = Field(..., min_length=6, max_length=72)
    role: str = "developer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class IssuePredictionRequest(BaseModel):
    title: Optional[str] = None
    description: str
    submittedBy: Optional[EmailStr] = None  # Email of person who raised the issue
    submittedByName: Optional[str] = None  # Name of person who raised the issue


class IssuePredictionResponse(BaseModel):
    category: str
    probabilities: Optional[Dict[str, float]] = None


class RecommendationResponse(BaseModel):
    category: str
    developers: list[DeveloperProfile]


class Notification(BaseModel):
    id: str
    userEmail: EmailStr
    title: str
    message: str
    type: str  # e.g., 'assignment', 'resolution', 'system'
    relatedIssueId: Optional[str] = None
    createdAt: str
    read: bool = False


class DeveloperProfileDetailResponse(BaseModel):
    profile: DeveloperProfile
    pendingIssuesByCategory: Dict[str, List[PendingIssue]]
    resolvedIssuesByCategory: Dict[str, List[ResolvedIssue]]


class AssignIssueRequest(BaseModel):
    developerEmail: EmailStr
    issue: PendingIssue


class ResolveIssueRequest(BaseModel):
    developerEmail: EmailStr
    category: str
    issueId: str
    resolvedAt: Optional[str] = None
    resolutionNote: Optional[str] = None


class Issue(BaseModel):
    """Main issue model stored in issues collection."""
    id: str
    title: str
    description: str
    category: str
    status: str = "pending"  # pending, assigned, in_progress, done, resolved
    priority: str = "medium"
    submittedBy: EmailStr
    submittedByName: Optional[str] = None
    assignedTo: Optional[EmailStr] = None  # Expert assigned to fix
    assignedToName: Optional[str] = None
    createdAt: str
    assignedAt: Optional[str] = None
    resolvedAt: Optional[str] = None
    resolutionNote: Optional[str] = None
    topExperts: Optional[List[Dict]] = None  # Top 3 recommended experts


class IssueCreateRequest(BaseModel):
    title: str
    description: str
    submittedBy: EmailStr
    submittedByName: Optional[str] = None
    priority: str = "medium"


class IssueListResponse(BaseModel):
    issues: List[Issue]
    total: int


class IssueAssignRequest(BaseModel):
    issueId: str
    developerEmail: EmailStr
    developerName: str


class IssueUpdatePayload(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
