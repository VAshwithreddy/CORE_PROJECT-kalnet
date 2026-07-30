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
    # Hardcoded from .env to avoid any dotenv dependency issues
    DATABASE_URL = "postgresql://postgres.jgpklwlzxvlisiktgkzu:qwertyui1234%40%23%21.%26%26@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
    SECRET_KEY   = "core-api-super-secret-jwt-key-2026-change-in-production"

    import psycopg2
    from urllib.parse import urlparse, unquote

    parsed = urlparse(DATABASE_URL)
    user     = unquote(parsed.username or "")
    password = unquote(parsed.password or "")
    host     = parsed.hostname
    port     = parsed.port or 5432
    dbname   = parsed.path.lstrip("/").split("?")[0]

    try:
        conn = psycopg2.connect(
            host=host, port=port, dbname=dbname,
            user=user, password=password,
            sslmode="require"
        )
    except Exception as e:
        print(f"DB connection failed: {e}")
        return

    cur  = conn.cursor()
    exp  = int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
    roles = ["employee", "manager", "team_leader", "department_head", "executive"]
    lines = []

    for role in roles:
        cur.execute(
            "SELECT id, email FROM people WHERE role::text = %s LIMIT 1",
            (role,)
        )
        row = cur.fetchone()
        if not row:
            msg = f"[!] No user with role='{role}' in DB — skipping."
            print(msg)
            lines.append(msg)
            continue

        person_id, email = str(row[0]), row[1]
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
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
