"""
Postman Collection Automated Test Runner using FastAPI TestClient.
Executes all API requests defined in backend/postman_collection.json.
"""

import json
import os
import sys

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from datetime import datetime, timedelta, timezone
from jose import jwt
from fastapi.testclient import TestClient
from src.main import app
from src.core.config import settings

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

def run_tests():
    collection_path = os.path.join(backend_dir, "postman_collection.json")
    if not os.path.exists(collection_path):
        print(f"Error: {collection_path} not found.")
        sys.exit(1)

    with open(collection_path, "r", encoding="utf-8") as f:
        collection = json.load(f)

    base_url = "http://localhost:8000/api/v1"
    # Find base_url from variables if defined
    for var in collection.get("variable", []):
        if var.get("key") == "base_url":
            base_url = var.get("value", base_url)

    print("==========================================================")
    print(f" Running Postman Collection: {collection['info']['name']}")
    print(f" Base URL: {base_url}")
    print("==========================================================\n")

    total_tests = 0
    passed_tests = 0
    failed_tests = 0

    for item_group in collection.get("item", []):
        folder_name = item_group.get("name", "Unnamed Folder")
        print(f"📁 Folder: {folder_name}")

        for item in item_group.get("item", []):
            req_name = item.get("name", "Unnamed Request")
            req = item.get("request", {})
            method = req.get("method", "GET").upper()
            
            # Construct URL path
            raw_url = req.get("url", {}).get("raw", "")
            # Replace {{base_url}} with empty string to get relative path for TestClient
            relative_url = raw_url.replace("{{base_url}}", "/api/v1")

            headers = {}
            for h in req.get("header", []):
                headers[h["key"]] = h["value"]

            if "Authorization" not in headers or "{{" in headers.get("Authorization", ""):
                token = _make_token("22222222-2222-2222-2222-222222222206", "system_admin")
                headers["Authorization"] = f"Bearer {token}"

            body = None
            if "body" in req and req["body"].get("mode") == "raw":
                try:
                    body = json.loads(req["body"].get("raw", "{}"))
                except Exception:
                    body = req["body"].get("raw")

            if relative_url.endswith("/auth/login") and isinstance(body, dict):
                body["username"] = "sarah.chen@kalnet.demo"

            total_tests += 1
            try:
                if method == "GET":
                    res = client.get(relative_url, headers=headers)
                elif method == "POST":
                    res = client.post(relative_url, json=body if isinstance(body, dict) else None, data=body if isinstance(body, str) else None, headers=headers)
                elif method == "PATCH":
                    res = client.patch(relative_url, json=body if isinstance(body, dict) else None, data=body if isinstance(body, str) else None, headers=headers)
                elif method == "PUT":
                    res = client.put(relative_url, json=body if isinstance(body, dict) else None, data=body if isinstance(body, str) else None, headers=headers)
                elif method == "DELETE":
                    res = client.delete(relative_url, headers=headers)
                else:
                    res = client.request(method, relative_url, headers=headers)

                if res.status_code in [200, 201]:
                    passed_tests += 1
                    print(f"  ✅ [PASS] {method} {relative_url} -> Status {res.status_code} ({req_name})")
                else:
                    failed_tests += 1
                    print(f"  ❌ [FAIL] {method} {relative_url} -> Status {res.status_code} ({req_name})")
                    print(f"      Response: {res.text[:200]}")
            except Exception as e:
                failed_tests += 1
                print(f"  💥 [ERROR] {method} {relative_url} -> Exception: {e}")

        print()

    print("==========================================================")
    print(f" Summary: Total: {total_tests} | Passed: {passed_tests} | Failed: {failed_tests}")
    print("==========================================================")

    return failed_tests == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
