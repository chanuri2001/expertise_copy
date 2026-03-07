"""
Script to populate MongoDB with sample developer profiles.
Run this script to add test data for the expertise recommendation system.

Usage:
    python -m services.expertise_service.scripts.populate_sample_profiles
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from services.expertise_service.core.schemas import DeveloperProfileIn, ExpertiseScores, CategoryCounts
from services.expertise_service.core.repository import upsert_developer


def create_sample_profiles():
    """Create sample developer profiles."""
    
    # Alice Perera - Documentation & UI expert
    alice = DeveloperProfileIn(
        email="alice@example.com",
        name="Alice Perera",
        expertise=ExpertiseScores(
            API=0.82,
            Authentication=0.31,
            Database=0.65,
            DevOps=0.22,
            Documentation=0.99,
            Performance=0.79,
            Security=0.32,
            Testing=0.65,
            UI=0.87
        ),
        jiraIssuesSolved=CategoryCounts(
            API=23,
            Authentication=87,
            Database=98,
            DevOps=23,
            Documentation=77,
            Performance=88,
            Security=76,
            Testing=55,
            UI=87
        ),
        githubCommits=CategoryCounts(
            API=82,
            Authentication=31,
            Database=65,
            DevOps=22,
            Documentation=99,
            Performance=79,
            Security=32,
            Testing=65,
            UI=87
        )
    )
    
    # Bob Smith - API & Database expert
    bob = DeveloperProfileIn(
        email="bob@example.com",
        name="Bob Smith",
        expertise=ExpertiseScores(
            API=0.95,
            Authentication=0.75,
            Database=0.92,
            DevOps=0.45,
            Documentation=0.55,
            Performance=0.88,
            Security=0.68,
            Testing=0.72,
            UI=0.42
        ),
        jiraIssuesSolved=CategoryCounts(
            API=145,
            Authentication=67,
            Database=132,
            DevOps=34,
            Documentation=28,
            Performance=91,
            Security=54,
            Testing=78,
            UI=19
        ),
        githubCommits=CategoryCounts(
            API=156,
            Authentication=72,
            Database=148,
            DevOps=41,
            Documentation=32,
            Performance=95,
            Security=61,
            Testing=85,
            UI=22
        )
    )
    
    # Charlie Brown - Authentication & Security expert
    charlie = DeveloperProfileIn(
        email="charlie@example.com",
        name="Charlie Brown",
        expertise=ExpertiseScores(
            API=0.68,
            Authentication=0.96,
            Database=0.58,
            DevOps=0.35,
            Documentation=0.48,
            Performance=0.65,
            Security=0.94,
            Testing=0.78,
            UI=0.38
        ),
        jiraIssuesSolved=CategoryCounts(
            API=52,
            Authentication=156,
            Database=48,
            DevOps=22,
            Documentation=31,
            Performance=54,
            Security=142,
            Testing=89,
            UI=15
        ),
        githubCommits=CategoryCounts(
            API=61,
            Authentication=168,
            Database=55,
            DevOps=28,
            Documentation=38,
            Performance=62,
            Security=151,
            Testing=94,
            UI=18
        )
    )
    
    # Diana Prince - UI & Performance expert
    diana = DeveloperProfileIn(
        email="diana@example.com",
        name="Diana Prince",
        expertise=ExpertiseScores(
            API=0.52,
            Authentication=0.45,
            Database=0.48,
            DevOps=0.28,
            Documentation=0.65,
            Performance=0.91,
            Security=0.42,
            Testing=0.68,
            UI=0.97
        ),
        jiraIssuesSolved=CategoryCounts(
            API=38,
            Authentication=42,
            Database=35,
            DevOps=18,
            Documentation=58,
            Performance=124,
            Security=33,
            Testing=71,
            UI=158
        ),
        githubCommits=CategoryCounts(
            API=45,
            Authentication=48,
            Database=41,
            DevOps=22,
            Documentation=67,
            Performance=132,
            Security=38,
            Testing=78,
            UI=167
        )
    )
    
    # Edward Norton - DevOps & Testing expert
    edward = DeveloperProfileIn(
        email="edward@example.com",
        name="Edward Norton",
        expertise=ExpertiseScores(
            API=0.72,
            Authentication=0.58,
            Database=0.65,
            DevOps=0.89,
            Documentation=0.52,
            Performance=0.75,
            Security=0.68,
            Testing=0.92,
            UI=0.48
        ),
        jiraIssuesSolved=CategoryCounts(
            API=68,
            Authentication=54,
            Database=72,
            DevOps=134,
            Documentation=41,
            Performance=82,
            Security=61,
            Testing=148,
            UI=38
        ),
        githubCommits=CategoryCounts(
            API=75,
            Authentication=61,
            Database=78,
            DevOps=142,
            Documentation=48,
            Performance=89,
            Security=68,
            Testing=156,
            UI=42
        )
    )
    
    profiles = [alice, bob, charlie, diana, edward]
    
    print("Adding sample developer profiles to MongoDB...")
    print("-" * 60)
    
    for profile in profiles:
        try:
            result = upsert_developer(profile)
            print(f"[OK] Added/Updated: {result.name} ({result.email})")
        except Exception as e:
            print(f"[ERROR] Error adding {profile.name}: {e}")
    
    print("-" * 60)
    print(f"Successfully populated {len(profiles)} developer profiles!")
    print("\nYou can now test the expertise recommendation feature.")


if __name__ == "__main__":
    create_sample_profiles()

