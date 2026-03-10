
from services.expertise_service.inference.model import predict_issue_category

text = "Repositories database access is declined"
category = predict_issue_category(text)

print(f"\nText: {text}")
print(f"Predicted Category: {category}")
