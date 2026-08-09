import os
from dotenv import load_dotenv
from getdata import get_engine
import pandas as pd
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph,START,END
from typing import TypedDict, Annotated

load_dotenv()
engine=get_engine()

with engine.connect() as conn:
    df = pd.read_sql("select * from status_updates",conn)
    print(df)
    
