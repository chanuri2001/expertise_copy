import sys
import os
import json

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from services.expertise_service.core.service import recommend_developers_for_category, assign_issue_from_dashboard
from services.expertise_service.core.schemas import IssueAssignRequest, PendingIssue

def test_workload_penalty():
    print("--- Testing Workload Awareness ---")
    
    # 1. Get initial recommendation for Security
    # Elena usually has high security score
    rec = recommend_developers_for_category("Security")
    print(f"Top 3 experts for Security:")
    for d in rec.developers:
        print(f" - {d.name} (Score: {getattr(d.expertise, 'Security', 0)}, Workload: {d.workload_score}, Capacity: {d.capacity_percentage}%)")

    # 2. Assign a Critical issue to the top expert
    top_expert = rec.developers[0]
    print(f"\nAssigning a CRITICAL issue to {top_expert.name}...")
    
    # Simulated Issue Assign
    # Using internal logic to avoid needing a full running server for logic test
    # but we need to update the mock database
    from services.expertise_service.core.repository import add_pending_issue
    
    critical_issue = PendingIssue(
        id="VERIFY-CRIT-1",
        title="Critical Security Breach",
        description="Immediate fix required",
        category="Security",
        priority="critical",
        status="assigned"
    )
    
    add_pending_issue(top_expert.email, critical_issue)
    
    # 3. Check recommendation again
    print("\n--- After assigning CRITICAL issue (5 pts) ---")
    rec2 = recommend_developers_for_category("Security")
    for d in rec2.developers:
        print(f" - {d.name} (Workload: {d.workload_score}, Capacity: {d.capacity_percentage}%)")
    
    # Identify if ranking changed
    if rec2.developers[0].email != top_expert.email:
        print("\n[SUCCESS] Ranking changed! Expert with heavy workload was down-ranked.")
    else:
        print("\n[INFO] Ranking stayed same (maybe score gap was too wide), but check workload points.")

if __name__ == "__main__":
    test_workload_penalty()
