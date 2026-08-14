import urllib.request
import json
token = "eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJzdWIiOiAiNmUzMzA2ZWMtNzk0Yy00YTBlLWJkM2ItYmMxYjZiMDA2YjdlIiwgImVtYWlsIjogInN5bnRoZXRpY19lbXBsb3llZUBleGFtcGxlLmNvbSIsICJyb2xlIjogImVtcGxveWVlIiwgImV4cCI6IDE3ODY2NDQ0ODR9.-Zica_bKS9MONSGR4dsmilBHCpsWzhRXsnbqt3r5TEU"
req = urllib.request.Request("http://127.0.0.1:8000/api/v1/notifications", headers={"Authorization": f"Bearer {token}"})
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        data = json.loads(response.read().decode())
        print("Data:", json.dumps(data, indent=2))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Error body:", e.read().decode())
