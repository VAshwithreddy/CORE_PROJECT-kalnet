
import os
import logging

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from fastapi import HTTPException, status

# Load .env file
load_dotenv()

logger = logging.getLogger(__name__)

# Read DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL not found. Check your backend/.env file."
    )

# Convert postgres:// -> postgresql+psycopg2://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql+psycopg2://",
        1,
    )

logger.info("Using database host successfully.")

# Create SQLAlchemy engine
try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
    )

    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )

except Exception as e:
    logger.exception("Failed to create database engine")
    raise e

Base = declarative_base()


def init_db():
    """
    Creates tables and seeds default data.
    """
    import src.models  # Register all models

    Base.metadata.create_all(bind=engine)

    from src.models.service_account import ServiceAccount
    from src.models.staleness_alert import StalenessAlert
    from src.models.audit_log import AuditLog
    from src.models.assignment import Assignment
    from src.models.person import Person
    from src.models.project import Project

    db = SessionLocal()
    try:
        if db.query(ServiceAccount).count() == 0:
            sa1 = ServiceAccount(
                name="CI/CD Pipeline Bot",
                description="Account used for automated deployments"
            )
            sa2 = ServiceAccount(
                name="Reporting Service",
                description="Account used to generate weekly digest reports"
            )
            db.add(sa1)
            db.add(sa2)

        if db.query(StalenessAlert).count() == 0:
            assignment = db.query(Assignment).first()
            if not assignment:
                person = db.query(Person).first()
                project = db.query(Project).first()
                if person and project:
                    assignment = Assignment(
                        person_id=person.id,
                        project_id=project.id,
                        role="developer",
                        status="active"
                    )
                    db.add(assignment)
                    db.flush()
            if assignment:
                alert = StalenessAlert(
                    assignment_id=assignment.id,
                    severity="low",
                    reason="No status update has been posted in the last 7 days.",
                    status="open",
                    days_since_update=7
                )
                db.add(alert)

        if db.query(AuditLog).count() == 0:
            person = db.query(Person).first()
            log = AuditLog(
                actor_id=person.id if person else None,
                action="SYSTEM_INIT",
                entity="system",
                reason="System initialized"
            )
            db.add(log)

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()


def get_db():
    """
    FastAPI dependency.
    Returns one database session per request.
    """

    db = SessionLocal()

    try:
        yield db

    except OperationalError as exc:
        logger.exception("Database Operational Error")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {exc}",
        )

    except SQLAlchemyError as exc:
        logger.exception("SQLAlchemy Error")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database Error: {exc}",
        )

    finally:
        db.close()