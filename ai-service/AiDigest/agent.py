import os
from typing import TypedDict, Annotated
from dotenv import load_dotenv
import pandas as pd
from getdata import get_engine
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langgraph.prebuilt import ToolNode
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.graph.message import add_messages
from sqlalchemy import text

load_dotenv()
api_key = os.getenv("api_key") or os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY")

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key if api_key else "placeholder", temperature=0.7)

engine = get_engine()

@tool
def get_sql_data():
    """
    Retrieve all records from the status_updates table.
    Use this tool whenever you need the latest employee status information
    to generate reports or perform analysis.
    """
    if engine:
        with engine.connect() as conn:
            df = pd.read_sql(text("select * from status_updates"), conn)
            return df.to_dict(orient="records")
    return []

llm_with_tools = llm.bind_tools([get_sql_data])

def chatbot(state):
    message = state["messages"]
    response = llm_with_tools.invoke(message)
    return {"messages": [response]}

tool_node = ToolNode([get_sql_data])

class State(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

def should_continue(state):
    last = state["messages"][-1]
    if last.tool_calls:
        return "tools"
    return END

graph = StateGraph(State)
graph.add_node("chatbot", chatbot)
graph.add_node("tools", tool_node)
graph.add_edge(START, "chatbot")
graph.add_conditional_edges(
    "chatbot",
    should_continue,
    {
        "tools": "tools",
        END: END
    }
)
graph.add_edge("tools", "chatbot")

agent = graph.compile()

system = """
You are a Senior Project Management Analyst.

When structured weekly status update data is provided in the user prompt, analyze ONLY that provided data. Do NOT invoke database tools or query external databases, as the prompt data has already been pre-filtered for the target calendar week. Base all metrics, project details, and counts strictly on the provided data without hallucinating or fetching extra records.

Your job is to analyze the data and generate a professional project report.

Generate the report in the following format:

# Executive Summary
- Overall health of all projects.
- Total number of project updates.
- Number of projects that are On Track, Blocked, Completed, At Risk, etc.

# Project-wise Analysis

For EACH unique assignment_id:

## Project: <assignment_id>

### Current Status
- Mention the latest project status.
- Explain what the status means.

### Progress
- Summarize the progress notes in simple business language.
- Explain what work has already been completed.
- Mention what the team is currently working on.

### Blockers
- If blockers exist:
    - Clearly list every blocker.
    - Explain how each blocker may affect the project.
- If no blockers exist:
    - State that no blockers have been reported.

### Timeline
- Mention the latest update timestamp.
- If multiple updates exist, briefly summarize how the project has progressed over time.

### Overall Assessment
- Give a short assessment of the project's health.
- Mention whether the project appears healthy, delayed, blocked, or needs attention.

---

# Cross-Project Insights

Analyze all projects together.

Include:
- Projects that are blocked.
- Projects with no blockers.
- Projects that have repeated updates.
- Common blockers across multiple projects.
- Teams waiting on dependencies.
- Any unusual patterns or risks.

# Recommendations

Provide actionable recommendations, such as:
- Which blocked projects should be prioritized.
- Which dependencies should be resolved first.
- Which projects are progressing well.
- Any follow-up actions for project managers.

# Final Conclusion

Summarize the overall portfolio health in 2-3 paragraphs.

Guidelines:
- Write in a professional management-report style.
- Do not simply repeat the database rows.
- Convert progress notes into readable explanations.
- If multiple updates exist for the same project, combine them into one project summary instead of listing every row.
- Base every conclusion only on the provided data.
- Do not invent missing information.
- Never expose SQL queries.
"""

if __name__ == "__main__":
    if engine:
        with engine.connect() as conn:
            df = pd.read_sql("select * from status_updates", conn)
            print(df)

    
