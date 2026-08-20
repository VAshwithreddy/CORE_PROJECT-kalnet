"use client";

import { useState, useEffect } from "react";
import { ExecutiveShell } from "@/components/executive-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";

// Custom SVGs
const SparklesIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginRight: 8 }}
  >
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const EditIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginRight: 6 }}
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const ExportIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginRight: 6 }}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface DigestHistory {
  id: string;
  week: string;
  date: string;
  author: string;
  status: "Draft" | "Published";
  summary: string;
}

export default function ExecutiveDigestPage() {
  const [history, setHistory] = useState<DigestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedWeek, setSelectedWeek] = useState("week-28");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [briefingText, setBriefingText] = useState("");



useEffect(() => {
  setLoading(true);

  fetch("/executive/api?action=digests")
    .then((res) => {
      if (!res.ok) {
        throw new Error("Failed to fetch weekly digests history");
      }

      return res.json();
    })
    .then((data) => {
      if (data.error) {
        throw new Error(data.error);
      }

      setHistory(data);
      setError(null);
    })
    .catch((err) => {
      console.error(err);
      setError(err.message);
    })
    .finally(() => {
      setLoading(false);
    });
}, []);
  
  const handleAssembleBriefing = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_AI_DIGEST ||"http://127.0.0.1:8000/AiDigest");

      if (!res.ok) {
        throw new Error("Failed to generate weekly digest");
      }

      const data = await res.json();

      console.log("AiDigest API response:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      // Extract text content whether Report is an array of blocks, an object, or a string
      const reportText = Array.isArray(data.Report)
        ? data.Report.map((item: any) => item?.text || (typeof item === "string" ? item : "")).join("\n")
        : typeof data.Report === "string"
        ? data.Report
        : data.Report?.text || "";

      setBriefingText(reportText);

      setHasGenerated(true);
    } catch (err) {
      console.error("AiDigest error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate weekly digest"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  /*
   * TABLE COLUMNS
   */
  const columns: DataTableColumn<DigestHistory>[] = [
    {
      key: "week",
      header: "Week",
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.week}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
    },
    {
      key: "author",
      header: "Author",
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <span
          style={{
            padding: "4px 8px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 600,
            background:
              row.status === "Published"
                ? "var(--core-success-soft)"
                : "var(--core-warning-soft)",
            color:
              row.status === "Published"
                ? "var(--core-success)"
                : "var(--core-warning)",
          }}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "summary",
      header: "Summary",
      sortable: false,
      render: (row) => (
        <span
          style={{
            display: "block",
            maxWidth: "500px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {row.summary}
        </span>
      ),
    },
  ];

  /*
   * LOADING STATE
   */
  if (loading) {
    return (
      <ExecutiveShell activePath="/executive/digest">
        <PageHeader
          title="Weekly Leadership Briefings"
          description="Connecting to live database..."
        />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "200px",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              border: "3px solid var(--core-border)",
              borderTop: "3px solid var(--core-executive)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />

          <style>
            {`
              @keyframes spin {
                0% {
                  transform: rotate(0deg);
                }

                100% {
                  transform: rotate(360deg);
                }
              }
            `}
          </style>
        </div>
      </ExecutiveShell>
    );
  }

  /*
   * ERROR STATE
   */
  if (error) {
    return (
      <ExecutiveShell activePath="/executive/digest">
        <PageHeader
          title="Weekly Leadership Briefings"
          description="Connection Error"
        />

        <div
          className="core-panel"
          style={{
            border: "1px solid var(--core-danger)",
            background: "var(--core-danger-soft)",
            color: "var(--core-danger)",
            padding: 20,
          }}
        >
          <h2
            style={{
              color: "var(--core-danger)",
              margin: "0 0 10px",
            }}
          >
            Database Connection Failed
          </h2>

          <p
            style={{
              color: "var(--core-danger)",
              margin: 0,
            }}
          >
            {error}
          </p>
        </div>
      </ExecutiveShell>
    );
  }

  return (
    <ExecutiveShell activePath="/executive/digest">
      <PageHeader
        title="Weekly Leadership Briefings"
        description="Compile and review weekly summaries mapped from PostgreSQL digests tables."
      />

      {/* Assembly Panel */}
      <div
        className="core-panel"
        style={{
          marginBottom: 32,
          background: "var(--core-surface-muted)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Active Session Period:
            </span>

            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "var(--core-radius-sm)",
                border: "1px solid var(--core-border)",
                background: "var(--core-surface)",
                fontWeight: 500,
                fontSize: "14px",
                color: "var(--core-text)",
              }}
            >
              <option value="week-28">
                Current Week (Live database logs)
              </option>
            </select>
          </div>

          <button
            type="button"
            className="core-button core-button-primary"
            onClick={handleAssembleBriefing}
            disabled={isGenerating}
            style={{
              background: "var(--core-executive)",
              borderColor: "var(--core-executive)",
            }}
          >
            <SparklesIcon />

            {isGenerating
              ? "Compiling..."
              : "Assemble Weekly Briefing"}
          </button>
        </div>
      </div>

      {/* Generating Loader */}
      {isGenerating && (
        <div
          className="core-panel"
          style={{
            marginBottom: 32,
            textAlign: "center",
            padding: "48px 0",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid var(--core-border)",
              borderTop: "3px solid var(--core-executive)",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 1s linear infinite",
            }}
          />

          <style>
            {`
              @keyframes spin {
                0% {
                  transform: rotate(0deg);
                }

                100% {
                  transform: rotate(360deg);
                }
              }
            `}
          </style>

          <p
            style={{
              fontWeight: 600,
              margin: 0,
            }}
          >
            Compiling datastore elements...
          </p>
        </div>
      )}

      {/* Active Briefing Editor and Highlights */}
      {hasGenerated && !isGenerating && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 24,
            marginBottom: 32,
          }}
        >
          {/* Live Editor */}
          <div
            className="core-panel"
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h2
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    color: "var(--core-executive)",
                  }}
                >
                  <EditIcon />
                </span>

                Digest Narrative Editor
              </h2>

              <button
                type="button"
                className="core-button core-button-sm"
                onClick={() =>
                  alert(
                    "Simulated Export: Briefing has been copied to clipboard!"
                  )
                }
                style={{
                  fontSize: "12px",
                  minHeight: 28,
                }}
              >
                <ExportIcon />
                Export
              </button>
            </div>

            {/* REAL AI REPORT IS DISPLAYED HERE */}
            <textarea
              value={briefingText}
              onChange={(e) => setBriefingText(e.target.value)}
              style={{
                flex: 1,
                minHeight: "220px",
                padding: 16,
                borderRadius: "var(--core-radius-sm)",
                border: "1px solid var(--core-border)",
                fontFamily: "var(--core-font-sans)",
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--core-text)",
                background: "var(--core-bg)",
                resize: "vertical",
              }}
            />
          </div>

          {/* Highlights */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div
              className="core-panel"
              style={{
                flex: 1,
              }}
            >
              <h3
                style={{
                  borderBottom: "1px solid var(--core-border)",
                  paddingBottom: 8,
                  color: "var(--core-success)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{ marginRight: 6 }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>

                Key Highlights
              </h3>

              <ul
                style={{
                  paddingLeft: 16,
                  margin: "12px 0 0",
                  fontSize: "13px",
                  color: "var(--core-text-muted)",
                  lineHeight: 1.6,
                }}
              >
                <li>
                  Live database connection has been configured successfully.
                </li>

                <li>
                  AI-generated executive digest has been loaded from the live
                  backend.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Historical Logs / Existing Table */}
      <DataTable
        title="Weekly Digests Audit Log History"
        columns={columns}
        rows={history}
        rowKey={(row) => row.id}
      />
    </ExecutiveShell>
  );
}

















































