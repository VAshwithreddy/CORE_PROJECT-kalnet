
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