export default function LoginPage() {
  return (
    <main className="core-page">
      <div className="core-shell">
        <section className="core-panel" style={{ maxWidth: 460, margin: "48px auto 0" }}>
          <p className="core-eyebrow">CORE access</p>
          <h1 className="core-title" style={{ fontSize: 24 }}>
            Sign in
          </h1>
          <p className="core-description">
            Authentication is ready to be connected to the backend. The first implementation should
            redirect users based on employee, department, executive, work-admin, or system-admin role.
          </p>
          <div className="core-actions" style={{ marginTop: 20 }}>
            <a className="core-button core-button-primary" href="/employee/home">
              Continue as employee
            </a>
            <a className="core-button" href="/">
              Back
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
