-- Migration 007: Add priority column to assignments table
-- Stores assignment priority level: Critical, High, Medium (default), Low

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'Medium';

COMMENT ON COLUMN assignments.priority IS 'Task priority: Critical | High | Medium | Low';