// "use client";

// import { useState, useEffect } from "react";
// import { ExecutiveShell } from "@/components/executive-shell";
// import { PageHeader } from "@/components/page-header";
// import { MetricCard } from "@/components/metric-card";
// import { DataTable, type DataTableColumn } from "@/components/data-table";

// // Custom SVGs
// const SparklesIcon = () => (
//   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
//     <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
//   </svg>
// );

// const EditIcon = () => (
//   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
//     <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
//     <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
//   </svg>
// );

// const ExportIcon = () => (
//   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
//     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
//     <polyline points="7 10 12 15 17 10" />
//     <line x1="12" y1="15" x2="12" y2="3" />
//   </svg>
// );

// interface DigestHistory {
//   id: string;
//   week: string;
//   date: string;
//   author: string;
//   status: "Draft" | "Published";
//   summary: string;
// }

// export default function ExecutiveDigestPage() {
//   const [history, setHistory] = useState<DigestHistory[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [selectedWeek, setSelectedWeek] = useState("week-28");
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [hasGenerated, setHasGenerated] = useState(false);
//   const [briefingText, setBriefingText] = useState("");

//   // Fetch digests history
//   useEffect(() => {
//     setLoading(true);
//     fetch("/executive/api?action=digests")
//       .then((res) => {
//         if (!res.ok) throw new Error("Failed to fetch weekly digests history");
//         return res.json();
//       })
//       .then((data) => {
//         if (data.error) throw new Error(data.error);
//         setHistory(data);
//         setError(null);
//       })
//       .catch((err) => {
//         console.error(err);
//         setError(err.message);
//       })
//       .finally(() => {
//         setLoading(false);
//       });
//   }, []);

