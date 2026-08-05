"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NetGlobe from "@/components/net-globe/NetGlobe";

/* ─── Scroll Intersection Hook ───────────────────────────────────── */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(30px)",
        transition: `opacity 0.75s ease ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── 1. DUAL-DIRECTION INFINITE MARQUEES ───────────────────────── */
const SECURITY_ITEMS = [
  "SOC 2 Type II Certified", "Zero-Trust Token Mesh", "Attribute-Based Access Control (ABAC)",
  "SHA-256 Cryptographic Audit Logs", "SAML 2.0 & Okta SSO", "HIPAA & ISO 27001 Ready",
  "Automated Escalation Triggers", "Immutable Activity Streams",
];

const INTEGRATION_ITEMS = [
  "Slack Cloud Workspaces", "Jira Enterprise Sync", "GitHub Enterprise Actions",
  "Datadog Real-time Telemetry", "PagerDuty AI Alerts", "PostgreSQL Cluster Nodes",
  "AWS CloudWatch Streams", "Docker Container Mesh",
];

function DualMarqueeSection() {
  return (
    <div style={{
      position: "relative", zIndex: 10,
      borderTop: "1px solid var(--core-border)", borderBottom: "1px solid var(--core-border)",
      background: "rgba(255, 255, 255, 0.55)", backdropFilter: "blur(12px)",
      padding: "24px 0", display: "flex", flexDirection: "column", gap: 16, overflow: "hidden",
    }}>
      {/* Row 1: Left to Right */}
      <div style={{ overflow: "hidden", position: "relative" }}>
        <div style={{
          display: "flex", gap: 0,
          animation: "marquee-left 35s linear infinite",
          width: "max-content",
        }}>
          {[...SECURITY_ITEMS, ...SECURITY_ITEMS].map((item, i) => (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 16,
              padding: "0 28px",
              fontSize: 13, fontWeight: 700, color: "var(--core-brand)",
              letterSpacing: "0.02em", whiteSpace: "nowrap",
            }}>
              <span style={{ fontSize: 14 }}>🛡️</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Row 2: Right to Left */}
      <div style={{ overflow: "hidden", position: "relative" }}>
        <div style={{
          display: "flex", gap: 0,
          animation: "marquee-right 35s linear infinite",
          width: "max-content",
        }}>
          {[...INTEGRATION_ITEMS, ...INTEGRATION_ITEMS].map((item, i) => (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 16,
              padding: "0 28px",
              fontSize: 13, fontWeight: 600, color: "var(--core-text-muted)",
              letterSpacing: "0.02em", whiteSpace: "nowrap",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--core-executive)", display: "inline-block" }} />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── 2. INTERACTIVE CUSTOMER CASE STUDY CAROUSEL ────────────────── */
const CASE_STUDIES = [
  {
    company: "Fintech Global Systems",
    logo: "💳",
    role: "VP of Engineering & Security",
    author: "Elena Rostova",
    quote: "CORE unified 14 department silos into one immutable workflow graph. Escalation resolution time dropped by 48% in our first 30 days.",
    metric: "-48% Cycle Time",
    accent: "var(--core-brand)",
  },
  {
    company: "Biotech Systems Inc",
    logo: "🧬",
    role: "Chief Information Officer",
    author: "Dr. Marcus Vance",
    quote: "The Zero-Trust role architecture gave us 100% HIPAA compliance overnight. Every lab technician and director has exact scoping with zero manual overhead.",
    metric: "12K Onboarded",
    accent: "var(--core-executive)",
  },
  {
    company: "AeroLogistics Corp",
    logo: "✈️",
    role: "Director of Operations",
    author: "Sophia Martinez",
    quote: "Real-time executive digests eliminated 4 hours of weekly status meetings per director. The ROI calculator wasn't an overstatement — it was an underestimate.",
    metric: "$2.4M Saved / Yr",
    accent: "var(--core-info)",
  },
];

function CarouselSection() {
  const [currentIdx, setCurrentIdx] = useState(0);

  const prevSlide = () => setCurrentIdx((i) => (i === 0 ? CASE_STUDIES.length - 1 : i - 1));
  const nextSlide = () => setCurrentIdx((i) => (i === CASE_STUDIES.length - 1 ? 0 : i + 1));

  const active = CASE_STUDIES[currentIdx];

  return (
    <section style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", padding: "100px 56px" }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--core-brand)", marginBottom: 16 }}>
            Enterprise Success Stories
          </div>
          <h2 style={{
            fontFamily: "var(--core-font-display)",
            fontSize: "clamp(30px, 4vw, 50px)",
            fontWeight: 900, letterSpacing: "-1.8px", lineHeight: 1.05,
          }}>
            Trusted by Enterprise Leaders
          </h2>
        </div>
      </Reveal>

      {/* Carousel Container */}
      <Reveal delay={100}>
        <div style={{
          background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(20px)",
          border: `1.5px solid ${active.accent}40`,
          borderRadius: "var(--core-radius-xl)",
          padding: "56px 64px",
          boxShadow: "0 24px 48px -12px rgba(15, 23, 42, 0.08)",
          position: "relative", overflow: "hidden",
          transition: "border-color 0.4s ease",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: active.accent, transition: "background 0.4s ease" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 48, alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 32 }}>{active.logo}</span>
                <span style={{ fontFamily: "var(--core-font-display)", fontSize: 20, fontWeight: 900, color: "var(--core-text)" }}>
                  {active.company}
                </span>
              </div>

              <p style={{
                fontSize: "clamp(18px, 2vw, 22px)", fontWeight: 600,
                color: "var(--core-text)", lineHeight: 1.5,
                marginBottom: 28, fontStyle: "italic",
              }}>
                "{active.quote}"
              </p>

              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "var(--core-text)" }}>{active.author}</div>
                <div style={{ fontSize: 13, color: "var(--core-text-muted)", fontWeight: 500, marginTop: 2 }}>{active.role}</div>
              </div>
            </div>

            {/* Impact Metric Card */}
            <div style={{
              background: "var(--core-surface)", border: "1px solid var(--core-border)",
              borderRadius: "var(--core-radius-lg)", padding: 32, textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--core-text-subtle)", marginBottom: 8 }}>
                Verified Impact
              </div>
              <div style={{
                fontFamily: "var(--core-font-display)", fontSize: 40, fontWeight: 900,
                color: active.accent, lineHeight: 1.1,
              }}>
                {active.metric}
              </div>
            </div>
          </div>

          {/* Carousel Navigation Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--core-border)" }}>
            <div style={{ display: "flex", gap: 8 }}>
              {CASE_STUDIES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  style={{
                    width: idx === currentIdx ? 28 : 10, height: 10, borderRadius: 999,
                    background: idx === currentIdx ? active.accent : "var(--core-border)",
                    border: "none", cursor: "pointer", transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={prevSlide}
                style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "var(--core-surface)", border: "1px solid var(--core-border)",
                  fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                ←
              </button>
              <button
                type="button"
                onClick={nextSlide}
                style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "var(--core-surface)", border: "1px solid var(--core-border)",
                  fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ─── 3. PLATFORM COMPARISON MATRIX ─────────────────────────────── */
function ComparisonSection() {
  const comparisons = [
    { feature: "Access Scoping", legacy: "Over-privileged admin roles", core: "Precision Attribute-Based RBAC" },
    { feature: "Work Intake", legacy: "Fragmented emails & Slack DMs", core: "Automated SLA Routing Engine" },
    { feature: "Executive Visibility", legacy: "Manual Friday slide updates", core: "Real-time AI Executive Digest" },
    { feature: "Audit Trail", legacy: "Missing or incomplete log files", core: "Immutable SHA-256 Signatures" },
    { feature: "Onboarding Time", legacy: "3-4 weeks per new manager", core: "< 1 Hour instant workspace setup" },
  ];

  return (
    <section style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", padding: "100px 56px" }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--core-brand)", marginBottom: 16 }}>
            Platform Evolution
          </div>
          <h2 style={{
            fontFamily: "var(--core-font-display)",
            fontSize: "clamp(30px, 4vw, 50px)",
            fontWeight: 900, letterSpacing: "-1.8px", lineHeight: 1.05,
          }}>
            Legacy Stack vs CORE
          </h2>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div style={{
          background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(16px)",
          border: "1px solid var(--core-border)", borderRadius: "var(--core-radius-xl)",
          overflow: "hidden", boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.06)",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr",
            padding: "20px 28px", background: "rgba(241, 245, 249, 0.8)",
            fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px",
            borderBottom: "1px solid var(--core-border)",
          }}>
            <span>Capability</span>
            <span style={{ color: "var(--core-danger)" }}>Legacy Stack</span>
            <span style={{ color: "var(--core-brand)" }}>CORE Platform</span>
          </div>

          {comparisons.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr",
                padding: "20px 28px", fontSize: 14,
                borderBottom: idx < comparisons.length - 1 ? "1px solid var(--core-border)" : "none",
                background: idx % 2 === 0 ? "rgba(255, 255, 255, 0.5)" : "transparent",
              }}
            >
              <span style={{ fontWeight: 700, color: "var(--core-text)" }}>{item.feature}</span>
              <span style={{ color: "var(--core-text-muted)" }}>✕ {item.legacy}</span>
              <span style={{ fontWeight: 700, color: "var(--core-brand)" }}>✓ {item.core}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ─── 4. GLOBAL EDGE TELEMETRY STRIP ────────────────────────────── */
function TelemetrySection() {
  return (
    <div style={{
      position: "relative", zIndex: 10,
      background: "#0f172a", color: "#f8fafc",
      padding: "20px 56px", borderTop: "1px solid #1e293b", borderBottom: "1px solid #1e293b",
      fontSize: 12, fontFamily: "monospace",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
          <span style={{ fontWeight: 700, color: "#38bdf8" }}>EDGE TELEMETRY LIVE</span>
        </div>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap", color: "#94a3b8" }}>
          <span>US-East (Virginia): <strong style={{ color: "#4ade80" }}>8ms</strong></span>
          <span>EU-Central (Frankfurt): <strong style={{ color: "#4ade80" }}>14ms</strong></span>
          <span>AP-South (Mumbai): <strong style={{ color: "#4ade80" }}>11ms</strong></span>
          <span>Global Availability: <strong style={{ color: "#38bdf8" }}>99.999% SLA</strong></span>
        </div>
      </div>
    </div>
  );
}

/* ─── BENTO COMPONENTS (ROLES, ROUTING, DIGEST, AUDIT, CAPACITY) ─── */

function RoleMatrixWidget() {
  const [activeRole, setActiveRole] = useState<"employee" | "department" | "executive" | "system-admin">("employee");

  const matrix = {
    employee: [
      { name: "Read Tasks & Workflows", granted: true },
      { name: "Submit Work Requests", granted: true },
      { name: "Department Budgeting", granted: false },
      { name: "Executive Intelligence", granted: false },
      { name: "System Security Admin", granted: false },
    ],
    department: [
      { name: "Read Tasks & Workflows", granted: true },
      { name: "Submit Work Requests", granted: true },
      { name: "Department Budgeting", granted: true },
      { name: "Executive Intelligence", granted: false },
      { name: "System Security Admin", granted: false },
    ],
    executive: [
      { name: "Read Tasks & Workflows", granted: true },
      { name: "Submit Work Requests", granted: true },
      { name: "Department Budgeting", granted: true },
      { name: "Executive Intelligence", granted: true },
      { name: "System Security Admin", granted: false },
    ],
    "system-admin": [
      { name: "Read Tasks & Workflows", granted: true },
      { name: "Submit Work Requests", granted: true },
      { name: "Department Budgeting", granted: true },
      { name: "Executive Intelligence", granted: true },
      { name: "System Security Admin", granted: true },
    ],
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", gap: 16 }}>
      <div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {(["employee", "department", "executive", "system-admin"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setActiveRole(r)}
              style={{
                padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                border: activeRole === r ? "1.5px solid var(--core-brand)" : "1px solid var(--core-border)",
                background: activeRole === r ? "rgba(15, 118, 110, 0.12)" : "rgba(255, 255, 255, 0.7)",
                color: activeRole === r ? "var(--core-brand)" : "var(--core-text-muted)",
                cursor: "pointer", transition: "all 0.2s ease",
              }}
            >
              {r === "employee" ? "👤 Emp" : r === "department" ? "🏢 Dept Head" : r === "executive" ? "📊 Exec" : "🔐 SysAdmin"}
            </button>
          ))}
        </div>

        <h3 style={{ fontFamily: "var(--core-font-display)", fontSize: 18, fontWeight: 900, letterSpacing: "-0.4px", marginBottom: 6 }}>
          Precision Role Architecture
        </h3>
        <p style={{ fontSize: 12, color: "var(--core-text-muted)", lineHeight: 1.5, margin: 0 }}>
          ABAC scoped to exact permissions. Click a role to preview authorization states.
        </p>
      </div>

      <div style={{
        background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(12px)",
        border: "1px solid var(--core-border)", borderRadius: "var(--core-radius-md)",
        padding: "12px", display: "flex", flexDirection: "column", gap: 8,
      }}>
        {matrix[activeRole].map((perm, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "var(--core-text)", fontWeight: 600 }}>{perm.name}</span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700,
              background: perm.granted ? "rgba(21, 128, 61, 0.1)" : "rgba(148, 163, 184, 0.12)",
              color: perm.granted ? "var(--core-success)" : "var(--core-text-subtle)",
              whiteSpace: "nowrap",
            }}>
              {perm.granted ? "✓ Auth" : "✕ Denied"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoutingFlowWidget() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", gap: 16 }}>
      <div>
        <div style={{
          width: 44, height: 44, borderRadius: "var(--core-radius-md)",
          background: "rgba(37, 99, 235, 0.1)", border: "1px solid rgba(37, 99, 235, 0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--core-info)", marginBottom: 14,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <h3 style={{ fontFamily: "var(--core-font-display)", fontSize: 18, fontWeight: 900, letterSpacing: "-0.4px", marginBottom: 6 }}>
          Intelligent Routing
        </h3>
        <p style={{ fontSize: 13, color: "var(--core-text-muted)", lineHeight: 1.5, margin: 0 }}>
          Work requests route automatically based on priority and availability.
        </p>
      </div>

      <div style={{
        padding: 14, borderRadius: "var(--core-radius-md)",
        background: "rgba(241, 245, 249, 0.8)", border: "1px solid var(--core-border)",
        display: "flex", flexDirection: "column", gap: 10, fontSize: 12,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: "var(--core-text)" }}>Intake Request</span>
          <span style={{ color: "var(--core-brand)", fontWeight: 800 }}>REQ-018</span>
        </div>
        <div style={{ height: 1, background: "var(--core-border)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--core-text-muted)" }}>
          <span>Classification</span>
          <span style={{ color: "var(--core-success)", fontWeight: 700 }}>High Priority → IT</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--core-text-muted)" }}>
          <span>Assignee</span>
          <span style={{ fontWeight: 600, color: "var(--core-text)" }}>Ray Torres (Ops)</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--core-text-muted)" }}>
          <span>SLA Remaining</span>
          <span style={{ color: "var(--core-warning)", fontWeight: 700 }}>⏱ 00:42:15</span>
        </div>
      </div>
    </div>
  );
}

function ExecutiveDigestWidget() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", gap: 16 }}>
      <div>
        <div style={{
          width: 44, height: 44, borderRadius: "var(--core-radius-md)",
          background: "rgba(109, 40, 217, 0.1)", border: "1px solid rgba(109, 40, 217, 0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--core-executive)", marginBottom: 14,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m8 21 4-4 4 4"/><path d="M12 17v4"/></svg>
        </div>
        <h3 style={{ fontFamily: "var(--core-font-display)", fontSize: 18, fontWeight: 900, letterSpacing: "-0.4px", marginBottom: 6 }}>
          Executive Intelligence
        </h3>
        <p style={{ fontSize: 13, color: "var(--core-text-muted)", lineHeight: 1.5, margin: 0 }}>
          Synthesized leadership digest with real-time risk heatmaps.
        </p>
      </div>

      <div style={{
        padding: 14, borderRadius: "var(--core-radius-md)",
        background: "rgba(255, 255, 255, 0.85)", border: "1px solid var(--core-border)",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "var(--core-font-display)", color: "var(--core-executive)" }}>99.8%</div>
            <div style={{ fontSize: 11, color: "var(--core-text-subtle)", fontWeight: 600 }}>SLA Compliance</div>
          </div>
          <div style={{
            padding: "4px 10px", borderRadius: 999, background: "rgba(21, 128, 61, 0.1)",
            color: "var(--core-success)", fontSize: 11, fontWeight: 700,
          }}>
            ✓ 0 Critical Risks
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 32, paddingTop: 4 }}>
          {[40, 65, 50, 85, 70, 95, 100].map((val, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: `${val}%`, borderRadius: "3px 3px 0 0",
                background: i === 6 ? "var(--core-executive)" : "rgba(109, 40, 217, 0.25)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AuditStreamWidget() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", gap: 16 }}>
      <div>
        <div style={{
          width: 44, height: 44, borderRadius: "var(--core-radius-md)",
          background: "rgba(180, 83, 9, 0.1)", border: "1px solid rgba(180, 83, 9, 0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--core-warning)", marginBottom: 14,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <h3 style={{ fontFamily: "var(--core-font-display)", fontSize: 18, fontWeight: 900, letterSpacing: "-0.4px", marginBottom: 6 }}>
          Immutable Audit Log
        </h3>
        <p style={{ fontSize: 13, color: "var(--core-text-muted)", lineHeight: 1.5, margin: 0 }}>
          Cryptographic logs signed with SHA-256 for full compliance.
        </p>
      </div>

      <div style={{
        padding: 12, borderRadius: "var(--core-radius-md)",
        background: "#0f172a", color: "#38bdf8", fontFamily: "monospace", fontSize: 11,
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        <div style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px" }}>STREAM · SHA-256 ENCRYPTED</div>
        <div style={{ color: "#4ade80" }}>[16:04:12] AUTH_PASSED emp.jane</div>
        <div style={{ color: "#f43f5e" }}>[16:03:50] DENIED sys.root</div>
        <div style={{ color: "#fbbf24" }}>[16:01:22] ROLE_ELEVATED dept.head</div>
      </div>
    </div>
  );
}

function TeamCapacityWidget() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", gap: 16 }}>
      <div>
        <div style={{
          width: 44, height: 44, borderRadius: "var(--core-radius-md)",
          background: "rgba(21, 128, 61, 0.1)", border: "1px solid rgba(21, 128, 61, 0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--core-success)", marginBottom: 14,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <h3 style={{ fontFamily: "var(--core-font-display)", fontSize: 18, fontWeight: 900, letterSpacing: "-0.4px", marginBottom: 6 }}>
          Team Workload Balance
        </h3>
        <p style={{ fontSize: 13, color: "var(--core-text-muted)", lineHeight: 1.5, margin: 0 }}>
          Real-time workload bands preventing employee burnout.
        </p>
      </div>

      <div style={{
        padding: 14, borderRadius: "var(--core-radius-md)",
        background: "rgba(255, 255, 255, 0.85)", border: "1px solid var(--core-border)",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
            <span>Engineering Team</span>
            <span style={{ color: "var(--core-brand)" }}>78% Capacity</span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "var(--core-surface-muted)", overflow: "hidden" }}>
            <div style={{ width: "78%", height: "100%", background: "var(--core-brand)" }} />
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
            <span>QA Operations</span>
            <span style={{ color: "var(--core-danger)" }}>108% Overloaded</span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "var(--core-surface-muted)", overflow: "hidden" }}>
            <div style={{ width: "100%", height: "100%", background: "var(--core-danger)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CrossDeptIntegrationWidget() {
  const apps = [
    { name: "Slack Workspaces", ping: "12ms", status: "Active" },
    { name: "Jira Enterprise", ping: "18ms", status: "Active" },
    { name: "GitHub Enterprise", ping: "14ms", status: "Active" },
    { name: "Okta SSO / SAML", ping: "8ms", status: "Active" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", gap: 16 }}>
      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: "rgba(15, 118, 110, 0.1)", color: "var(--core-brand)", fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
          ⚡ Ecosystem Connectors
        </div>
        <h3 style={{ fontFamily: "var(--core-font-display)", fontSize: 20, fontWeight: 900, letterSpacing: "-0.4px", marginBottom: 6 }}>
          Unified Enterprise Integrations
        </h3>
        <p style={{ fontSize: 13, color: "var(--core-text-muted)", lineHeight: 1.5, margin: 0 }}>
          Bi-directional synchronization with your existing developer, HR, and identity infrastructure.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {apps.map((app, idx) => (
          <div key={idx} style={{
            padding: "10px 14px", borderRadius: "var(--core-radius-md)",
            background: "rgba(255, 255, 255, 0.85)", border: "1px solid var(--core-border)",
            display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12,
          }}>
            <span style={{ fontWeight: 600, color: "var(--core-text)" }}>{app.name}</span>
            <span style={{ color: "var(--core-success)", fontWeight: 700, fontSize: 11 }}>● {app.ping}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityComplianceWidget() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", gap: 16 }}>
      <div>
        <div style={{
          width: 44, height: 44, borderRadius: "var(--core-radius-md)",
          background: "rgba(15, 118, 110, 0.1)", border: "1px solid rgba(15, 118, 110, 0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--core-brand)", marginBottom: 14,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h3 style={{ fontFamily: "var(--core-font-display)", fontSize: 18, fontWeight: 900, letterSpacing: "-0.4px", marginBottom: 6 }}>
          Zero-Trust Security
        </h3>
        <p style={{ fontSize: 13, color: "var(--core-text-muted)", lineHeight: 1.5, margin: 0 }}>
          End-to-end token encryption & SOC 2 compliance.
        </p>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {["SOC 2 Type II", "HIPAA", "ISO 27001", "256-bit AES"].map((b, idx) => (
          <span key={idx} style={{
            fontSize: 11, fontWeight: 700, color: "var(--core-brand)",
            background: "rgba(15, 118, 110, 0.08)", border: "1px solid rgba(15, 118, 110, 0.2)",
            padding: "4px 10px", borderRadius: 999,
          }}>
            🛡️ {b}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── WORKSPACE SANDBOX SECTION ─────────────────────────────────── */
function WorkspaceSandboxSection() {
  const router = useRouter();
  const [tab, setTab] = useState<"employee" | "department" | "executive" | "work-admin">("employee");

  const tabsData = {
    employee: {
      roleTitle: "Employee Workspace Desk",
      quote: "Focus on your daily tasks, submit requests, and track active deliverables without clutter.",
      stats: [
        { label: "My Active Tasks", val: "5 Items" },
        { label: "Pending Requests", val: "2 Requests" },
        { label: "Unread Notices", val: "1 Critical" },
      ],
      actions: ["Submit Time Off", "Request IT Access", "Update Task Status"],
      accent: "var(--core-brand)",
    },
    department: {
      roleTitle: "Department Head Operations Hub",
      quote: "Oversee team assignments, resolve blockers, and approve budget and intake requests.",
      stats: [
        { label: "Team Members", val: "12 Active" },
        { label: "Open Blockers", val: "1 High Severity" },
        { label: "Department Projects", val: "5 On Track" },
      ],
      actions: ["Approve Intake", "Reassign Workload", "Resolve Blocker"],
      accent: "var(--core-info)",
    },
    executive: {
      roleTitle: "Executive Command Center",
      quote: "High-level portfolio visibility, enterprise risk indicators, and performance digests.",
      stats: [
        { label: "Portfolio Health", val: "94% Optimal" },
        { label: "Strategic Risks", val: "0 Critical" },
        { label: "SLA Adherence", val: "99.8%" },
      ],
      actions: ["View Risk Heatmap", "Export Board Digest", "Audit Portfolio"],
      accent: "var(--core-executive)",
    },
    "work-admin": {
      roleTitle: "Operations Admin Desk",
      quote: "Intelligent intake classification, SLA tracking, and cross-department escalations.",
      stats: [
        { label: "Intake Queue", val: "14 Unassigned" },
        { label: "Escalation SLA", val: "< 15m Avg" },
        { label: "Audit Log Stream", val: "Active" },
      ],
      actions: ["Run Routing Rule", "Escalate Ticket", "View Audit Stream"],
      accent: "var(--core-warning)",
    },
  };

  const current = tabsData[tab];

  return (
    <section style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "120px 56px 100px" }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--core-brand)", marginBottom: 16 }}>
            Live Platform Explorer
          </div>
          <h2 style={{
            fontFamily: "var(--core-font-display)",
            fontSize: "clamp(32px, 4vw, 52px)",
            fontWeight: 900, letterSpacing: "-1.8px", lineHeight: 1.05,
          }}>
            Explore the Scoped Workspaces
          </h2>
          <p style={{ fontSize: 16, color: "var(--core-text-muted)", maxWidth: 560, margin: "14px auto 0", lineHeight: 1.6 }}>
            Click through the workspace roles below to preview how CORE adapts its interface for each persona.
          </p>
        </div>
      </Reveal>

      {/* Tabs */}
      <Reveal delay={100}>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 36 }}>
          {(["employee", "department", "executive", "work-admin"] as const).map((tKey) => (
            <button
              key={tKey}
              type="button"
              onClick={() => setTab(tKey)}
              style={{
                height: 44, padding: "0 22px", borderRadius: 999,
                fontSize: 14, fontWeight: 700,
                border: tab === tKey ? `1.5px solid ${tabsData[tKey].accent}` : "1px solid var(--core-border)",
                background: tab === tKey ? `${tabsData[tKey].accent}12` : "rgba(255, 255, 255, 0.7)",
                color: tab === tKey ? tabsData[tKey].accent : "var(--core-text-muted)",
                cursor: "pointer", transition: "all 0.25s ease",
              }}
            >
              {tKey === "employee" ? "👤 Employee Desk" : tKey === "department" ? "🏢 Department Head" : tKey === "executive" ? "📊 Executive Overview" : "⚙️ Operations Admin"}
            </button>
          ))}
        </div>
      </Reveal>

      {/* Preview Card */}
      <Reveal delay={180}>
        <div style={{
          background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(20px)",
          border: `1.5px solid ${current.accent}40`,
          borderRadius: "var(--core-radius-xl)",
          padding: "48px",
          boxShadow: "0 24px 48px -12px rgba(15, 23, 42, 0.08)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: current.accent }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: current.accent, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
                Role Preview
              </div>
              <h3 style={{ fontFamily: "var(--core-font-display)", fontSize: 32, fontWeight: 900, letterSpacing: "-1px", marginBottom: 14 }}>
                {current.roleTitle}
              </h3>
              <p style={{ fontSize: 15, color: "var(--core-text-muted)", lineHeight: 1.65, marginBottom: 28 }}>
                "{current.quote}"
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {current.actions.map((act, i) => (
                  <span key={i} style={{
                    fontSize: 12, fontWeight: 600, color: "var(--core-text)",
                    background: "var(--core-surface-muted)", border: "1px solid var(--core-border)",
                    padding: "6px 14px", borderRadius: 999,
                  }}>
                    + {act}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats list preview */}
            <div style={{
              display: "flex", flexDirection: "column", gap: 16,
              background: "rgba(246, 248, 251, 0.8)", border: "1px solid var(--core-border)",
              borderRadius: "var(--core-radius-lg)", padding: 28,
            }}>
              {current.stats.map((s, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--core-text-muted)" }}>{s.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--core-font-display)", color: current.accent }}>{s.val}</span>
                </div>
              ))}
              <div style={{ height: 1, background: "var(--core-border)", margin: "4px 0" }} />
              <button
                type="button"
                onClick={() => router.push("/login")}
                style={{
                  width: "100%", height: 44, borderRadius: "var(--core-radius-md)",
                  background: current.accent, color: "#fff", border: "none",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}
              >
                Launch {current.roleTitle} Demo →
              </button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ─── 3. INTERACTIVE ROI CALCULATOR ────────────────────────────── */
function ROICalculatorSection() {
  const [teamSize, setTeamSize] = useState(50);

  const hoursSavedPerMonth = Math.round(teamSize * 4.5);
  const annualSavingsDollars = Math.round(teamSize * 1850).toLocaleString();

  return (
    <section style={{
      position: "relative", zIndex: 10,
      background: "linear-gradient(135deg, rgba(15, 118, 110, 0.04) 0%, rgba(109, 40, 217, 0.04) 100%)",
      borderTop: "1px solid var(--core-border)", borderBottom: "1px solid var(--core-border)",
      padding: "100px 56px",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--core-brand)", marginBottom: 16 }}>
              Interactive ROI Estimator
            </div>
            <h2 style={{
              fontFamily: "var(--core-font-display)",
              fontSize: "clamp(30px, 4vw, 50px)",
              fontWeight: 900, letterSpacing: "-1.8px", lineHeight: 1.05,
            }}>
              Calculate Your Operational Impact
            </h2>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div style={{
            background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(16px)",
            border: "1px solid var(--core-border)", borderRadius: "var(--core-radius-xl)",
            padding: "48px", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 48, alignItems: "center",
          }}>
            <div>
              <label style={{ display: "block", fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
                Organization Size: <span style={{ color: "var(--core-brand)", fontSize: 20 }}>{teamSize} Employees</span>
              </label>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value))}
                style={{
                  width: "100%", height: 8, borderRadius: 999,
                  accentColor: "var(--core-brand)", cursor: "pointer",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--core-text-subtle)", marginTop: 10 }}>
                <span>10 Members</span>
                <span>250 Members</span>
                <span>500+ Members</span>
              </div>
            </div>

            <div style={{
              background: "var(--core-surface)", border: "1px solid var(--core-border)",
              borderRadius: "var(--core-radius-lg)", padding: 28, textAlign: "center",
            }}>
              <div style={{ fontSize: 13, color: "var(--core-text-muted)", fontWeight: 600 }}>Estimated Hours Saved / Mo</div>
              <div style={{
                fontFamily: "var(--core-font-display)", fontSize: 44, fontWeight: 900,
                color: "var(--core-brand)", margin: "4px 0 16px",
              }}>{hoursSavedPerMonth} hrs</div>

              <div style={{ height: 1, background: "var(--core-border)", marginBottom: 16 }} />

              <div style={{ fontSize: 13, color: "var(--core-text-muted)", fontWeight: 600 }}>Estimated Annual Value Saved</div>
              <div style={{
                fontFamily: "var(--core-font-display)", fontSize: 36, fontWeight: 900,
                color: "var(--core-executive)", marginTop: 4,
              }}>${annualSavingsDollars}</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── 4. TECHNICAL FAQ & ACCORDION ──────────────────────────────── */
function TechnicalFAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does Role-Based Access Control (RBAC) work in CORE?",
      a: "CORE enforces strict attribute-based permissions across every endpoint and view. Users only see and access actions assigned to their explicit role level (Employee, Department Head, Executive, Operations Lead, System Admin).",
    },
    {
      q: "Is CORE compliant with enterprise security standards?",
      a: "Yes. CORE is designed around SOC 2 Type II controls, zero-trust architecture, immutable cryptographic audit logging, and automated token invalidation.",
    },
    {
      q: "Can we integrate CORE with existing SAML or Azure AD identity providers?",
      a: "Yes. CORE supports single sign-on (SSO) integration with major IdPs including Okta, Azure AD, Google Workspace, and SAML 2.0 protocols.",
    },
    {
      q: "How long does deployment and onboarding take?",
      a: "Because CORE automatically constructs organizational graphs and scopes workspaces out of the box, typical onboarding takes less than 1 hour per department.",
    },
  ];

  return (
    <section style={{ position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto", padding: "100px 56px 120px" }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--core-brand)", marginBottom: 16 }}>
            Technical & Architecture FAQ
          </div>
          <h2 style={{
            fontFamily: "var(--core-font-display)",
            fontSize: "clamp(30px, 4vw, 48px)",
            fontWeight: 900, letterSpacing: "-1.5px",
          }}>
            Frequently Asked Questions
          </h2>
        </div>
      </Reveal>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <Reveal key={idx} delay={idx * 60}>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.75)", backdropFilter: "blur(12px)",
                  border: "1px solid var(--core-border)", borderRadius: "var(--core-radius-lg)",
                  overflow: "hidden", transition: "all 0.2s ease",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  style={{
                    width: "100%", padding: "20px 24px", textAlign: "left",
                    background: "none", border: "none", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    fontFamily: "var(--core-font-display)", fontSize: 16, fontWeight: 800,
                    color: "var(--core-text)",
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: 20, color: "var(--core-brand)", marginLeft: 16 }}>{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 24px 20px 24px", fontSize: 14, color: "var(--core-text-muted)", lineHeight: 1.65 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ─── MAIN LANDING PAGE ─────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--core-bg)", color: "var(--core-text)", overflowX: "hidden" }}>

      {/* ── FIXED BACKGROUNDS ─────────────────────── */}
      <div className="portal-grid-bg lp-grid-drift" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />
      <div className="glow-orb-teal lp-orb-float" style={{ position: "fixed", width: 800, height: 800, top: -250, right: -200, zIndex: 0, pointerEvents: "none" }} />
      <div className="glow-orb-purple lp-orb-float2" style={{ position: "fixed", width: 600, height: 600, bottom: -200, left: -200, zIndex: 0, pointerEvents: "none" }} />
      {/* Floating particles */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        {[{l:"5%",d:"0s",dur:"12s"},{l:"18%",d:"2s",dur:"15s"},{l:"32%",d:"5s",dur:"10s"},{l:"50%",d:"1s",dur:"13s"},{l:"65%",d:"3.5s",dur:"11s"},{l:"80%",d:"6s",dur:"14s"},{l:"92%",d:"0.5s",dur:"9s"}].map((p,i)=>(
          <div key={i} className="lp-particle" style={{ left: p.l, bottom: "0", animationDelay: p.d, animationDuration: p.dur }} />
        ))}
      </div>

      {/* ── NAVBAR ────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        height: 68,
        display: "flex", alignItems: "center",
        padding: "0 56px",
        backdropFilter: "blur(24px)",
        background: scrolled ? "rgba(246, 248, 251, 0.9)" : "transparent",
        borderBottom: scrolled ? "1px solid rgba(226, 232, 240, 0.6)" : "1px solid transparent",
        transition: "background 0.4s ease, border-color 0.4s ease",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "0 0 auto" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, var(--core-brand) 0%, var(--core-executive) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--core-font-display)", fontWeight: 900, fontSize: 20, color: "#fff",
            boxShadow: "0 4px 16px rgba(15,118,110,0.35)",
          }}>C</div>
          <div style={{ fontFamily: "var(--core-font-display)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" }}>
            CORE
          </div>
        </div>

        {/* Nav links */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 36 }}>
          {["Capabilities", "Case Studies", "Comparison", "Sandbox", "ROI Calculator"].map((n) => (
            <a key={n} href={`#${n.toLowerCase().replace(/ /g, "-")}`} style={{
              fontSize: 14, fontWeight: 500, color: "var(--core-text-muted)",
              textDecoration: "none", transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--core-text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--core-text-muted)")}
            >{n}</a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ flex: "0 0 auto", display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => router.push("/login")} style={{
            height: 38, padding: "0 22px", borderRadius: 999,
            background: "linear-gradient(135deg, var(--core-brand), var(--core-brand-hover))",
            border: "none", color: "#fff",
            fontFamily: "var(--core-font-sans)", fontWeight: 700, fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(15,118,110,0.3)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(15,118,110,0.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 14px rgba(15,118,110,0.3)"; }}
          >Launch Platform →</button>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────── */}
      <section style={{
        position: "relative", zIndex: 10,
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1.05fr",
        alignItems: "center",
        maxWidth: 1440,
        margin: "0 auto",
        padding: "130px 56px 60px",
        gap: 40,
      }}>
        {/* Left Copy */}
        <div style={{ animation: "lp-hero-enter 0.9s cubic-bezier(0.16,1,0.3,1) both" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(15,118,110,0.08)",
            border: "1px solid rgba(15,118,110,0.15)",
            borderRadius: 999, padding: "5px 14px",
            fontSize: 11, fontWeight: 700, letterSpacing: "1.2px",
            textTransform: "uppercase", color: "var(--core-brand)",
            marginBottom: 32,
          }}>
            <span className="lp-dot-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            Enterprise Operations OS · 2026 Edition
          </div>

          <h1 style={{
            fontFamily: "var(--core-font-display)",
            fontSize: "clamp(44px, 5.5vw, 80px)",
            fontWeight: 900, lineHeight: 0.97,
            letterSpacing: "-3px",
            marginBottom: 32,
          }}>
            The OS<br />
            for your<br />
            <span style={{
              backgroundImage: "linear-gradient(135deg, var(--core-brand) 20%, var(--core-executive) 80%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>organization.</span>
          </h1>

          <p style={{
            fontSize: 18, color: "var(--core-text-muted)",
            lineHeight: 1.72, maxWidth: 490, marginBottom: 48,
          }}>
            Unify operations, orchestrate approvals, and give every stakeholder — from frontline employees to the C-suite — a precisely scoped workspace.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 56 }}>
            <button onClick={() => router.push("/login")} className="lp-cta-shimmer"
              style={{
                height: 56, padding: "0 36px", borderRadius: 999,
                border: "none", color: "#fff",
                fontFamily: "var(--core-font-sans)", fontWeight: 700, fontSize: 15,
                cursor: "pointer",
                boxShadow: "0 16px 40px -8px rgba(15,118,110,0.45)",
                transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
                display: "flex", alignItems: "center", gap: 10,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 24px 48px -8px rgba(15,118,110,0.55)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 16px 40px -8px rgba(15,118,110,0.45)"; }}
            >
              Sign In to Platform
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        {/* Right: NetGlobe */}
        <div style={{
          position: "relative",
          height: 620,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          animation: "lp-globe-enter 1.1s cubic-bezier(0.16,1,0.3,1) 0.2s both",
        }}>
          <NetGlobe />
        </div>
      </section>

      {/* ── DUAL MARQUEE TICKERS ─────────────────── */}
      <DualMarqueeSection />

      {/* ── GLOBAL TELEMETRY STRIP ───────────────── */}
      <TelemetrySection />

      {/* ── BENTO CAPABILITIES ────────────────────── */}
      <section id="capabilities" style={{
        position: "relative", zIndex: 10,
        maxWidth: 1200, margin: "0 auto",
        padding: "140px 56px 120px",
      }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--core-brand)", marginBottom: 16 }}>
              Architecture Overview
            </div>
            <h2 style={{
              fontFamily: "var(--core-font-display)",
              fontSize: "clamp(32px, 4vw, 54px)",
              fontWeight: 900, letterSpacing: "-2px", lineHeight: 1.05,
            }}>
              Built for every<br />
              <span style={{ backgroundImage: "linear-gradient(135deg, var(--core-brand), var(--core-executive))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                layer of the org.
              </span>
            </h2>
          </div>
        </Reveal>

        {/* Feature Card Grid: 3×2 equal-height uniform layout */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridAutoRows: "1fr",
          gap: 20,
          alignItems: "stretch",
        }}>
          {[
            {
              widget: <RoleMatrixWidget />,
              delay: 0,
              accent: "rgba(15,118,110,0.18)",
              bg: "linear-gradient(145deg, rgba(15,118,110,0.05) 0%, rgba(255,255,255,0.75) 100%)",
            },
            {
              widget: <RoutingFlowWidget />,
              delay: 60,
              accent: "var(--core-border)",
              bg: "rgba(255,255,255,0.75)",
            },
            {
              widget: <ExecutiveDigestWidget />,
              delay: 120,
              accent: "var(--core-border)",
              bg: "rgba(255,255,255,0.75)",
            },
            {
              widget: <AuditStreamWidget />,
              delay: 180,
              accent: "var(--core-border)",
              bg: "rgba(255,255,255,0.75)",
            },
            {
              widget: <TeamCapacityWidget />,
              delay: 240,
              accent: "var(--core-border)",
              bg: "rgba(255,255,255,0.75)",
            },
            {
              widget: <CrossDeptIntegrationWidget />,
              delay: 300,
              accent: "var(--core-border)",
              bg: "rgba(255,255,255,0.75)",
            },
          ].map(({ widget, delay, accent, bg }, idx) => (
            <Reveal key={idx} delay={delay}>
              <div className="lp-bento-card" style={{
                height: "100%",
                minHeight: 300,
                background: bg,
                backdropFilter: "blur(14px)",
                border: `1px solid ${accent}`,
                borderRadius: "var(--core-radius-xl)",
                padding: "32px",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}>
                {widget}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CUSTOMER CASE STUDY CAROUSEL ────────── */}
      <div id="case-studies">
        <CarouselSection />
      </div>

      {/* ── PLATFORM COMPARISON MATRIX ─────────── */}
      <div id="comparison">
        <ComparisonSection />
      </div>

      {/* ── WORKSPACE SANDBOX SECTION ───────────── */}
      <div id="sandbox">
        <WorkspaceSandboxSection />
      </div>

      {/* ── ROI CALCULATOR SECTION ──────────────── */}
      <div id="roi-calculator">
        <ROICalculatorSection />
      </div>

      {/* ── TECHNICAL FAQ SECTION ───────────────── */}
      <div id="architecture">
        <TechnicalFAQSection />
      </div>

      {/* ── FOOTER ────────────────────────────────── */}
      <footer style={{
        position: "relative", zIndex: 10,
        borderTop: "1px solid var(--core-border)",
        padding: "44px 56px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        maxWidth: 1440, margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "linear-gradient(135deg, var(--core-brand), var(--core-executive))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--core-font-display)", fontWeight: 900, fontSize: 17, color: "#fff",
          }}>C</div>
          <div>
            <span style={{ fontFamily: "var(--core-font-display)", fontWeight: 800, fontSize: 14 }}>CORE</span>
            <span style={{ color: "var(--core-text-subtle)", fontSize: 13, marginLeft: 8 }}>© 2026 CORE Platforms, Inc.</span>
          </div>
        </div>
      </footer>

      {/* CSS animation keyframes & interactive effects */}
      <style>{`
        /* ── Landing page keyframes ───────────── */
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        @keyframes lp-orb-float {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(40px,-30px) scale(1.06); }
          66%      { transform: translate(-30px,20px) scale(0.96); }
        }
        @keyframes lp-orb-float2 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(-35px,25px) scale(1.08); }
          66%      { transform: translate(20px,-20px) scale(0.94); }
        }
        @keyframes lp-grid-drift {
          0%   { background-position: 0px 0px; }
          100% { background-position: 40px 40px; }
        }
        @keyframes lp-particle-rise {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          8%   { opacity: 0.7; }
          92%  { opacity: 0.4; }
          100% { transform: translateY(-100vh) translateX(15px); opacity: 0; }
        }
        @keyframes lp-hero-enter {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-globe-enter {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes lp-cta-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes lp-dot-pulse {
          0%,100% { box-shadow: 0 0 6px #10b981; }
          50%      { box-shadow: 0 0 14px #10b981, 0 0 28px rgba(16,185,129,0.4); }
        }

        /* ── Applied classes ──────────────────── */
        .lp-orb-float  { animation: lp-orb-float  12s ease-in-out infinite; }
        .lp-orb-float2 { animation: lp-orb-float2 15s ease-in-out infinite; }
        .lp-grid-drift { animation: lp-grid-drift 10s linear infinite; }
        .lp-dot-pulse  { animation: lp-dot-pulse 2.2s ease-in-out infinite; }

        .lp-particle {
          position: absolute;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: rgba(94,234,212,0.6);
          animation: lp-particle-rise linear infinite;
          pointer-events: none;
        }

        .lp-cta-shimmer {
          background: linear-gradient(
            135deg,
            var(--core-brand) 0%,
            var(--core-brand-hover) 35%,
            #5eead4 50%,
            var(--core-brand-hover) 65%,
            var(--core-brand) 100%
          ) !important;
          background-size: 200% auto !important;
          animation: lp-cta-shimmer 3.5s linear infinite;
        }

        /* Hover & Interactivity Enhancements */
        .lp-bento-card {
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease !important;
        }
        .lp-bento-card:hover {
          transform: translateY(-8px) scale(1.015) !important;
          box-shadow: 0 24px 50px -12px rgba(15,118,110,0.18) !important;
          border-color: rgba(15,118,110,0.4) !important;
        }

        @media (max-width: 1024px) {
          section { padding-left: 28px !important; padding-right: 28px !important; }
          nav { padding: 0 28px !important; }
          footer { padding: 36px 28px !important; flex-direction: column; gap: 20px; }
        }
        @media (max-width: 860px) {
          section[style*="grid-template-columns: 1fr 1.05fr"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
