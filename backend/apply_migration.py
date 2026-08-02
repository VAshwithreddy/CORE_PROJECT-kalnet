import os
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

    migrations_dir = "migrations"
    sql_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith(".sql")])

    with engine.connect() as conn:
        for fname in sql_files:
            fpath = os.path.join(migrations_dir, fname)
            print(f"Applying migration {fname}...")
            with open(fpath, "r", encoding="utf-8") as f:
                sql = f.read()
            conn.execute(text(sql))
            conn.commit()
            print(f"Migration {fname} applied successfully.")

    print("All migrations applied successfully.")

if __name__ == "__main__":
    main()
