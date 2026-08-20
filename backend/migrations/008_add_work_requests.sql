CREATE TABLE IF NOT EXISTS work_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES people(id),
  department_id UUID REFERENCES departments(id),
  assignee_id UUID REFERENCES people(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_work_requests_requester_created ON work_requests (requester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_work_requests_department_status ON work_requests (department_id, status);
