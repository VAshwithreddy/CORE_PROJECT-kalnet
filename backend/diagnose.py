"""
Diagnostic script — runs against the live backend to capture real tracebacks.
Run this from: c:\\Users\\aagya\\CORE_PROJECT-kalnet\\backend
Command: python diagnose.py
"""
import sys
import os
sys.path.insert(0, os.path.abspath("."))

print("=" * 60)
print("STEP 1: Check .env / DATABASE_URL")
print("=" * 60)
from dotenv import load_dotenv
load_dotenv()
db_url = os.getenv("DATABASE_URL", "NOT SET")
print(f"DATABASE_URL = {db_url}")

print()
print("=" * 60)
print("STEP 2: Test raw TCP connection to database host")
print("=" * 60)
import socket
try:
    host = "db.jgpklwlzxvlisiktgkzu.supabase.co"
    port = 5432
    s = socket.create_connection((host, port), timeout=5)
    s.close()
    print(f"SUCCESS: TCP connection to {host}:{port} works.")
except Exception as e:
    print(f"FAIL: Cannot connect to {host}:{port} — {type(e).__name__}: {e}")

print()
print("=" * 60)
print("STEP 3: Test SQLAlchemy engine connection")
print("=" * 60)
try:
    from sqlalchemy import create_engine, text
    engine = create_engine(db_url, connect_args={"connect_timeout": 5})
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("SUCCESS: SQLAlchemy connected to database.")
except Exception as e:
    import traceback
    print(f"FAIL: SQLAlchemy connection error:")
    traceback.print_exc()

print()
print("=" * 60)
print("STEP 4: Import all models and check for import errors")
print("=" * 60)
try:
    import src.models
    print("SUCCESS: All models imported cleanly.")
    for name in src.models.__all__:
        print(f"  ✓ {name}")
except Exception as e:
    import traceback
    print("FAIL: Model import error:")
    traceback.print_exc()

print()
print("=" * 60)
print("STEP 5: Check all service imports")
print("=" * 60)
services = [
    "src.services.people",
    "src.services.departments",
    "src.services.projects",
    "src.services.assignments",
    "src.services.status_updates",
    "src.services.auth",
    "src.services.me",
    "src.services.alerts",
    "src.services.digests",
    "src.services.dashboards",
    "src.services.system",
    "src.services.health",
]
import importlib
for svc in services:
    try:
        importlib.import_module(svc)
        print(f"  ✓ {svc}")
    except Exception as e:
        print(f"  ✗ {svc} — {type(e).__name__}: {e}")

print()
print("=" * 60)
print("STEP 6: Test FastAPI app import")
print("=" * 60)
try:
    from src.main import app
    routes = [r.path for r in app.routes]
    print(f"SUCCESS: App loaded. {len(routes)} routes registered:")
    for r in sorted(routes):
        print(f"  {r}")
except Exception as e:
    import traceback
    print("FAIL: App import error:")
    traceback.print_exc()

print()
print("DIAGNOSIS COMPLETE")
