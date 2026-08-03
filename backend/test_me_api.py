import json
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def run_demo():
    print("=== API Demo for Current User Module ===\n")
    
    # 1. GET /api/v1/me
    print("1. Fetching basic user info (GET /api/v1/me)...")
    response = client.get("/api/v1/me")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")
    
    # 2. GET /api/v1/me/profile
    print("2. Fetching user profile (GET /api/v1/me/profile)...")
    response = client.get("/api/v1/me/profile")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")
    
    # 3. PATCH /api/v1/me/profile
    print("3. Updating user profile (PATCH /api/v1/me/profile)...")
    payload = {
        "first_name": "SuperAdmin",
        "bio": "I have been updated via the PATCH endpoint!"
    }
    print(f"Sending Payload: {json.dumps(payload, indent=2)}")
    response = client.patch("/api/v1/me/profile", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")
    
    # 4. Verify Update with GET /api/v1/me/profile
    print("4. Verifying update (GET /api/v1/me/profile)...")
    response = client.get("/api/v1/me/profile")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")
    
    print("=== Demo Complete ===")

if __name__ == "__main__":
    run_demo()
