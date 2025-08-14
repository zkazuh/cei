-- Add category column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('regular', 'outsourced')) DEFAULT 'regular';

-- Create index for category queries
CREATE INDEX IF NOT EXISTS idx_employees_category ON employees(category);

-- Update some existing employees to be outsourced for demo
UPDATE employees SET category = 'outsourced' WHERE employee_number IN ('EMP005', 'EMP006');
