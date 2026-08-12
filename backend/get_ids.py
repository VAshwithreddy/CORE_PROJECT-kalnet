import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import models
from src.models.assignment import Assignment
from src.models.person import Person
from src.core.config import settings

def fetch_ids():
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        people = db.query(Person).all()
        print("\n--- ALL USERS IN DB ---")
        for p in people:
            role_val = p.role.value if hasattr(p.role, "value") else str(p.role)
            print(f"ID: {p.id} | Email: {p.email} | Role: {role_val} | Name: {p.full_name}")
        print("----------------------\n")
        
    finally:
        db.close()

if __name__ == "__main__":
    fetch_ids()
