-- Migration: Add rate_type to employees, hours_worked & waived_amount to work_records, settle_in_full to payments

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS rate_type VARCHAR(20) NOT NULL DEFAULT 'DAILY';

ALTER TABLE work_records
ADD COLUMN IF NOT EXISTS hours_worked NUMERIC(5,2) NULL,
ADD COLUMN IF NOT EXISTS waived_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00;

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS settle_in_full BOOLEAN NOT NULL DEFAULT FALSE;
