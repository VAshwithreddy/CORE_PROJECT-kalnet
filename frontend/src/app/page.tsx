export default function LandingPage() {
  return (
    <main className="landing-page">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="landing-logo">
          <div className="landing-logo-badge">C</div>
          <span>CORE</span>
        </div>
        <div className="landing-actions">
          <a href="/login" className="core-button core-button-primary">
            Sign In to Platform
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero" style={{ margin: "96px auto 64px" }}>
        <span className="landing-badge">
          <span>✨</span> KALNET Internal Operations
        </span>
        <h1 className="landing-hero-title">
          One shared source of truth for <span>who is working on what</span>.
        </h1>
        <p className="landing-hero-desc">
          CORE is an operations registry connecting team assignments, project statuses,
          blocker tracking, and AI-powered weekly digest reports into a single control pane.
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <a href="/login" className="core-button core-button-primary" style={{ padding: "0 32px", minHeight: "48px", fontSize: "15px" }}>
            Sign In to CORE
          </a>
        </div>
      </header>

      {/* Role Scopes Section */}
      <section className="core-shell" style={{ padding: "0 24px 96px" }} aria-label="Role scopes summary">
        <h2 className="landing-section-title">Tailored Scopes for the KALNET Team</h2>
        <div className="role-cards-grid">
          <div className="landing-role-card">
            <div className="landing-role-icon" style={{ background: "var(--core-brand-soft)", color: "var(--core-brand)" }}>👩‍💻</div>
            <h4>Team Member</h4>
            <p>Access your personal home view to track active assignments, update task states, and request blocker relief directly.</p>
          </div>
          <div className="landing-role-card">
            <div className="landing-role-icon" style={{ background: "var(--core-info-soft)", color: "var(--core-info)" }}>📋</div>
            <h4>Department Head</h4>
            <p>Organize team members, assign projects on a visual board, generate weekly summaries, and address blocker alerts.</p>
          </div>
          <div className="landing-role-card">
            <div className="landing-role-icon" style={{ background: "var(--core-executive-soft)", color: "var(--core-executive)" }}>📊</div>
            <h4>CTO / CEO</h4>
            <p>Check the global organization-wide roadmap view, balance capacity loads, and read AI status digests.</p>
          </div>
          <div className="landing-role-card">
            <div className="landing-role-icon" style={{ background: "var(--core-warning-soft)", color: "var(--core-warning)" }}>🛡️</div>
            <h4>Platform Admin</h4>
            <p>Manage users, config parameters, database tables, API keys, and platform-wide security policies.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} KALNET CORE Platform. Internal & Confidential.</p>
      </footer>
    </main>
  );
}
