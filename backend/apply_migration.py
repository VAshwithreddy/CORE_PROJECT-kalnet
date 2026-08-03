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
    
    with open("migrations/001_rls_policies.sql", "r") as f:
        sql = f.read()

    print("Applying migration 001_rls_policies.sql...")
    with engine.connect() as conn:
        # We need to split the SQL and execute each statement or execute it all if the driver allows
        conn.execute(text(sql))
        conn.commit()
    print("Migration applied successfully.")

if __name__ == "__main__":
    main()
