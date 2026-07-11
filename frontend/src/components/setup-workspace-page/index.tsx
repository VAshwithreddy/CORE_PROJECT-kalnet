type SetupWorkspacePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: string;
  focusItems: string[];
};

export function SetupWorkspacePage({
  eyebrow,
  title,
  description,
  primaryAction,
  focusItems,
}: SetupWorkspacePageProps) {
  return (
    <main className="core-page">
      <div className="core-shell">
        <header className="core-header">
          <div>
            <p className="core-eyebrow">{eyebrow}</p>
            <h1 className="core-title">{title}</h1>
            <p className="core-description">{description}</p>
          </div>
          <div className="core-actions">
            <a className="core-button" href="/">
              CORE setup
            </a>
          </div>
        </header>

        <section className="core-panel">
          <span className="core-status">First build target</span>
          <h2>{primaryAction}</h2>
          <ul className="core-list">
            {focusItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
