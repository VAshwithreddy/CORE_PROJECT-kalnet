const mvpFlow = [
  "Work admin creates a request",
  "Request is routed to a department",
  "Department head assigns work",
  "Employee updates progress",
  "Blockers and audit history are tracked",
];

const setupChecks = [
  "Frontend app starts on localhost:3000",
  "Backend health API responds on localhost:8000/health",
  "Role routes exist for employee, department, work admin, executive, and system admin",
];

export default function LandingPage() {
  return (
    <main className="core-page">
      <div className="core-shell">
        <header className="core-header">
          <div>
            <p className="core-eyebrow">CORE setup checkpoint</p>
            <h1 className="core-title">Role-based work management starts here</h1>
            <p className="core-description">
              CORE is being built as an operations platform for work intake, routing, assignments,
              blockers, approvals, audit history, and reporting. This page confirms the frontend
              setup is ready for feature development.
            </p>
          </div>
          <nav className="core-actions" aria-label="Primary routes">
            <a className="core-button core-button-primary" href="/login">
              Sign in
            </a>
            <a className="core-button" href="/employee/home">
              Employee home
            </a>
          </nav>
        </header>

        <section className="core-grid" aria-label="CORE setup summary">
          <article className="core-panel">
            <span className="core-status">MVP first</span>
            <h2>Build one working flow</h2>
            <ul className="core-list">
              {mvpFlow.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="core-panel">
            <span className="core-status">Team focus</span>
            <h2>Module ownership</h2>
            <p>
              Full stack developers lead frontend and backend setup. AIML members support modules,
              data, testing, documentation, and later AI features like routing and digest generation.
            </p>
          </article>

          <article className="core-panel">
            <span className="core-status">Ready check</span>
            <h2>Setup targets</h2>
            <ul className="core-list">
              {setupChecks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
