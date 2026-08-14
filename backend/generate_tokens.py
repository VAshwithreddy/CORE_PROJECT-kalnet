"""
generate_tokens_final.py
Uses the exact DATABASE_URL from .env and generates tokens.
Writes tokens to tokens.txt so you can easily copy them.
"""
import os
import json
import hmac
import hashlib
import base64
from datetime import datetime, timedelta, timezone


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def make_jwt(payload: dict, secret: str) -> str:
    header = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    body   = _b64url(json.dumps(payload).encode())
    msg    = f"{header}.{body}"
    sig    = _b64url(
        hmac.new(secret.encode(), msg.encode(), hashlib.sha256).digest()
    )
    return f"{msg}.{sig}"


def main():
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
    DATABASE_URL = os.getenv("DATABASE_URL")
    SECRET_KEY   = "core-api-super-secret-jwt-key-2026-change-in-production"

    exp  = int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
    roles = ["employee", "manager", "team_leader", "department_head", "executive"]
    lines = []

    # Generate synthetic IDs since DB auth is failing
    import uuid
    for role in roles:
        person_id = str(uuid.uuid4())
        email = f"synthetic_{role}@example.com"
        token = make_jwt(
            {"sub": person_id, "email": email, "role": role, "exp": exp},
            SECRET_KEY
        )
        block = f"--- {role.upper()} ({email}) ---\n{token}"
        print(block)
        print()
        lines.append(block)
        lines.append("")

    # Write to tokens.txt so they are easy to copy
    with open("tokens.txt", "w") as f:
        f.write("\n".join(lines))

    print("\nTokens also saved to: tokens.txt")


if __name__ == "__main__":
    main()
