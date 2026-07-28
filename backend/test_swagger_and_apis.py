import json
import sys
import traceback
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_apis():
    print("=== Testing CORE API Endpoints ===\n")
    
    # 1. Test OpenAPI/Swagger Generation
    print("1. Testing Swagger/OpenAPI Generation (/api/v1/openapi.json)...")
    try:
        response = client.get("/api/v1/openapi.json")
        if response.status_code == 200:
            print("   [SUCCESS] OpenAPI schema generated without errors.")
            schema = response.json()
            print(f"   [INFO] Total endpoints documented: {len(schema.get('paths', {}))}")
        else:
            print(f"   [FAILED] Status code {response.status_code}")
            print(f"   Error: {response.text}")
            return
    except Exception as e:
        print("   [CRASH] Error during OpenAPI generation!")
        traceback.print_exc()
        return

    print("\n2. Testing Core Endpoints...")
    
    endpoints = [
        ("People List", "/api/v1/people"),
        ("Projects List", "/api/v1/projects"),
        ("Weekly Digests List", "/api/v1/digests"),
    ]
    
    for name, path in endpoints:
        print(f"   Testing {name} (GET {path})...")
        try:
            res = client.get(path)
            if res.status_code == 200:
                print(f"   [SUCCESS] {name} returned 200 OK.")
            else:
                print(f"   [FAILED] Status code {res.status_code}")
                print(f"   Error: {res.text}")
        except Exception as e:
            print(f"   [CRASH] Error on {name}!")
            traceback.print_exc()

    print("\n=== All Tests Completed ===")

if __name__ == "__main__":
    test_apis()
