from langchain_core.tools import tool
import pandas as pd
from getdata import get_engine
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import ToolNode
from langchain_core.messages import HumanMessage,SystemMessage
from langgraph.graph import StateGraph,START,END
from langgraph.graph.message import add_messages
from typing import TypedDict, Annotated
from langchain_core.messages import BaseMessage
from dotenv import load_dotenv
from sqlalchemy import text
import os
engine=get_engine()
load_dotenv()
api_key=os.getenv("api_key")


llm=ChatGoogleGenerativeAI(model="gemini-2.5-flash",google_api_key=api_key,temperature=0.7)

@tool
def get_sql_data():
    """
    Retrieve all records from the status_updates table.
    Use this tool whenever you need the latest employee status information
    to generate reports or perform analysis.
    """
    with engine.connect() as conn:
        print("Fetching data.....")
        df=pd.read_sql(text("select * from status_updates"),conn)
        print(df)
        return df.to_dict(orient="records")

llm_with_tools=llm.bind_tools([get_sql_data])



def chatbot(state):
    message=state["messages"]
    response=llm_with_tools.invoke(message)
    return {"messages": [response]}


tool_node=ToolNode([get_sql_data])

class State(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

def should_continue(state):
    last=state["messages"][-1]
    if last.tool_calls:
        return "tools"
    return END

graph=StateGraph(State)

graph.add_node("chatbot",chatbot)
graph.add_node("tools",tool_node)

graph.add_edge(START,"chatbot")
graph.add_conditional_edges(
    "chatbot",
    should_continue,
    {
        "tools": "tools",
        END: END
    }
)

graph.add_edge("tools", "chatbot")

agent=graph.compile()



# system = """
# You are an experienced Project Management Analyst.

# Whenever you need project progress information, call the get_sql_data tool.

# The tool returns status update records for project assignments.

# After receiving the data, generate a professional project status report.

# Your report should include:

# # Executive Summary
# - Overall health of the projects.
# - Number of updates received.
# - General progress.

# # Status Breakdown
# - Count of assignments that are:
#   - On Track
#   - Blocked
#   - At Risk (if present)
#   - Completed (if present)
#   - Any other statuses

# # Key Achievements
# - Summarize important completed work from the progress notes.
# - Group similar accomplishments together instead of repeating identical updates.

# # Blockers and Risks
# - Identify all blockers.
# - Highlight recurring blockers affecting multiple assignments.
# - Explain the potential impact on delivery.

# # Progress Trends
# - Identify patterns across updates.
# - Mention repeated progress notes, duplicate updates, or lack of progress if observed.

# # Recommendations
# Provide practical recommendations such as:
# - Escalate recurring blockers.
# - Follow up with teams awaiting dependencies.
# - Prioritize critical blocked assignments.
# - Improve reporting consistency if duplicate updates exist.

# # Overall Assessment
# Conclude with an overall assessment of project health.

# Guidelines:
# - Use clear Markdown headings.
# - Be concise but informative.
# - Do not expose SQL queries.
# - Base conclusions only on the provided data.
# - Do not invent information that is not present.
# - If data is missing, explicitly mention it.
# """


system = """
You are a Senior Project Management Analyst.

Whenever project data is required, call the get_sql_data tool.

The tool returns status update records for multiple project assignments.

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
result = agent.invoke({
    "messages": [
        SystemMessage(content=system),
        HumanMessage(content="Generate a status report")
    ]
})

print(result["messages"][-1].content)


