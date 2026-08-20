import { Pool } from "pg";

// Use connection pooling suitable for serverless / Next.js / Vercel
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.CONN_STRING;

    if (!connectionString) {
      throw new Error("DATABASE_URL must be configured for executive reporting.");
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      max: 10,
    });
  }
  return pool;
}

export async function fetchOverview() {
  const db = getPool();

  const [
    totalPeopleRes,
    totalDepartmentsRes,
    totalProjectsRes,
    activeProjectsRes,
    completedProjectsRes,
    planningProjectsRes,
    totalAssignmentsRes,
    blockedAssignmentsRes,
    blockedListRes,
    deptOverviewRes,
    statusBreakdownRes,
    priorityBreakdownRes,
  ] = await Promise.all([
    db.query("SELECT count(*) FROM public.people"),
    db.query("SELECT count(*) FROM public.departments"),
    db.query("SELECT count(*) FROM public.projects"),
    db.query("SELECT count(*) FROM public.projects WHERE status::text IN ('active', 'in_progress')"),
    db.query("SELECT count(*) FROM public.projects WHERE status::text = 'completed'"),
    db.query("SELECT count(*) FROM public.projects WHERE status::text IN ('planned', 'planning')"),
    db.query("SELECT count(*) FROM public.assignments"),
    db.query("SELECT count(*) FROM public.assignments WHERE status::text = 'blocked'"),
    db.query(`
      SELECT a.id, pr.name, pe.full_name, COALESCE(s.blockers, 'No details provided.') as blocker
      FROM public.assignments a
      JOIN public.projects pr ON a.project_id = pr.id
      JOIN public.people pe ON a.person_id = pe.id
      LEFT JOIN (
          SELECT DISTINCT ON (assignment_id) assignment_id, blockers
          FROM public.status_updates
          ORDER BY assignment_id, created_at DESC
      ) s ON s.assignment_id = a.id
      WHERE a.status::text = 'blocked'
    `),
    db.query(`
      SELECT d.name, 
             (SELECT count(*) FROM public.projects p WHERE p.department_id = d.id) as projects,
             (SELECT count(*) FROM public.people pe WHERE pe.department_id = d.id) as members,
             (SELECT count(DISTINCT a.person_id) 
              FROM public.assignments a 
              JOIN public.projects p ON a.project_id = p.id 
              WHERE p.department_id = d.id AND a.status::text = 'blocked') as blocked,
             d.id
      FROM public.departments d
    `),
    db.query("SELECT status::text, count(*) FROM public.projects GROUP BY status::text"),
    db.query("SELECT priority::text, count(*) FROM public.projects GROUP BY priority::text"),
  ]);

  const blockedAssignments = blockedListRes.rows.map((row) => ({
    assignment_id: String(row.id),
    project_name: row.name,
    person_name: row.full_name,
    blocker: row.blocker,
  }));

  const departmentsOverview = deptOverviewRes.rows.map((row) => ({
    department: row.name,
    projects: parseInt(row.projects, 10) || 0,
    members: parseInt(row.members, 10) || 0,
    blocked: parseInt(row.blocked, 10) || 0,
    id: String(row.id),
  }));

  const projectsByStatus: Record<string, number> = {};
  for (const row of statusBreakdownRes.rows) {
    projectsByStatus[row.status] = parseInt(row.count, 10) || 0;
  }

  const projectsByPriority: Record<string, number> = {};
  for (const row of priorityBreakdownRes.rows) {
    projectsByPriority[row.priority] = parseInt(row.count, 10) || 0;
  }

  return {
    organization_summary: {
      total_people: parseInt(totalPeopleRes.rows[0]?.count, 10) || 0,
      total_departments: parseInt(totalDepartmentsRes.rows[0]?.count, 10) || 0,
      total_projects: parseInt(totalProjectsRes.rows[0]?.count, 10) || 0,
      active_projects: parseInt(activeProjectsRes.rows[0]?.count, 10) || 0,
      completed_projects: parseInt(completedProjectsRes.rows[0]?.count, 10) || 0,
      planning_projects: parseInt(planningProjectsRes.rows[0]?.count, 10) || 0,
      total_assignments: parseInt(totalAssignmentsRes.rows[0]?.count, 10) || 0,
      blocked_assignments: parseInt(blockedAssignmentsRes.rows[0]?.count, 10) || 0,
    },
    departments_overview: departmentsOverview,
    blocked_assignments: blockedAssignments,
    projects_by_status: projectsByStatus,
    projects_by_priority: projectsByPriority,
  };
}

export async function fetchDepartments() {
  const db = getPool();

  const deptsRes = await db.query(`
    SELECT d.id, d.name, d.description, pe.full_name, 
           (SELECT count(*) FROM public.people p WHERE p.department_id = d.id) as headcount,
           (SELECT count(*) FROM public.projects pr WHERE pr.department_id = d.id) as active_projects,
           (SELECT count(*) FROM public.assignments a JOIN public.projects pr ON a.project_id = pr.id WHERE pr.department_id = d.id AND a.status::text = 'blocked') as blockers
    FROM public.departments d
    LEFT JOIN public.people pe ON d.head_person_id = pe.id
  `);

  const depts = deptsRes.rows.map((row) => {
    const blockers = parseInt(row.blockers, 10) || 0;
    const health =
      blockers >= 2 ? "Critical" : blockers === 1 ? "Attention" : "Healthy";

    return {
      id: String(row.id),
      name: row.name,
      description: row.description || "No description",
      head: row.full_name || "None Assigned",
      headcount: parseInt(row.headcount, 10) || 0,
      activeProjects: parseInt(row.active_projects, 10) || 0,
      blockers,
      health,
      projects: [] as string[],
    };
  });

  // Fetch projects for each department
  await Promise.all(
    depts.map(async (d) => {
      const projRes = await db.query(
        "SELECT name FROM public.projects WHERE department_id = $1",
        [d.id]
      );
      d.projects = projRes.rows.map((r) => r.name);
    })
  );

  return depts;
}

