import os
import sys
# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from uuid import UUID

load_dotenv(dotenv_path="c:\\Users\\aagya\\CORE_PROJECT-kalnet\\backend\\.env")
db_url = os.getenv("DATABASE_URL")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif not db_url.startswith("postgresql"):
    db_url = db_url.replace("postgres", "postgresql+psycopg2", 1)

engine = create_engine(db_url)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Set RLS session variables for Kabir Anand (department head for Product: '11111111-1111-1111-1111-111111111102')
from sqlalchemy import text
db.execute(text("SELECT set_config('app.current_user_id', '22222222-2222-2222-2222-222222222206', true)"))
db.execute(text("SELECT set_config('app.current_user_role', 'department_head', true)"))

from src.models.project import Project
from src.models.person import Person
from src.models.assignment import Assignment

# Let's run the exact same get_visible_projects logic:
current_user_id = UUID('22222222-2222-2222-2222-222222222206')
current_user_role = 'department_head'

from src.core.rbac import RBACService
visible_person_ids = RBACService.get_visible_person_ids(db, type('CurrentUser', (object,), {'person_id': current_user_id, 'role': current_user_role})())
print("Visible person IDs:", visible_person_ids)

project_ids = (
    db.query(Assignment.project_id)
    .filter(Assignment.person_id.in_(visible_person_ids))
    .distinct()
    .all()
)
pid_list = [p[0] for p in project_ids if p[0] is not None]
print("PID List from assignments:", pid_list)

caller = db.query(Person).filter(Person.id == current_user_id).first()
user_dept_id = caller.department_id if caller else None
print("User dept ID:", user_dept_id)

if user_dept_id:
    projects = db.query(Project).filter(
        (Project.id.in_(pid_list)) | (Project.department_id == user_dept_id)
    ).all()
else:
    projects = db.query(Project).filter(Project.id.in_(pid_list)).all()

print("Visible projects count:", len(projects))
for p in projects:
    print(p.id, p.name, p.department_id)
db.close()
