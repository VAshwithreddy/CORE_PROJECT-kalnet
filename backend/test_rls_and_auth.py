import os
import sys
import traceback
from datetime import datetime, timedelta, timezone
from jose import jwt

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from src.main import app
from src.core.config import settings

client = TestClient(app)

def create_test_token(person_id: str, email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    payload = {
        "sub": person_id,
        "email": email,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")

def run_checks():
    print("=== Testing RLS & JWT Auth Fixes ===\n")
    
    # 1. Invalid JWT test (Auth issue check)
    print("1. Testing Invalid JWT Token (Expect 401)...")
    res = client.get("/api/v1/people", headers={"Authorization": "Bearer invalid.token.value"})
    print(f"   Status Code: {res.status_code}")
    print(f"   Response Detail: {res.json().get('detail')}")
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    assert res.json().get("detail") == "Could not validate credentials.", "Expected 'Could not validate credentials.'"
    print("   [SUCCESS] Invalid JWT correctly rejected with 401.")

    # 2. Team Leader RLS policy check (RLS recursion fix check)
    print("\n2. Testing Team Leader Role Query (Verify no RLS infinite recursion)...")
    from src.core.database import SessionLocal
    from src.models.person import Person
    db = SessionLocal()
    try:
        # Find any person in DB to test with team_leader role
        tl_user = db.query(Person).first()
        
        if tl_user:
            person_id_str = str(tl_user.id)
            email_str = tl_user.email
            role_str = "team_leader"
            print(f"   Testing Team Leader evaluation with User: {email_str} (ID: {person_id_str})")
            
            valid_token = create_test_token(person_id_str, email_str, role_str)
            headers = {"Authorization": f"Bearer {valid_token}"}
            
            res = client.get("/api/v1/people", headers=headers)
            print(f"   GET /api/v1/people Status Code: {res.status_code}")
            if res.status_code == 200:
                data = res.json()
                print(f"   [SUCCESS] Returned {len(data)} visible people records without RLS recursion error.")
            else:
                print(f"   [FAIL] Response: {res.text}")
                
            res_dash = client.get("/api/v1/dashboard/department", headers=headers)
            print(f"   GET /api/v1/dashboard/department Status Code: {res_dash.status_code}")
            if res_dash.status_code == 200:
                print("   [SUCCESS] Department dashboard loaded successfully with set_config RLS context.")
            else:
                print(f"   [FAIL] Response: {res_dash.text}")
        else:
            print("   [SKIP] No person records found in DB to test valid user query.")
    except Exception as e:
        print("   [ERROR] Exception during DB query test:")
        traceback.print_exc()
    finally:
        db.close()

    print("\n=== RLS & JWT Auth Verification Complete ===")

if __name__ == "__main__":
    run_checks()
