from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        print("✅ Connected to Supabase PostgreSQL successfully!")
except Exception as e:
    print("❌ Connection failed")
    print(e)