export async function fetchPortfolio() {
  const db = getPool();

  const projectsRes = await db.query(`
    SELECT p.id, p.name, p.status::text, p.priority::text, p.target_date, d.name as dept_name, pe.full_name, p.metadata
    FROM public.projects p
    JOIN public.departments d ON p.department_id = d.id
    LEFT JOIN public.people pe ON p.owner_id = pe.id
  `);

  const projects = projectsRes.rows.map((row) => {
    const meta =
      typeof row.metadata === "object" && row.metadata !== null
        ? row.metadata
        : {};

    return {
      id: String(row.id),
      name: row.name,
      status: row.status,
      priority: row.priority,
      target_date: row.target_date ? String(row.target_date) : "N/A",
      department: row.dept_name,
      sponsor: row.full_name || "N/A",
      budget: meta.budget || "$100,000",
      progressNum: meta.progress !== undefined ? meta.progress : 30,
      theme: meta.theme || "Growth",
      description: meta.description || "No description available.",
      milestones: [] as string[],
    };
  });

  // Fetch milestones/assignments for each project
  await Promise.all(
    projects.map(async (p) => {
      const assignRes = await db.query(
        `
        SELECT pe.full_name, a.role, a.status::text 
        FROM public.assignments a 
        JOIN public.people pe ON a.person_id = pe.id 
        WHERE a.project_id = $1
      `,
        [p.id]
      );
      p.milestones = assignRes.rows.map((row) => {
        const formattedStatus = (row.status || "")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        return `${row.full_name} (${row.role}): ${formattedStatus}`;
      });
    })
  );

  return projects;
}

export async function fetchRisks() {
  const db = getPool();

  const alerts: any[] = [];

  // Staleness Alerts
  const stalenessRes = await db.query(`
    SELECT sa.id, sa.severity::text, sa.reason, sa.days_since_update, sa.status::text, pr.name as proj_name, pe.full_name
    FROM public.staleness_alerts sa
    JOIN public.assignments a ON sa.assignment_id = a.id
    JOIN public.projects pr ON a.project_id = pr.id
    JOIN public.people pe ON a.person_id = pe.id
  `);

  for (const row of stalenessRes.rows) {
    const sev = row.severity;
    const likelihood = sev === "high" ? 4 : sev === "medium" ? 3 : 2;
    const impact = sev === "high" ? 4 : sev === "medium" ? 3 : 2;

    alerts.push({
      id: String(row.id),
      name: `Staleness: ${row.proj_name} (${row.full_name})`,
      category: "Performance",
      likelihood,
      impact,
      score: likelihood * impact,
      owner: row.full_name,
      status: sev === "high" ? "Escalated" : "Open",
      mitigation: `${row.reason} Days since update: ${row.days_since_update}`,
      progress: 50,
    });
  }

  // Approval Requests as compliance risks
  const approvalRes = await db.query(`
    SELECT ar.id, pe.full_name, ar.request_type::text, ar.target_entity, ar.status::text, ar.payload
    FROM public.approval_requests ar
    JOIN public.people pe ON ar.requested_by = pe.id
  `);

  for (const row of approvalRes.rows) {
    const payload =
      typeof row.payload === "object" && row.payload !== null
        ? row.payload
        : {};

    alerts.push({
      id: String(row.id),
      name: `Approval Pending: ${row.request_type} on ${row.target_entity}`,
      category: "Compliance",
      likelihood: 2,
      impact: 3,
      score: 6,
      owner: row.full_name,
      status: row.status === "approved" ? "Mitigated" : "Open",
      mitigation: `Pending review of payload: ${JSON.stringify(payload)}`,
      progress: 80,
    });
  }

  return alerts;
}

export async function fetchDigests() {
  const db = getPool();

  const digestsRes = await db.query(`
    SELECT wd.id, wd.week_start, wd.week_end, wd.summary, wd.generated_by, wd.review_status::text, d.name as dept_name
    FROM public.weekly_digests wd
    LEFT JOIN public.departments d ON wd.department_id = d.id
    ORDER BY wd.week_start DESC
  `);

  return digestsRes.rows.map((row) => ({
    id: String(row.id),
    week: `Week starting ${String(row.week_start)} to ${String(row.week_end)}`,
    date: String(row.week_start),
    author: `System Agent (reviewed: ${row.review_status})`,
    status: row.review_status === "approved" ? "Published" : "Draft",
    summary: row.summary,
  }));
}

export async function fetchReports() {
  const db = getPool();

  const logsRes = await db.query(`
    SELECT al.id, pe.full_name, al.action, al.entity, al.created_at, al.reason
    FROM public.audit_logs al
    LEFT JOIN public.people pe ON al.actor_id = pe.id
    ORDER BY al.created_at DESC
    LIMIT 50
  `);

  return logsRes.rows.map((row) => ({
    id: String(row.id),
    name: `Audit: ${row.action} on ${row.entity}`,
    template: "Audit Trail Log",
    date: String(row.created_at).slice(0, 10),
    format: "PDF",
    size: "150 KB",
    author: row.full_name || "SYSTEM",
  }));
}
