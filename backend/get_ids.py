import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import models
from src.models.assignment import Assignment
from src.models.person import Person
from src.core.config import settings

def fetch_ids():
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        assignment = db.query(Assignment).first()
        person = db.query(Person).first()
        
        print("\n--- TEST IDs FOR SWAGGER ---")
        if assignment:
            print(f"Assignment ID: {assignment.id}")
        else:
            print("Assignment ID: (No assignments exist in the database!)")
            
        if person:
            print(f"Person/Author ID: {person.id}")
        else:
            print("Person/Author ID: (No people exist in the database!)")
        print("----------------------------\n")
        
    finally:
        db.close()

if __name__ == "__main__":
    fetch_ids()
