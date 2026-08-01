import sys
import json
import psycopg2
from urllib.parse import urlparse, unquote

DATABASE_URL = "postgresql://postgres.jgpklwlzxvlisiktgkzu:mHAfXVdTMbPfNKz9@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"

def get_connection():
    parsed = urlparse(DATABASE_URL)
    user = unquote(parsed.username or "")
    password = unquote(parsed.password or "")
    host = parsed.hostname
    port = parsed.port or 5432
    dbname = parsed.path.lstrip("/").split("?")[0]
    return psycopg2.connect(
        host=host, port=port, dbname=dbname,
        user=user, password=password,
        sslmode="require"
    )

def fetch_overview():
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT count(*) FROM public.people")
    total_people = cur.fetchone()[0]
    
    cur.execute("SELECT count(*) FROM public.departments")
    total_departments = cur.fetchone()[0]
    
    cur.execute("SELECT count(*) FROM public.projects")
    total_projects = cur.fetchone()[0]
    
    cur.execute("SELECT count(*) FROM public.projects WHERE status::text IN ('active', 'in_progress')")
    active_projects = cur.fetchone()[0]
    
    cur.execute("SELECT count(*) FROM public.projects WHERE status::text = 'completed'")
    completed_projects = cur.fetchone()[0]
    
    cur.execute("SELECT count(*) FROM public.projects WHERE status::text IN ('planned', 'planning')")
    planning_projects = cur.fetchone()[0]
    
    cur.execute("SELECT count(*) FROM public.assignments")
    total_assignments = cur.fetchone()[0]
    
    cur.execute("SELECT count(*) FROM public.assignments WHERE status::text = 'blocked'")
    blocked_assignments_count = cur.fetchone()[0]
    
    # Blocked assignments list
    cur.execute("""
        SELECT a.id, pr.name, pe.full_name, COALESCE(s.blockers, 'No details provided.')
        FROM public.assignments a
        JOIN public.projects pr ON a.project_id = pr.id
        JOIN public.people pe ON a.person_id = pe.id
        LEFT JOIN (
            SELECT DISTINCT ON (assignment_id) assignment_id, blockers
            FROM public.status_updates
            ORDER BY assignment_id, created_at DESC
        ) s ON s.assignment_id = a.id
        WHERE a.status::text = 'blocked'
    """)
    blocked_assignments = []
    for row in cur.fetchall():
        blocked_assignments.append({
            "assignment_id": str(row[0]),
            "project_name": row[1],
            "person_name": row[2],
            "blocker": row[3]
        })
        
    # Department overview
    cur.execute("""
        SELECT d.name, 
               (SELECT count(*) FROM public.projects p WHERE p.department_id = d.id),
               (SELECT count(*) FROM public.people pe WHERE pe.department_id = d.id),
               (SELECT count(DISTINCT a.person_id) 
                FROM public.assignments a 
                JOIN public.projects p ON a.project_id = p.id 
                WHERE p.department_id = d.id AND a.status::text = 'blocked'),
               d.id
        FROM public.departments d
    """)
    departments_overview = []
    for row in cur.fetchall():
        departments_overview.append({
            "department": row[0],
            "projects": row[1],
            "members": row[2],
            "blocked": row[3],
            "id": str(row[4])
        })
        
    # Status and priority breakdowns
    cur.execute("SELECT status::text, count(*) FROM public.projects GROUP BY status::text")
    projects_by_status = {row[0]: row[1] for row in cur.fetchall()}
    
    cur.execute("SELECT priority::text, count(*) FROM public.projects GROUP BY priority::text")
    projects_by_priority = {row[0]: row[1] for row in cur.fetchall()}
    
    cur.close()
    conn.close()
    
    return {
        "organization_summary": {
            "total_people": total_people,
            "total_departments": total_departments,
            "total_projects": total_projects,
            "active_projects": active_projects,
            "completed_projects": completed_projects,
            "planning_projects": planning_projects,
            "total_assignments": total_assignments,
            "blocked_assignments": blocked_assignments_count
        },
        "departments_overview": departments_overview,
        "blocked_assignments": blocked_assignments,
        "projects_by_status": projects_by_status,
        "projects_by_priority": projects_by_priority
    }

