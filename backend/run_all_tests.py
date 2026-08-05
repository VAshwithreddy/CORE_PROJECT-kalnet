"""
Master Test Suite Runner for Backend
Runs all test scripts sequentially and reports status.
"""
import sys
import subprocess
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
python_exe = sys.executable

test_files = [
    "verify_swagger.py",
    "test_rls_and_auth.py",
    "test_assignments_fix.py",
    "test_me_api.py",
    "test_postman_collection.py",
]

def main():
    print("==========================================================")
    print("         RUNNING ALL BACKEND VERIFICATION TESTS           ")
    print("==========================================================\n")
    
    results = {}
    
    for test in test_files:
        test_path = os.path.join(backend_dir, test)
        if not os.path.exists(test_path):
            print(f"⚠️  Skipping {test} (file not found)")
            continue
            
        print(f"\n▶️ Running {test}...")
        print("-" * 50)
        
        ret = subprocess.run([python_exe, test_path], cwd=backend_dir)
        
        if ret.returncode == 0:
            results[test] = "PASSED ✅"
        else:
            results[test] = f"FAILED ❌ (Exit code {ret.returncode})"
            
    print("\n==========================================================")
    print("                 FINAL SUMMARY RESULTS                     ")
    print("==========================================================")
    for test, status in results.items():
        print(f" {test:<30} : {status}")
    print("==========================================================")

if __name__ == "__main__":
    main()
