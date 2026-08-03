import os
import json
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in environment.")
    exit(1)

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)

try:
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Found tables: {tables}")
    
    schema_info = {}
    for table_name in tables:
        columns = inspector.get_columns(table_name)
        pk = inspector.get_pk_constraint(table_name)
        fks = inspector.get_foreign_keys(table_name)
        
        schema_info[table_name] = {
            "columns": [
                {
                    "name": col["name"],
                    "type": str(col["type"]),
                    "nullable": col["nullable"],
                    "default": str(col["default"]) if col.get("default") is not None else None
                }
                for col in columns
            ],
            "primary_key": pk.get("constrained_columns", []),
            "foreign_keys": [
                {
                    "constrained_columns": fk["constrained_columns"],
                    "referred_table": fk["referred_table"],
                    "referred_columns": fk["referred_columns"]
                }
                for fk in fks
            ]
        }
        
    import os
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db_schema.json")
    with open(output_path, "w") as f:
        json.dump(schema_info, f, indent=2)
        
    print(f"Schema written successfully to {output_path}")
    
except Exception as e:
    print("Error during inspection:")
    import traceback
    traceback.print_exc()
