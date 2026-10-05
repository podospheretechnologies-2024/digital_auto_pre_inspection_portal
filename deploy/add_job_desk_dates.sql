-- Desk-arrival timestamps for workflow listings
ALTER TABLE tbl_jobs
  ADD COLUMN assigned_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN hold_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN cancelled_at TIMESTAMP NULL DEFAULT NULL;
