-- Add teacher category and monthly file requirements table

-- First, update the employee category enum if it doesn't include teacher
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'employee_category' AND e.enumlabel = 'teacher'
    ) THEN
        ALTER TYPE employee_category ADD VALUE 'teacher';
    END IF;
END $$;

-- Create monthly_file_requirements table
CREATE TABLE IF NOT EXISTS monthly_file_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'overdue')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    file_id UUID REFERENCES activity_files(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, year, month)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_monthly_file_requirements_employee_id ON monthly_file_requirements(employee_id);
CREATE INDEX IF NOT EXISTS idx_monthly_file_requirements_year_month ON monthly_file_requirements(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_file_requirements_status ON monthly_file_requirements(status);
CREATE INDEX IF NOT EXISTS idx_monthly_file_requirements_due_date ON monthly_file_requirements(due_date);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_monthly_file_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_monthly_file_requirements_updated_at
    BEFORE UPDATE ON monthly_file_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_monthly_file_requirements_updated_at();
