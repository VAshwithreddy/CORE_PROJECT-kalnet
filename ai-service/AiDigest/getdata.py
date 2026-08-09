from dotenv import load_dotenv
import os
import pandas as pd
from sqlalchemy import create_engine
load_dotenv()
CONN_STRING=os.getenv("DATABASE_URL")


def get_engine():
    try:
        return create_engine(CONN_STRING)
    except Exception as e:
        print("engine exception : ",e)


def get_data(engine,query):
    try:
        with engine.connect() as conn:
            df=pd.read_sql(query,conn)
            return df

    except Exception as e:
        print(e)



result=get_data(get_engine(),"""select * from status_updates""")
print(result)