"""Apply the non-destructive notification schema repair for older databases."""

from pathlib import Path
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def main() -> None:
    load_dotenv()
    from src.core.database import DATABASE_URL

    migration = Path(__file__).resolve().parents[1] / "migrations" / "009_repair_notification_schema.sql"
    sql = "\n".join(line for line in migration.read_text(encoding="utf-8").splitlines() if not line.lstrip().startswith("--"))
    engine = create_engine(DATABASE_URL)
    with engine.begin() as connection:
        for statement in sql.split(";"):
            if statement.strip():
                connection.execute(text(statement))
    print("Notification schema repair applied.")


if __name__ == "__main__":
    main()
