import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


def main():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL is not set in .env")
        return

    # Handle postgres:// vs postgresql://
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    print(f"Connecting to database...")
    engine = create_engine(db_url)

    migrations_dir = Path(__file__).parent / "migrations"
    sql_files = sorted(path for path in migrations_dir.glob("*.sql"))

    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """))

    for path in sql_files:
        with engine.begin() as conn:
            already_applied = conn.execute(
                text("SELECT 1 FROM schema_migrations WHERE filename = :filename"),
                {"filename": path.name},
            ).scalar()
            if already_applied:
                print(f"Skipping {path.name}; already applied.")
                continue

            print(f"Applying migration {path.name}...")
            conn.execute(text(path.read_text(encoding="utf-8")))
            conn.execute(
                text("INSERT INTO schema_migrations (filename) VALUES (:filename)"),
                {"filename": path.name},
            )
            print(f"Migration {path.name} applied successfully.")

    print("All migrations applied successfully.")

if __name__ == "__main__":
    main()