//   const columns: DataTableColumn<DigestHistory>[] = [
//     { key: "week", header: "Reporting Period", sortable: true },
//     { key: "date", header: "Date Generated", sortable: true },
//     { key: "author", header: "Assembled By", sortable: true },
//     {
//       key: "status",
//       header: "Status",
//       sortable: true,
//       render: (row) => (
//         <span style={{
//           display: "inline-block",
//           padding: "3px 8px",
//           borderRadius: "var(--core-radius-sm)",
//           backgroundColor: row.status === "Published" ? "var(--core-success-soft)" : "var(--core-warning-soft)",
//           color: row.status === "Published" ? "var(--core-success)" : "var(--core-warning)",
//           fontSize: "12px",
//           fontWeight: 600
//         }}>
//           {row.status}
//         </span>
//       )
//     },
//     {
//       key: "id" as any,
//       header: "Actions",
//       render: (row) => (
//         <button
//           type="button"
//           className="core-button core-button-sm core-button-ghost"
//           style={{ minHeight: 28, fontSize: "12px" }}
//           onClick={() => {
//             setBriefingText(row.summary);
//             setHasGenerated(true);
//           }}
//         >
//           Load Summary
//         </button>
//       )
//     }
//   ];

//   const handleAssembleBriefing = () => {
//     setIsGenerating(true);
//     setTimeout(() => {
//       setBriefingText(
//         `WEEKLY BRIEFING: COHORT MOVEMENT SUMMARY\n` +
//         `-----------------------------------------\n` +
//         `Generated from the live database logs. This reporting period details operational performance metrics.\n\n` +
//         `Summary details will be processed through the backend AI Service layer once integrated.\n` +
//         `You can use this text editor to manually write or append operational updates.`
//       );
//       setIsGenerating(false);
//       setHasGenerated(true);
//     }, 800);
//   };

//   if (loading) {
//     return (
//       <ExecutiveShell activePath="/executive/digest">
//         <PageHeader title="Weekly Leadership Briefings" description="Connecting to live database..." />
//         <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
//           <div style={{ width: "30px", height: "30px", border: "3px solid var(--core-border)", borderTop: "3px solid var(--core-executive)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
//         </div>
//       </ExecutiveShell>
//     );
//   }

//   if (error) {
//     return (
//       <ExecutiveShell activePath="/executive/digest">
//         <PageHeader title="Weekly Leadership Briefings" description="Connection Error" />
//         <div className="core-panel" style={{ border: "1px solid var(--core-danger)", background: "var(--core-danger-soft)", color: "var(--core-danger)", padding: 20 }}>
//           <h2 style={{ color: "var(--core-danger)", margin: "0 0 10px" }}>Database Connection Failed</h2>
//           <p style={{ color: "var(--core-danger)", margin: 0 }}>{error}</p>
//         </div>
//       </ExecutiveShell>
//     );
//   }

//   return (
//     <ExecutiveShell activePath="/executive/digest">
//       <PageHeader
//         title="Weekly Leadership Briefings"
//         description="Compile and review weekly summaries mapped from PostgreSQL digests tables."
//       />

