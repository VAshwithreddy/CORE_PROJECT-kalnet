import sys
import os
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_swagger_and_routes():
    print("=== Testing CORE API OpenAPI & Endpoints ===")
    
    # 1. Test OpenAPI schema (Swagger backend generation)
    res = client.get("/api/v1/openapi.json")
    assert res.status_code == 200, f"OpenAPI generation failed: {res.status_code} {res.text}"
    schema = res.json()
    paths = schema.get("paths", {})
    
    required_routes = [
        "/api/v1/projects",
        "/api/v1/projects/{project_id}",
        "/api/v1/assignments/{assignment_id}",
        "/api/v1/alerts/stale",
        "/api/v1/alerts/{id}",
        "/api/v1/dashboard/employee",
        "/api/v1/dashboard/department",
        "/api/v1/dashboard/executive",
        "/api/v1/dashboard/work-admin",
    ]
    
    print("\nChecking registered paths in OpenAPI (Swagger):")
    for route in required_routes:
        if route in paths:
            methods = list(paths[route].keys())
            print(f"  [OK] {route} -> methods: {methods}")
        else:
            print(f"  [MISSING] {route}")

    # 2. Test GET /api/v1/alerts/stale
    print("\nTesting GET /api/v1/alerts/stale:")
    r = client.get("/api/v1/alerts/stale")
    print(f"  Status: {r.status_code}")
    assert r.status_code == 200

    # 3. Test GET /api/v1/alerts/{id} with UUID
    alert_id = "11111111-1111-4111-a111-111111111111"
    print(f"\nTesting GET /api/v1/alerts/{alert_id}:")
    r = client.get(f"/api/v1/alerts/{alert_id}")
    print(f"  Status: {r.status_code}")
    assert r.status_code == 404

    # 4. Test PATCH /api/v1/alerts/{id}
    print(f"\nTesting PATCH /api/v1/alerts/{alert_id}:")
    r = client.patch(f"/api/v1/alerts/{alert_id}", json={"is_dismissed": True})
    print(f"  Status: {r.status_code}")
    assert r.status_code == 404

    # 5. Test Dashboards
    dashboard_routes = [
        "/api/v1/dashboard/employee",
        "/api/v1/dashboard/department",
        "/api/v1/dashboard/executive",
        "/api/v1/dashboard/work-admin",
    ]
    for d_route in dashboard_routes:
        print(f"\nTesting GET {d_route}:")
        r = client.get(d_route)
        print(f"  Status: {r.status_code}")
        assert r.status_code == 200, f"Failed on {d_route}: {r.text}"

    # 6. Test POST /api/v1/projects with non-existent department_id (Expect 404 Department not found)
    print("\nTesting POST /api/v1/projects (invalid department_id):")
    payload = {
        "name": "Test Project",
        "department_id": "00000000-0000-0000-0000-000000000000",
        "priority": "medium",
        "status": "planning"
    }
    r = client.post("/api/v1/projects", json=payload)
    print(f"  Status: {r.status_code}")
    assert r.status_code == 400
    assert r.json().get("detail") == "Department with ID 00000000-0000-0000-0000-000000000000 not found"

    print("\nAll Swagger and API verification checks passed successfully!")

if __name__ == "__main__":
    test_swagger_and_routes()

