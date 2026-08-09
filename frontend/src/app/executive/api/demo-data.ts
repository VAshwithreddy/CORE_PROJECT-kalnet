type ExecutiveAction = "overview" | "departments" | "portfolio" | "risks" | "digests" | "reports";

const departments = [
  {
    id: "dept-engineering",
    name: "Engineering",
    description: "Platform delivery, infrastructure, and product engineering.",
    head: "Sarah Wong",
    headcount: 42,
    activeProjects: 8,
    blockers: 2,
    health: "Attention",
    projects: ["Cloud Infrastructure Migration", "Design System 2.0 Rollout", "Mobile App Re-architecture"],
  },
  {
    id: "dept-product",
    name: "Product",
    description: "Roadmap definition, discovery, and launch coordination.",
    head: "Omar Khan",
    headcount: 18,
    activeProjects: 5,
    blockers: 0,
    health: "Healthy",
    projects: ["Customer Feedback Loop", "Q4 Planning & Budgeting"],
  },
  {
    id: "dept-ops",
    name: "Operations",
    description: "Workflow intake, approvals, routing, and executive reporting.",
    head: "Maya Patel",
    headcount: 24,
    activeProjects: 6,
    blockers: 1,
    health: "Attention",
    projects: ["Approval SLA Refresh", "Work Admin Routing Rules"],
  },
  {
    id: "dept-people",
    name: "People",
    description: "Employee support, access workflows, and policy operations.",
    head: "Jane Doe",
    headcount: 16,
    activeProjects: 4,
    blockers: 0,
    health: "Healthy",
    projects: ["Onboarding Docs Refresh", "Benefits Request Flow"],
  },
];

const portfolio = [
  {
    id: "PRJ-442",
    name: "Cloud Infrastructure Migration",
    sponsor: "Alex Johnson",
    progressNum: 65,
    status: "active",
    budget: "$280,000",
    target_date: "Oct 1, 2026",
    department: "Engineering",
    theme: "Tech Enablement",
    description: "Migrate core services to a clearer deployment topology with safer release windows.",
    milestones: ["DB cutover: In progress", "Observability runbook: On Track", "Security review: Waiting"],
  },
  {
    id: "PRJ-445",
    name: "Design System 2.0 Rollout",
    sponsor: "Omar Khan",
    progressNum: 45,
    status: "blocked",
    budget: "$120,000",
    target_date: "Sep 20, 2026",
    department: "Product",
    theme: "Growth",
    description: "Unify layouts, dashboards, forms, and tables across CORE role workspaces.",
    milestones: ["Token mapping: Blocked", "Table patterns: Done", "Mobile QA: In progress"],
  },
  {
    id: "PRJ-510",
    name: "Executive Reporting Center",
    sponsor: "Michael Kim",
    progressNum: 78,
    status: "in-progress",
    budget: "$95,000",
    target_date: "Aug 29, 2026",
    department: "Operations",
    theme: "Cost Optimization",
    description: "Create reusable leadership reports for blockers, audit events, and weekly summaries.",
    milestones: ["Preview builder: Done", "Exports: In progress", "Saved reports: On Track"],
  },
];

const risks = [
  {
    id: "RSK-001",
    name: "Supabase pooler credentials expired",
    category: "Infrastructure",
    likelihood: 4,
    impact: 4,
    score: 16,
    owner: "Platform Ops",
    status: "Escalated",
    mitigation: "Rotate credentials, move secrets to environment variables, and verify read-only executive API access.",
    progress: 55,
  },
  {
    id: "RSK-002",
    name: "Design-system migration blocks release QA",
    category: "Performance",
    likelihood: 3,
    impact: 4,
    score: 12,
    owner: "Product Design",
    status: "Open",
    mitigation: "Finalize tokens and run responsive visual QA on role dashboards.",
    progress: 45,
  },
  {
    id: "RSK-003",
    name: "Approval SLA visibility gap",
    category: "Compliance",
    likelihood: 2,
    impact: 3,
    score: 6,
    owner: "Operations",
    status: "Mitigated",
    mitigation: "Add weekly review queue and escalation ownership in Work Admin.",
    progress: 100,
  },
];

const digests = [
  {
    id: "DIG-2026-31",
    week: "Week starting 2026-08-03 to 2026-08-09",
    date: "2026-08-07",
    author: "CORE Agent",
    status: "Published",
    summary: "Engineering completed table QA, Operations reduced intake wait time, and leadership has one active infrastructure escalation.",
  },
  {
    id: "DIG-2026-30",
    week: "Week starting 2026-07-27 to 2026-08-02",
    date: "2026-08-01",
    author: "CORE Agent",
    status: "Draft",
    summary: "Design-system rollout moved into validation while two approval policy updates waited for executive review.",
  },
];

const reports = [
  {
    id: "RPT-101",
    name: "Audit: blocker_escalated on Design System 2.0",
    template: "Audit Trail Log",
    date: "2026-08-07",
    format: "PDF",
    size: "142 KB",
    author: "CORE Agent",
  },
  {
    id: "RPT-102",
    name: "Executive: weekly leadership briefing",
    template: "Leadership Digest",
    date: "2026-08-06",
    format: "PDF",
    size: "218 KB",
    author: "Michael Kim",
  },
  {
    id: "RPT-103",
    name: "Operations: approval SLA export",
    template: "CSV Export",
    date: "2026-08-05",
    format: "CSV",
    size: "64 KB",
    author: "Work Admin",
  },
];

const overview = {
  organization_summary: {
    total_people: 100,
    total_departments: departments.length,
    total_projects: portfolio.length,
    active_projects: portfolio.filter((project) => project.status !== "completed").length,
    completed_projects: 1,
    planning_projects: 3,
    total_assignments: 38,
    blocked_assignments: 3,
  },
  departments_overview: departments.map((dept) => ({
    department: dept.name,
    projects: dept.activeProjects,
    members: dept.headcount,
    blocked: dept.blockers,
    id: dept.id,
  })),
  blocked_assignments: [
    {
      assignment_id: "A-1029",
      project_name: "Design System 2.0 Rollout",
      person_name: "Jane Doe",
      blocker: "Token mapping decision is pending.",
    },
    {
      assignment_id: "A-1042",
      project_name: "Cloud Infrastructure Migration",
      person_name: "Alex Johnson",
      blocker: "Security review required before cutover.",
    },
    {
      assignment_id: "A-1055",
      project_name: "Approval SLA Refresh",
      person_name: "Maya Patel",
      blocker: "Escalation policy owner missing.",
    },
  ],
  projects_by_status: {
    active: 2,
    planning: 3,
    blocked: 1,
    completed: 1,
  },
  projects_by_priority: {
    high: 4,
    medium: 7,
    low: 3,
  },
};

export function getExecutiveDemoData(action: ExecutiveAction) {
  switch (action) {
    case "overview":
      return overview;
    case "departments":
      return departments;
    case "portfolio":
      return portfolio;
    case "risks":
      return risks;
    case "digests":
      return digests;
    case "reports":
      return reports;
  }
}
