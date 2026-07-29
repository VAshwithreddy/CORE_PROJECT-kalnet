"""
test_assignments_fix.py
Verifies both fixes in-process using FastAPI TestClient (no live server needed).

Tests:
  1. GET /assignments with NO token           -> 401
  2. GET /assignments with an employee token  -> only that employee's own rows
  3. GET /assignments with a privileged token -> all assignments
  4. Swagger OpenAPI JSON has only ONE tag group for "Assignments"

Run:
    venv\\Scripts\\python.exe test_assignments_fix.py
"""
import sys
import os

# Force UTF-8 output so box/arrow chars never hit cp1252
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from datetime import datetime, timedelta, timezone
from jose import jwt
from src.core.config import settings

ALGORITHM = "HS256"


def _make_token(person_id: str, role: str) -> str:
    payload = {
        "sub": person_id,
        "email": f"{role}@test.com",
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


from fastapi.testclient import TestClient
from src.main import app
from src.core.database import SessionLocal
from src.models.assignment import Assignment
from src.models.person import Person
from src.models.enums import Role

client = TestClient(app, raise_server_exceptions=False)

results = []


def check(name: str, passed: bool, detail: str = ""):
    icon = "[PASS]" if passed else "[FAIL]"
    print(f"{icon}  {name}")
    if detail:
        print(f"       {detail}")
    results.append(passed)


# --------------------------------------------------------------------------
# Pull real data from DB
# --------------------------------------------------------------------------
db = SessionLocal()
try:
    first_assignment = db.query(Assignment).first()
    if not first_assignment:
        print("WARNING: No assignments in DB - cannot run tests. Seed data first.")
        sys.exit(1)

    employee_id = str(first_assignment.person_id)
    employee_count = db.query(Assignment).filter(
        Assignment.person_id == first_assignment.person_id
    ).count()
    total_count = db.query(Assignment).count()

    person = db.query(Person).filter(Person.id == first_assignment.person_id).first()
    person_role = person.role.value if hasattr(person.role, "value") else str(person.role)

    privileged_person = db.query(Person).filter(
        Person.role.in_([Role.executive, Role.work_admin, Role.system_admin, Role.department_head])
    ).first()
finally:
    db.close()

print("\n-- DB snapshot --------------------------------------------------")
print(f"   Total assignments : {total_count}")
print(f"   Test person       : {employee_id}  (role={person_role})")
print(f"   Their assignments : {employee_count}")
print(f"   Privileged person : {privileged_person.id if privileged_person else 'none found'}")
print("-----------------------------------------------------------------\n")

# --------------------------------------------------------------------------
# Test 1: No token -> 401
# --------------------------------------------------------------------------
r = client.get("/api/v1/assignments")
check(
    "No token -> 401 Unauthorized",
    r.status_code == 401,
    f"status={r.status_code}",
)

# --------------------------------------------------------------------------
# Test 2: Employee token -> only own assignments
# --------------------------------------------------------------------------
emp_token = _make_token(employee_id, "employee")
r = client.get("/api/v1/assignments", headers={"Authorization": f"Bearer {emp_token}"})
check(
    "Employee token -> HTTP 200",
    r.status_code == 200,
    f"status={r.status_code}  body={r.text[:300]}",
)
if r.status_code == 200:
    data = r.json()
    all_mine = all(str(a["person_id"]) == employee_id for a in data)
    check(
        f"Employee sees only their own rows ({len(data)} returned, {employee_count} expected)",
        all_mine and len(data) == employee_count,
        f"returned={len(data)}, expected={employee_count}, all_same_person={all_mine}",
    )
    check(
        "Data leak check: employee does NOT see all 16 assignments",
        len(data) < total_count or total_count == employee_count,
        f"returned={len(data)}, total={total_count}",
    )

# --------------------------------------------------------------------------
# Test 3: Privileged token -> all assignments
# --------------------------------------------------------------------------
if privileged_person:
    priv_role = privileged_person.role.value if hasattr(privileged_person.role, "value") else str(privileged_person.role)
    priv_token = _make_token(str(privileged_person.id), priv_role)
    r = client.get("/api/v1/assignments", headers={"Authorization": f"Bearer {priv_token}"})
    check(
        f"Privileged ({priv_role}) token -> HTTP 200",
        r.status_code == 200,
        f"status={r.status_code}",
    )
    if r.status_code == 200:
        data = r.json()
        check(
            f"Privileged user sees all {total_count} assignments",
            len(data) == total_count,
            f"returned={len(data)}, expected={total_count}",
        )
else:
    print("WARNING: No privileged person in DB - skipping privileged-role test")

# --------------------------------------------------------------------------
# Test 4: Swagger tag deduplication
# --------------------------------------------------------------------------
r = client.get("/api/v1/openapi.json")
check("OpenAPI JSON -> HTTP 200", r.status_code == 200)
if r.status_code == 200:
    spec = r.json()
    all_tags = [t["name"] for t in spec.get("tags", [])]
    assign_tags = [t for t in all_tags if t.lower() == "assignments"]
    check(
        "Only ONE 'Assignments' tag in OpenAPI spec (no duplicate)",
        len(assign_tags) <= 1,
        f"found: {all_tags}",
    )

    rogue = []
    for path, methods in spec.get("paths", {}).items():
        for method, op in methods.items():
            for tag in op.get("tags", []):
                if tag == "assignments":  # old lowercase duplicate
                    rogue.append(f"{method.upper()} {path}")
    check(
        "No route still carries the old lowercase 'assignments' tag",
        len(rogue) == 0,
        f"rogue routes: {rogue}" if rogue else "",
    )

# --------------------------------------------------------------------------
# Summary
# --------------------------------------------------------------------------
passed = sum(results)
total = len(results)
print(f"\n-- Results: {passed}/{total} passed {'(ALL GOOD)' if passed == total else '(FAILURES ABOVE)'} --\n")
sys.exit(0 if all(results) else 1)
