-- Update employee category to include teacher
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_category_check;
ALTER TABLE employees ADD CONSTRAINT employees_category_check 
  CHECK (category IN ('regular', 'outsourced', 'teacher'));

-- Create monthly file requirements table
CREATE TABLE IF NOT EXISTS monthly_file_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  due_date DATE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'submitted', 'overdue')) NOT NULL DEFAULT 'pending',
  submitted_file_id UUID REFERENCES activity_files(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(employee_id, year, month)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_monthly_requirements_employee ON monthly_file_requirements(employee_id);
CREATE INDEX IF NOT EXISTS idx_monthly_requirements_due_date ON monthly_file_requirements(due_date);
CREATE INDEX IF NOT EXISTS idx_monthly_requirements_status ON monthly_file_requirements(status);
CREATE INDEX IF NOT EXISTS idx_monthly_requirements_year_month ON monthly_file_requirements(year, month);

-- Create trigger for updated_at
CREATE TRIGGER update_monthly_file_requirements_updated_at 
  BEFORE UPDATE ON monthly_file_requirements 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
