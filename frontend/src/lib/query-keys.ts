export const queryKeys = {
  assignments: ["assignments"] as const,
  assignment: (assignmentId: string) => ["assignments", assignmentId] as const,
  projects: ["projects"] as const,
  project: (projectId: string) => ["projects", projectId] as const,
  people: ["people"] as const,
  person: (personId: string) => ["people", personId] as const,
  digest: ["digest"] as const,
  alerts: ["alerts"] as const,
};
