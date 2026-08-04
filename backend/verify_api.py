"""
Quick API verification script — tests POST and PATCH endpoints.
Run with: python verify_api.py
"""
import json
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8000/api/v1"

def post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{BASE}{path}", data=data,
        headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req) as r:
            resp = json.loads(r.read())
            return r.status, resp
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def patch(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{BASE}{path}", data=data,
        headers={"Content-Type": "application/json"}, method="PATCH"
    )
    try:
        with urllib.request.urlopen(req) as r:
            resp = json.loads(r.read())
            return r.status, resp
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def get(path):
    try:
        with urllib.request.urlopen(f"{BASE}{path}") as r:
            resp = json.loads(r.read())
            return r.status, resp
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

print("=" * 60)
print("CORE API — POST / PATCH Verification")
print("=" * 60)

# ── Test 1: POST /projects ────────────────────────────────────────
print("\n[1] POST /projects")
s, r = post("/projects", {
    "name": "Verify Test Project",
    "department_id": "11111111-1111-1111-1111-111111111101",
    "priority": "high",
    "status": "planned"
})
print(f"  Status : {s}")
if s in (200, 201):
    print(f"  Name   : {r.get('name')}")
    print(f"  Dept   : {r.get('department_name')}")
    created_project_id = r.get("id")
    print(f"  ID     : {created_project_id}")
else:
    print(f"  Error  : {r}")
    created_project_id = None

# ── Test 2: POST /assignments ─────────────────────────────────────
print("\n[2] POST /assignments")
s, r = post("/assignments", {
    "project_id": "33333333-3333-3333-3333-333333333301",
    "person_id": "22222222-2222-2222-2222-222222222204",
    "role": "developer",
    "status": "active",
    "start_date": "2026-07-25"
})
print(f"  Status : {s}")
if s in (200, 201):
    print(f"  Person : {r.get('person_name')}")
    print(f"  Project: {r.get('project_name')}")
    print(f"  Role   : {r.get('role')}")
    created_assignment_id = r.get("id")
    print(f"  ID     : {created_assignment_id}")
else:
    print(f"  Error  : {r}")
    created_assignment_id = None

# ── Test 3: PATCH /assignments/{id} ──────────────────────────────
print("\n[3] PATCH /assignments/{id}")
patch_id = created_assignment_id or "44444444-4444-4444-4444-444444444401"
s, r = patch(f"/assignments/{patch_id}", {"status": "paused"})
print(f"  Status : {s}")
if s in (200, 201):
    print(f"  Person : {r.get('person_name')}")
    print(f"  Status : {r.get('status')}")
else:
    print(f"  Error  : {r}")

# ── Test 4: PATCH /projects/{id} ─────────────────────────────────
print("\n[4] PATCH /projects/{id}")
if created_project_id:
    s, r = patch(f"/projects/{created_project_id}", {"status": "active", "priority": "critical"})
    print(f"  Status : {s}")
    if s in (200, 201):
        print(f"  Name   : {r.get('name')}")
        print(f"  Status : {r.get('status')}")
        print(f"  Prio   : {r.get('priority')}")
    else:
        print(f"  Error  : {r}")
else:
    print("  Skipped — no project ID from step 1")

# ── Test 5: POST /status-updates/{assignment_id} ──────────────────
print("\n[5] POST /status-updates/{id}/updates")
s, r = post("/status-updates/44444444-4444-4444-4444-444444444401/updates", {
    "author_id": "22222222-2222-2222-2222-222222222202",
    "status": "on_track",
    "message": "Making great progress on the DB migration.",
    "blockers": None
})
print(f"  Status : {s}")
if s in (200, 201):
    print(f"  Author : {r.get('author_name')}")
    print(f"  Status : {r.get('status')}")
    print(f"  Msg    : {r.get('message')}")
else:
    print(f"  Error  : {r}")

# ── Test 6: GET /me ───────────────────────────────────────────────
print("\n[6] GET /me")
s, r = get("/me")
print(f"  Status : {s}")
if s == 200:
    print(f"  User   : {r.get('username')}")
    print(f"  Email  : {r.get('email')}")
else:
    print(f"  Error  : {r}")

# ── Test 7: GET /alerts ───────────────────────────────────────────
print("\n[7] GET /alerts")
s, r = get("/alerts")
print(f"  Status : {s}")
if s == 200:
    print(f"  Count  : {len(r)}")
else:
    print(f"  Error  : {r}")

# ── Test 8: GET /dashboards/executive ────────────────────────────
print("\n[8] GET /dashboards/executive")
s, r = get("/dashboards/executive")
print(f"  Status : {s}")
if s == 200:
    org = r.get("organization_summary", {})
    print(f"  People : {org.get('total_people')}")
    print(f"  Depts  : {org.get('total_departments')}")
    print(f"  Projects: {org.get('total_projects')}")
else:
    print(f"  Error  : {r}")

print("\n" + "=" * 60)
print("All tests complete.")
print("=" * 60)
