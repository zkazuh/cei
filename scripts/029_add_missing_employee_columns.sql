-- Add missing columns to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('regular', 'outsourced', 'teacher')) DEFAULT 'regular';

-- Update existing employees with appropriate status and category
UPDATE employees 
SET status = 'active' 
WHERE status IS NULL;

UPDATE employees 
SET category = CASE 
    WHEN position ILIKE '%teacher%' OR position ILIKE '%professor%' OR department = 'Education' THEN 'teacher'
    WHEN department IN ('Cleaning', 'Security', 'Maintenance') THEN 'outsourced'
    ELSE 'regular'
END
WHERE category IS NULL;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_category ON employees(category);

-- Verify the changes
SELECT 
    COUNT(*) as total_employees,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_employees,
    COUNT(CASE WHEN category = 'teacher' THEN 1 END) as teachers,
    COUNT(CASE WHEN category = 'regular' THEN 1 END) as regular_employees,
    COUNT(CASE WHEN category = 'outsourced' THEN 1 END) as outsourced_employees
FROM employees;
