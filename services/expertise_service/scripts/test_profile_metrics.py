
from services.expertise_service.core.service import fetch_developer_profile
import json

email = "alex@gmail.com"
profile = fetch_developer_profile(email)

if profile:
    print("\n--- RESULTS ---")
    print(f"Name: {profile.name}")
    print(f"Workload Score: {profile.workload_score}")
    print(f"Capacity: {profile.capacity_percentage}%")
    print(f"Pending Issues Keys: {list(profile.pendingIssues.keys()) if profile.pendingIssues else 'None'}")
else:
    print(f"Profile for {email} not found.")