//       {/* Assembly Panel */}
//       <div className="core-panel" style={{ marginBottom: 32, background: "var(--core-surface-muted)" }}>
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
//           <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
//             <span style={{ fontWeight: 600, fontSize: "14px" }}>Active Session Period:</span>
//             <select
//               value={selectedWeek}
//               onChange={(e) => setSelectedWeek(e.target.value)}
//               style={{
//                 padding: "8px 12px",
//                 borderRadius: "var(--core-radius-sm)",
//                 border: "1px solid var(--core-border)",
//                 background: "var(--core-surface)",
//                 fontWeight: 500,
//                 fontSize: "14px",
//                 color: "var(--core-text)"
//               }}
//             >
//               <option value="week-28">Current Week (Live database logs)</option>
//             </select>
//           </div>
          
//           <button
//             type="button"
//             className="core-button core-button-primary"
//             onClick={handleAssembleBriefing}
//             disabled={isGenerating}
//             style={{ background: "var(--core-executive)", borderColor: "var(--core-executive)" }}
//           >
//             <SparklesIcon />
//             {isGenerating ? "Compiling..." : "Assemble Weekly Briefing"}
//           </button>
//         </div>
//       </div>

//       {/* Generating Skeleton Loader */}
//       {isGenerating && (
//         <div className="core-panel" style={{ marginBottom: 32, textAlign: "center", padding: "48px 0" }}>
//           <div style={{
//             width: "40px",
//             height: "40px",
//             border: "3px solid var(--core-border)",
//             borderTop: "3px solid var(--core-executive)",
//             borderRadius: "50%",
//             margin: "0 auto 16px",
//             animation: "spin 1s linear infinite"
//           }} />
//           <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
//           <p style={{ fontWeight: 600, margin: 0 }}>Compiling datastore elements...</p>
//         </div>
//       )}

//       {/* Active Briefing Editor and Highlights */}
//       {hasGenerated && !isGenerating && (
//         <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, marginBottom: 32 }}>
          
//           {/* Live Editor */}
//           <div className="core-panel" style={{ display: "flex", flexDirection: "column" }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
//               <h2 style={{ display: "flex", alignItems: "center" }}>
//                 <span style={{ display: "flex", color: "var(--core-executive)" }}><EditIcon /></span>
//                 Digest Narrative Editor
//               </h2>
//               <button
//                 type="button"
//                 className="core-button core-button-sm"
//                 onClick={() => alert("Simulated Export: Briefing has been copied to clipboard!")}
//                 style={{ fontSize: "12px", minHeight: 28 }}
//               >
//                 <ExportIcon />
//                 Export
//               </button>
//             </div>
//             <textarea
//               value={briefingText}
//               onChange={(e) => setBriefingText(e.target.value)}
//               style={{
//                 flex: 1,
//                 minHeight: "220px",
//                 padding: 16,
//                 borderRadius: "var(--core-radius-sm)",
//                 border: "1px solid var(--core-border)",
//                 fontFamily: "var(--core-font-sans)",
//                 fontSize: "14px",
//                 lineHeight: 1.6,
//                 color: "var(--core-text)",
//                 background: "var(--core-bg)",
//                 resize: "vertical"
//               }}
//             />
//           </div>

//           {/* Highlights & Decisions Cards */}
//           <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
//             <div className="core-panel" style={{ flex: 1 }}>
//               <h3 style={{ borderBottom: "1px solid var(--core-border)", paddingBottom: 8, color: "var(--core-success)", display: "flex", alignItems: "center" }}>
//                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}><polyline points="20 6 9 17 4 12" /></svg>
//                 Key Highlights
//               </h3>
//               <ul style={{ paddingLeft: 16, margin: "12px 0 0", fontSize: "13px", color: "var(--core-text-muted)", lineHeight: 1.6 }}>
//                 <li>Live database connection has been configured successfully.</li>
//                 <li>System tracks {history.length} weekly published logs.</li>
//               </ul>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Historical Logs */}
//       <DataTable
//         title="Weekly Digests Audit Log History"
//         columns={columns}
//         rows={history}
//         rowKey={(row) => row.id}
//       />
//     </ExecutiveShell>
//   );
// }
