-- Add period column to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS period TEXT CHECK (period IN ('morning', 'afternoon')) DEFAULT 'morning';

-- Update the unique constraint to include period
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_employee_id_date_key;
ALTER TABLE attendance ADD CONSTRAINT attendance_employee_id_date_period_key UNIQUE(employee_id, date, period);

-- Update justification types to include new options
ALTER TABLE attendance_justifications DROP CONSTRAINT IF EXISTS attendance_justifications_justification_type_check;
ALTER TABLE attendance_justifications ADD CONSTRAINT attendance_justifications_justification_type_check 
  CHECK (justification_type IN ('medical', 'justified', 'banked_hours', 'other', 'course', 'recess', 'meeting'));

-- Create index for period queries
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date_period ON attendance(employee_id, date, period);
