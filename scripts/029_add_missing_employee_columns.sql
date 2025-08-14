-- Add missing columns to employees table
DO $$
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'status') THEN
        ALTER TABLE employees ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
    
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'category') THEN
        ALTER TABLE employees ADD COLUMN category VARCHAR(20) DEFAULT 'regular';
    END IF;
END $$;

-- Update existing employees with smart categorization
UPDATE employees 
SET category = CASE 
    WHEN LOWER(position) LIKE '%teacher%' OR LOWER(position) LIKE '%professor%' OR LOWER(department) = 'education' THEN 'teacher'
    WHEN LOWER(department) IN ('cleaning', 'security', 'maintenance') THEN 'outsourced'
    ELSE 'regular'
END
WHERE category = 'regular';

-- Set all existing employees as active
UPDATE employees SET status = 'active' WHERE status IS NULL;

-- Add constraints
ALTER TABLE employees ALTER COLUMN status SET NOT NULL;
ALTER TABLE employees ALTER COLUMN category SET NOT NULL;

-- Add check constraints
ALTER TABLE employees ADD CONSTRAINT chk_employee_status CHECK (status IN ('active', 'inactive'));
ALTER TABLE employees ADD CONSTRAINT chk_employee_category CHECK (category IN ('regular', 'outsourced', 'teacher'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_category ON employees(category);
CREATE INDEX IF NOT EXISTS idx_employees_status_category ON employees(status, category);

-- Verify the changes
SELECT 
    'Total employees' as metric, 
    COUNT(*) as count 
FROM employees
UNION ALL
SELECT 
    'Active employees' as metric, 
    COUNT(*) as count 
FROM employees WHERE status = 'active'
UNION ALL
SELECT 
    'Teachers' as metric, 
    COUNT(*) as count 
FROM employees WHERE category = 'teacher'
UNION ALL
SELECT 
    'Regular employees' as metric, 
    COUNT(*) as count 
FROM employees WHERE category = 'regular'
UNION ALL
SELECT 
    'Outsourced employees' as metric, 
    COUNT(*) as count 
FROM employees WHERE category = 'outsourced';
