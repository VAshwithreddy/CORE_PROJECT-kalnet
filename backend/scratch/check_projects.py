import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(dotenv_path="c:\\Users\\aagya\\CORE_PROJECT-kalnet\\backend\\.env")
db_url = os.getenv("DATABASE_URL")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif not db_url.startswith("postgresql"):
    db_url = db_url.replace("postgres", "postgresql+psycopg2", 1)

engine = create_engine(db_url)
with engine.connect() as conn:
    res = conn.execute(text("SELECT id, name, department_id, owner_id, status FROM projects"))
    rows = res.fetchall()
    print(f"Total projects in DB: {len(rows)}")
    for row in rows:
        print(row)
