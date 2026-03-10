
from services.expertise_service.inference.model import predict_issue_category

title = "Repositories database access is declined"
description = "repo is not working"
text = f"{title}\n{description}".strip()

category = predict_issue_category(text)

print(f"\nTitle: {title}")
print(f"Description: {description}")
print(f"Predicted Category: {category}")
