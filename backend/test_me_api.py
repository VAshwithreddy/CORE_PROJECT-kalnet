import json
from datetime import datetime, timedelta, timezone
from jose import jwt
from fastapi.testclient import TestClient
from src.main import app
from src.core.config import settings
from src.core.database import SessionLocal
from src.models.person import Person

client = TestClient(app)

def _make_token(person_id: str, role: str) -> str:
    payload = {
        "sub": str(person_id),
        "email": "test@demo.com",
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")

def run_demo():
    print("=== API Demo for Current User Module ===\n")
    
    # Get a real person from DB
    db = SessionLocal()
    try:
        person = db.query(Person).first()
        person_id = person.id if person else "22222222-2222-2222-2222-222222222201"
        role = getattr(person, "role", "employee") if person else "employee"
    finally:
        db.close()

    token = _make_token(person_id, role)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. GET /api/v1/me
    print("1. Fetching basic user info (GET /api/v1/me)...")
    response = client.get("/api/v1/me", headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")
    
    # 2. GET /api/v1/me/profile
    print("2. Fetching user profile (GET /api/v1/me/profile)...")
    response = client.get("/api/v1/me/profile", headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")
    
    # 3. PATCH /api/v1/me/profile
    print("3. Updating user profile (PATCH /api/v1/me/profile)...")
    payload = {
        "first_name": "SuperAdmin",
        "bio": "I have been updated via the PATCH endpoint!"
    }
    print(f"Sending Payload: {json.dumps(payload, indent=2)}")
    response = client.patch("/api/v1/me/profile", json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")
    
    # 4. Verify Update with GET /api/v1/me/profile
    print("4. Verifying update (GET /api/v1/me/profile)...")
    response = client.get("/api/v1/me/profile", headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")
    
    print("=== Demo Complete ===")

if __name__ == "__main__":
    run_demo()