def fetch_departments():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT d.id, d.name, d.description, pe.full_name, 
               (SELECT count(*) FROM public.people p WHERE p.department_id = d.id),
               (SELECT count(*) FROM public.projects pr WHERE pr.department_id = d.id),
               (SELECT count(*) FROM public.assignments a JOIN public.projects pr ON a.project_id = pr.id WHERE pr.department_id = d.id AND a.status::text = 'blocked')
        FROM public.departments d
        LEFT JOIN public.people pe ON d.head_person_id = pe.id
    """)
    depts = []
    for row in cur.fetchall():
        depts.append({
            "id": str(row[0]),
            "name": row[1],
            "description": row[2] or "No description",
            "head": row[3] or "None Assigned",
            "headcount": row[4],
            "activeProjects": row[5],
            "blockers": row[6],
            "health": "Critical" if row[6] >= 2 else "Attention" if row[6] == 1 else "Healthy"
        })
    
    # Fetch details for each department (projects and members)
    for d in depts:
        cur.execute("SELECT name FROM public.projects WHERE department_id = %s", (d["id"],))
        d["projects"] = [row[0] for row in cur.fetchall()]
        
    cur.close()
    conn.close()
    return depts

def fetch_portfolio():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.id, p.name, p.status::text, p.priority::text, p.target_date, d.name, pe.full_name, p.metadata
        FROM public.projects p
        JOIN public.departments d ON p.department_id = d.id
        LEFT JOIN public.people pe ON p.owner_id = pe.id
    """)
    projects = []
    for row in cur.fetchall():
        meta = row[7] if isinstance(row[7], dict) else {}
        projects.append({
            "id": str(row[0]),
            "name": row[1],
            "status": row[2],
            "priority": row[3],
            "target_date": str(row[4]) if row[4] else "N/A",
            "department": row[5],
            "sponsor": row[6] or "N/A",
            "budget": meta.get("budget", "$100,000"),
            "progressNum": meta.get("progress", 30),
            "theme": meta.get("theme", "Growth"),
            "description": meta.get("description", "No description available.")
        })
        
    for p in projects:
        cur.execute("""
            SELECT pe.full_name, a.role, a.status::text 
            FROM public.assignments a 
            JOIN public.people pe ON a.person_id = pe.id 
            WHERE a.project_id = %s
        """, (p["id"],))
        p["milestones"] = [f"{row[0]} ({row[1]}): {row[2].replace('_', ' ').capitalize()}" for row in cur.fetchall()]
        
    cur.close()
    conn.close()
    return projects

def fetch_risks():
    conn = get_connection()
    cur = conn.cursor()
    
    # Staleness Alerts
    cur.execute("""
        SELECT sa.id, sa.severity::text, sa.reason, sa.days_since_update, sa.status::text, pr.name, pe.full_name
        FROM public.staleness_alerts sa
        JOIN public.assignments a ON sa.assignment_id = a.id
        JOIN public.projects pr ON a.project_id = pr.id
        JOIN public.people pe ON a.person_id = pe.id
    """)
    alerts = []
    for row in cur.fetchall():
        sev = row[1]
        likelihood = 4 if sev == "high" else 3 if sev == "medium" else 2
        impact = 4 if sev == "high" else 3 if sev == "medium" else 2
        alerts.append({
            "id": str(row[0]),
            "name": f"Staleness: {row[5]} ({row[6]})",
            "category": "Performance",
            "likelihood": likelihood,
            "impact": impact,
            "score": likelihood * impact,
            "owner": row[6],
            "status": "Escalated" if sev == "high" else "Open",
            "mitigation": row[2] + f" Days since update: {row[3]}",
            "progress": 50
        })
        
    # Approval Requests as compliance risks
    cur.execute("""
        SELECT ar.id, pe.full_name, ar.request_type::text, ar.target_entity, ar.status::text, ar.payload
        FROM public.approval_requests ar
        JOIN public.people pe ON ar.requested_by = pe.id
    """)
    for row in cur.fetchall():
        payload = row[5] if isinstance(row[5], dict) else {}
        alerts.append({
            "id": str(row[0]),
            "name": f"Approval Pending: {row[2]} on {row[3]}",
            "category": "Compliance",
            "likelihood": 2,
            "impact": 3,
            "score": 6,
            "owner": row[1],
            "status": "Mitigated" if row[4] == "approved" else "Open",
            "mitigation": f"Pending review of payload: {json.dumps(payload)}",
            "progress": 80
        })
        
    cur.close()
    conn.close()
    return alerts

def fetch_digests():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT wd.id, wd.week_start, wd.week_end, wd.summary, wd.generated_by, wd.review_status::text, d.name
        FROM public.weekly_digests wd
        LEFT JOIN public.departments d ON wd.department_id = d.id
        ORDER BY wd.week_start DESC
    """)
    digests = []
    for row in cur.fetchall():
        digests.append({
            "id": str(row[0]),
            "week": f"Week starting {str(row[1])} to {str(row[2])}",
            "date": str(row[1]),
            "author": f"System Agent (reviewed: {row[5]})",
            "status": "Published" if row[5] == "approved" else "Draft",
            "summary": row[3]
        })
    cur.close()
    conn.close()
    return digests

def fetch_reports():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT al.id, pe.full_name, al.action, al.entity, al.created_at, al.reason
        FROM public.audit_logs al
        LEFT JOIN public.people pe ON al.actor_id = pe.id
        ORDER BY al.created_at DESC
        LIMIT 50
    """)
    logs = []
    for row in cur.fetchall():
        logs.append({
            "id": str(row[0]),
            "name": f"Audit: {row[2]} on {row[3]}",
            "template": "Audit Trail Log",
            "date": str(row[4])[:10],
            "format": "PDF",
            "size": "150 KB",
            "author": row[1] or "SYSTEM"
        })
    cur.close()
    conn.close()
    return logs

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No action specified"}))
        return
        
    action = sys.argv[1]
    try:
        if action == "overview":
            print(json.dumps(fetch_overview()))
        elif action == "departments":
            print(json.dumps(fetch_departments()))
        elif action == "portfolio":
            print(json.dumps(fetch_portfolio()))
        elif action == "risks":
            print(json.dumps(fetch_risks()))
        elif action == "digests":
            print(json.dumps(fetch_digests()))
        elif action == "reports":
            print(json.dumps(fetch_reports()))
        else:
            print(json.dumps({"error": f"Unknown action: {action}"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
